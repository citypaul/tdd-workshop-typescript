# Integration patterns

The domain has no outside world — it is a pure TypeScript module. The API does. It reads and writes a store, and it calls a downstream notifications service. This document explains how we model those integrations, how we test them, and which tradeoffs we accept.

Two techniques do most of the work:

- **Ports and adapters.** Every integration is a port (a narrow TypeScript type describing what the app needs) and at least one adapter (a concrete implementation). Tests inject their own adapters.
- **MSW at the network boundary.** When an adapter talks to something over the network, tests intercept that network traffic with [MSW](https://mswjs.io). We do not mock the adapter. We do not stub `fetch`. We let real code run and we replace the wire.

## Ports we currently have

| Port                  | File                                                   | Consumed by          | Why it's a port                                                                                               |
| --------------------- | ------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Store`               | `src/demo-booking-system/api/store.ts`                 | Every Hono handler   | Persistence is going to change (Postgres, DynamoDB, Redis) but the domain operations don't                    |
| `NotificationsClient` | `src/demo-booking-system/api/clients/notifications.ts` | `POST /api/bookings` | The downstream service is owned by another team and could be replaced; we depend on the _shape_, not the wire |
| `now`                 | injected into `createApp`                              | `POST /api/bookings` | Time is an external effect; validating "no bookings in the past" requires a mockable clock                    |

Each port is a TypeScript `type` with `readonly` members and parameter objects — the same conventions as the rest of the codebase. Adapters are factory functions: `makeInMemoryStore`, `makeHttpNotificationsClient`. No classes, no `new`, no inheritance.

The `now` port is the smallest example of test-first design pressure. If the domain reached directly into `new Date()`, the "no past bookings" rule would be coupled to the wall clock and the tests would need global clock tricks. Passing `now` into the API, then into `validateBooking`, makes the date-sensitive rule deterministic and keeps the production code honest about its dependency on time.

Id generation lives on the `Store` port itself — `saveBooking({ request })` returns a `Booking` with the id stamped, the same shape real ORMs expose via `repo.save(entity)`. Production wires `crypto.randomUUID()` into `makeInMemoryStore` from `src/demo-booking-system/api/main.ts`; tests either take the test-factory default or pass their own deterministic `nextId` when an assertion needs to pin the id. Making id generation a concern of the repository (not a top-level port on `createApp`) matches how real apps do it and avoids a wiring-surface abstraction that wouldn't exist in production codebases.

## When to introduce a port

Introduce a port when **behaviour** needs to swap, not just **configuration**. Three useful tests:

1. **Would you need a different implementation in a test?** `Store` — yes, tests want an in-memory seed, not real Postgres. `NotificationsClient` — yes, tests want to assert on the outbound payload, not hit a live service.
2. **Would you need a different implementation in production later?** If the shape is stable but the wire could move (SQL → NoSQL, REST → gRPC), a port insulates you. If the wire is frozen (you own both sides and they'll never change), the abstraction has no payoff.
3. **Is the integration load-bearing for a business rule?** If the domain's correctness depends on it (capacity comes from the store), a port makes the dependency explicit and testable.

Do not introduce a port for internal helpers. A function that formats a date string is not a port — it's a function. The port boundary exists specifically where the app crosses into infrastructure.

## Testing philosophy at the integration boundary

We test behaviour at the HTTP boundary, and we never assert on internals of the adapter.

| ✅ Do this                                                                                                        | ❌ Don't do this                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Send an HTTP request to the Hono app and assert on status + body                                                  | Spy on `store.saveBooking` and assert it was called                 |
| For request-response flows: bake validation into the MSW handler and assert on the user-visible outcome           | Call `notifications.bookingCreated` in the test and assert on spies |
| For one-way flows: observe the outbound request via MSW's life-cycle events API                                   | Assign request captures to an outer `let` from inside a handler     |
| Configure MSW with `onUnhandledRequest: 'error'` so URL drift surfaces as a test failure                          | Assert on the exact URL string the adapter constructs               |
| Test the adapter indirectly through the behaviour it enables (request arrives at the right place, shape is right) | Unit-test the adapter's implementation details (mocking `fetch`)    |

The reason is simple: spies and implementation assertions mirror the code structure. When you refactor the handler to call the client differently, or move the adapter behind a queue, those tests shatter. Behavioural assertions — what the user sees, or what a downstream actually receives — continue to pass because they describe what the system guarantees, not how it gets there.

### MSW's own guidance — and where we land

[MSW's best-practices docs](https://mswjs.io/docs/best-practices/avoid-request-assertions) argue against asserting on captured requests because the pattern tests implementation detail. The recommended replacements are:

- **Request-response flows** — if the app observably reacts to the downstream's response (for example, a login form that flashes "wrong password" when the server says 401), bake the validation into the handler. Return the appropriate error from MSW itself, and assert on the user-visible outcome (status code, error message, redirect). Your test no longer looks at the request at all; it looks at what the app does when the request is wrong.
- **One-way flows** — if the app does not observably react to the downstream's response (log-and-continue notifications, analytics, monitoring), handler-level validation has nothing to react to. Use MSW's **life-cycle events API** (`server.events.on('request:start', …)`). MSW blesses this explicitly as the escape hatch for one-way flows.

Our notifications test is a one-way flow by design (the POST returns 201 regardless of whether the notification succeeded, as documented in the Resilience section below). We therefore observe the outbound request through life-cycle events, wrapped in the `captureJsonPost({ server, url })` helper in `src/demo-booking-system/test/msw.ts`. PR 6's component tests (login-style interactions, if any) will use the request-response pattern instead.

## MSW as a uniform tool across layers

This repo uses MSW at three different test layers. The pattern is the same each time; only the scope changes.

| Layer                                   | What MSW intercepts                                             | Where handlers live                         |
| --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------- |
| **API layer** (`notifications.test.ts`) | Outbound `fetch` calls from the Hono handler to downstream APIs | Declared inline per test via `server.use()` |
| **Component layer** (PR 6, forthcoming) | Calls from React components to the Hono API                     | Declared inline per test                    |
| **Acceptance layer** (PR 7)             | Every backend call — the frontend runs against mocked APIs      | Per-scenario helper factories               |

Because the tool is the same at every layer, engineers only need to learn one mental model. At each layer the rule holds: we describe what the network _should_ do, and let the real code exercise it.

## Resilience patterns

The notifications integration is a **log-and-continue** relationship. The booking has already been persisted when we call the downstream service; if it fails, we swallow the failure and still return `201` to the client. This is encoded as:

```ts
store.saveBooking({ booking });

try {
  await notifications.bookingCreated({ booking });
} catch {
  // log-and-continue: booking is persisted; downstream failure must not
  // bubble to the client
}

return c.json(booking, 201);
```

Three common patterns are worth naming because the choice between them is a business decision, not a technical one:

- **Fail-fast.** The API's response depends on the downstream's success. Any failure propagates to the client as 5xx. Use when correctness requires the downstream — for example, a payment authorisation.
- **Log-and-continue.** The primary effect (persisting the booking) has already happened. The secondary effect (sending a notification) is best-effort. Failures are caught and swallowed; observability lives elsewhere (logs, metrics, retry queues). Use when the downstream is advisory.
- **Fire-and-forget.** The handler doesn't even await the call. Maximum speed for the client; maximum risk of lost effects if the process dies mid-flight. Use rarely, and usually in conjunction with an outbox or queue that guarantees the effect will eventually happen.

We use log-and-continue for notifications because losing a single notification is worse for no one than losing a booking. A retry layer (or an outbox) would be the natural next step in a production system; for a teaching demo we keep the shape minimal and document the tradeoff.

## The BFF nuance

If this API only ever served our own frontend, it would be a backend-for-frontend (BFF). In that mode, the API's value is aggregating and reshaping one or more downstream services for the client that calls it. The port/adapter pattern carries its weight even more clearly there: the BFF's tests are almost entirely about orchestration (did we call the right downstreams, did we merge their results, did we handle partial failures), and MSW lets you assert exactly that without standing up real downstreams.

This demo's API is intentionally small — one downstream, one fan-out — but the pattern scales. If you found yourself building a BFF, you'd likely grow:

- More ports (`CustomersClient`, `CatalogueClient`, `AnalyticsClient`)
- Shared HTTP helpers (retries, circuit breakers, tracing headers)
- A strict shape contract with each downstream, enforced by Zod on the way in

None of those change the testing model: MSW intercepts at the wire, tests assert on behaviour, adapters remain thin.

## Mutation testing against integration code

Stryker reaches every file the API depends on, including the notifications adapter. A mutation that changes the adapter's URL, method, or payload must fail a test. The happy-path test does the work here: MSW is configured to error on unmatched requests (`onUnhandledRequest: 'error'`) so a mutated URL no longer reaches the handler and the test fails, rather than silently passing because nothing asserted on the absence of a call.

The resilience test catches the inverse: a mutation that removes the handler's `try`/`catch` or changes "swallow and continue" to "propagate" turns the 201 response into a 500. We observe both paths; mutation score stays at 100%.
