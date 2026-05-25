# Booking API Endpoints

Business requirements for the HTTP surface of the booking system. Every scenario below is reflected by a behavioural test in `src/demo-booking-system/api/*.test.ts` that exercises the Hono app through `app.request(...)` — the same entry point the browser uses. No handlers are unit-tested in isolation.

## Shape

- All endpoints live under the `/api` prefix.
- Every 4xx response has body shape `{ error: string }`. Rule-violation 4xx responses additionally carry `{ rule: RuleId }` so clients can highlight the specific rule in the UI.
- Every 5xx response has body shape `{ error: 'Internal server error' }`. The server never leaks stack traces, Zod field paths, or exception messages.
- Every validated request is checked with a Zod schema configured `.strict()` so unknown fields are rejected.

## Endpoints at a glance

| Method | Path            | Status         |
| ------ | --------------- | -------------- |
| GET    | `/api/rooms`    | ✅ implemented |
| GET    | `/api/bookings` | ✅ implemented |
| POST   | `/api/bookings` | ✅ implemented |

Legend: ✅ implemented · 🚧 in progress · ⬜ not started

Format note: this document uses **Given/When/Then labels** as plain-language scaffolding for acceptance examples only. This is not Gherkin and not a recommendation to use Cucumber. The tests themselves use natural-prose names about observable HTTP behaviour (see `src/demo-booking-system/api/rooms.test.ts`, `src/demo-booking-system/api/bookings.test.ts`, `src/demo-booking-system/api/notifications.test.ts`, `src/demo-booking-system/api/responses.test.ts`).

---

## Endpoint: `GET /api/rooms`

### Why it matters

The UI renders a room selector before anything else happens. Exposing the seeded rooms via a stable HTTP contract lets the frontend list them without coupling to the store's implementation.

### Scenario 1 — returns every seeded room

- **Given** the store is seeded with `{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }`
- **When** the client issues `GET /api/rooms`
- **Then** the response is `200` with body `[{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]`

### Scenario 2 — an unexpected failure flows through the unified handler

- **Given** the store throws on `listRooms()`
- **When** the client issues `GET /api/rooms`
- **Then** the response is `500` with body `{ error: 'Internal server error' }`
  (the exception is absorbed by `attachErrorHandler`; no stack reaches the client)

---

## Endpoint: `GET /api/bookings?roomId=…`

### Why it matters

The timeline is per-room. The API must allow the client to ask "what's booked in this room?" and must reject shaped-wrong queries deterministically rather than silently returning everything.

### Scenario 1 — returns the room's bookings

- **Given** the store holds a booking in room `boardroom`
- **When** the client issues `GET /api/bookings?roomId=boardroom`
- **Then** the response is `200` with a JSON array containing that booking (dates serialised as ISO strings)

### Scenario 2 — filters out bookings in other rooms

- **Given** the store holds a booking in `boardroom` and a booking in `war-room`
- **When** the client issues `GET /api/bookings?roomId=boardroom`
- **Then** the response body contains only the `boardroom` booking

### Scenario 3 — returns `[]` when the room has no bookings

- **Given** the store holds no bookings for room `boardroom`
- **When** the client issues `GET /api/bookings?roomId=boardroom`
- **Then** the response is `200` with body `[]`

### Scenario 4 — rejects a missing `roomId`

- **When** the client issues `GET /api/bookings` with no query string
- **Then** the response is `400` with body `{ error: 'Invalid request' }`

### Scenario 5 — rejects an empty `roomId`

- **When** the client issues `GET /api/bookings?roomId=`
- **Then** the response is `400` with body `{ error: 'Invalid request' }`

### Scenario 6 — rejects unknown query keys

- **When** the client issues `GET /api/bookings?roomId=boardroom&tenant=acme`
- **Then** the response is `400` with body `{ error: 'Invalid request' }`
  (the schema is strict; additional fields are not silently ignored)

---

## Endpoint: `POST /api/bookings`

### Why it matters

The only way a booking enters the system. Every domain rule must be enforced again at this boundary (defence in depth; see `docs/testing-strategy.md`), every body field must be shape-checked at the edge, and successful creates must notify the downstream notifications service without blocking the client on its availability.

### Happy path

#### Scenario 1 — creates a booking with an injected id and returns `201`

- **Given** the store holds `{ id: 'boardroom', capacity: 12 }` and no existing bookings
- **And** the store's next id yields `'b1'` and `now()` yields `2026-05-01T09:00:00Z`
- **When** the client POSTs `{ roomId: 'boardroom', start: '2026-05-01T10:00:00Z', end: '2026-05-01T11:00:00Z', attendees: 4 }`
- **Then** the response is `201` with body `{ id: 'b1', roomId: 'boardroom', start: '...T10:00:00.000Z', end: '...T11:00:00.000Z', attendees: 4 }`

#### Scenario 2 — creates and returns a booking with a purpose

- **Given** the store holds `{ id: 'boardroom', capacity: 12 }` and no existing bookings
- **And** the store's next id yields `'b1'`
- **When** the client POSTs a valid booking body with `purpose: 'Quarterly planning'`
- **Then** the response is `201` with the created booking including `purpose: 'Quarterly planning'`

#### Scenario 3 — the created booking is returned by a subsequent `GET`

- **Given** a successful POST to `/api/bookings`
- **When** the client issues `GET /api/bookings?roomId=boardroom`
- **Then** the response body contains the newly-created booking
- **And** if the booking was created with a purpose, the returned booking includes that purpose

### Body validation

#### Scenario 4 — rejects a body missing required fields

- **When** the client POSTs `{ roomId: 'boardroom' }`
- **Then** the response is `400` with body `{ error: 'Invalid request' }`

#### Scenario 5 — rejects a body with each required field missing

- **When** the client omits `roomId`, `start`, `end`, or `attendees` one at a time
- **Then** each response is `400` with body `{ error: 'Invalid request' }`

#### Scenario 6 — rejects a body with wrong types

- **When** the client POSTs `{ roomId: 'boardroom', start: 'yesterday', end: 'tomorrow', attendees: 'four' }`
- **Then** the response is `400` with body `{ error: 'Invalid request' }`

#### Scenario 7 — rejects malformed field values at their own boundaries

- **When** the client POSTs `roomId: ''`, `attendees: 0`, or `attendees: 1.5`
- **Then** each response is `400` with body `{ error: 'Invalid request' }`
  (these are request-shape guarantees, not domain rule pass-throughs)

#### Scenario 8 — accepts a roomId with a single character

- **Given** the store contains a room with `id: 'a'`
- **When** the client POSTs a valid booking body with `roomId: 'a'`
- **Then** the response is `201`
  (single-character ids are valid; empty ids are not)

#### Scenario 9 — rejects a body with unknown fields

- **When** the client POSTs a valid body with an additional `tenant: 'acme'` field
- **Then** the response is `400` with body `{ error: 'Invalid request' }`

#### Scenario 10 — routes malformed JSON through the 500 unified handler

- **When** the client POSTs the literal text `{not-json` with `Content-Type: application/json`
- **Then** the response is `500` with body `{ error: 'Internal server error' }`
  (design choice: malformed JSON is treated as an unexpected transport parse failure; shape-validation errors still return `400` via Zod.)

#### Scenario 11 — rejects a roomId that matches no seeded room

- **Given** the store has been seeded with rooms that do not include `unknown-room`
- **When** the client POSTs a valid body with `roomId: 'unknown-room'`
- **Then** the response is `400` with body `{ error: 'Invalid request' }`
  (the handler cannot run `validateBooking` without a real room; we short-circuit with the generic client-error response)

### Domain rule pass-through

Every domain rule that can be reached after request-shape validation must surface through the HTTP boundary as `400 { error, rule }`. The error message and rule id are the ones the domain already owns. `positive-attendees` is intentionally enforced earlier by the Zod body schema, so zero and fractional attendee counts return the generic `{ error: 'Invalid request' }` shape-validation response.

#### Scenario 12 — the `no-past` rule

- **Given** `now()` yields `2026-05-01T12:00:00Z`
- **When** the client POSTs a booking starting at `2026-04-30T10:00:00Z`
- **Then** the response is `400` with body `{ error: 'Cannot book in the past', rule: 'no-past' }`

#### Scenario 13 — the `positive-duration` rule

- **When** the client POSTs a booking with equal `start` and `end`
- **Then** the response is `400` with body `{ error: 'Booking must have a positive duration', rule: 'positive-duration' }`

#### Scenario 14 — the `no-overlap` rule

- **Given** a booking already exists `10:00–11:00` in the room
- **When** the client POSTs a booking `10:30–11:30` in the same room
- **Then** the response is `400` with body `{ error: 'Conflicts with an existing booking', rule: 'no-overlap' }`

#### Scenario 15 — the `capacity` rule

- **Given** a room with `capacity: 4`
- **When** the client POSTs a booking with `attendees: 5`
- **Then** the response is `400` with body `{ error: 'Exceeds room capacity of 4', rule: 'capacity' }`

#### Scenario 16 — the `max-duration` rule

- **When** the client POSTs a booking longer than eight hours
- **Then** the response is `400` with body `{ error: 'Bookings cannot exceed 8 hours', rule: 'max-duration' }`

#### Scenario 17 — the `business-hours` rule

- **When** the client POSTs a booking that begins before `08:00` UTC
- **Then** the response is `400` with body `{ error: 'Bookings must be within business hours (8am–6pm)', rule: 'business-hours' }`

### Downstream notifications

On a successful create the API calls the `NotificationsClient` port, which in production posts to the URL configured via `NOTIFICATIONS_URL`. Tests intercept that call with `msw/node`.

#### Scenario 18 — notifies the downstream service with the created booking

- **Given** a configured `NotificationsClient` pointing at `http://notifications.test`
- **When** a valid booking is POSTed and succeeds
- **Then** `http://notifications.test/notifications/bookings` receives a `POST` with `Content-Type: application/json` and body `{ booking: <the created booking> }`

#### Scenario 19 — returns `201` even when the downstream is unreachable

- **Given** the notifications service returns a network error
- **When** a valid booking is POSTed
- **Then** the response is still `201` with the created booking
  (log-and-continue: the booking has been persisted, so downstream failures must not bubble to the client. See `docs/integration-patterns.md` for the three-pattern taxonomy.)

---

## Error response shapes (canonical)

| Class                          | Status | Body                                        |
| ------------------------------ | ------ | ------------------------------------------- |
| Rule violation                 | 400    | `{ error: <domain message>, rule: RuleId }` |
| Input shape / unknown resource | 400    | `{ error: 'Invalid request' }`              |
| Any unexpected exception       | 500    | `{ error: 'Internal server error' }`        |

Zod schemas, field paths, and stack traces never leave the server.
