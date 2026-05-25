# Acceptance / E2E Layer

Business requirements for the acceptance tests — the top of the testing pyramid. Each scenario below reads as a **user story**: a single, user-facing behaviour that a non-technical audience member in the workshop demo can read and understand.

Tests at this layer exercise the **full frontend** (Vite build, React mount, real `fetch`) in **real Chromium via Playwright**, with the HTTP boundary mocked by **[`playwright-msw`](https://github.com/valendres/playwright-msw)** at the driver layer.

- The app boots from `src/demo-booking-system/web/main.tsx` exactly as in production; it has no knowledge of tests. No `VITE_E2E` flag, no conditional imports, no window globals.
- Each test declares its scenario as standard MSW handlers via `worker.use(http.get(…), http.post(…))`. This is the same `http` / `HttpResponse` API the Vitest browser tests already use, so the acceptance and integration layers read identically.
- The recovery scenario switches behaviour mid-test by calling `worker.use(http.post(…))` a second time — runtime handler override, straight out of the MSW API.
- No backend process runs during acceptance tests — no ports, no `webServer` lifecycle on the Hono API side, no reset endpoints. Each test is a new Playwright page → new browser context → fresh MSW handlers → fully isolated world.

Each test name IS the acceptance criterion for a user flow. Reading the test list, engineers see the product's contract with its user.

## Shape

- `e2e/` at project root — Playwright specs.
  - `e2e/*.spec.ts` — one spec file per user story (one `test()` block each).
  - `e2e/fixtures.ts` — extends Playwright's `test` with a `worker: MockServiceWorker` fixture from `playwright-msw`. All specs import `test` and `expect` from here.
  - `e2e/handlers.ts` — default handlers (empty world) used as a safety net; tests override via `worker.use(…)`.
- `src/demo-booking-system/web/main.tsx` is pure production code — Vite serves the same bundle in dev and in acceptance runs.
- Playwright's `webServer` runs `pnpm dev` (on :5173), so `pnpm dev` and the acceptance suite share the same command.
- Idempotency is by construction: `playwright-msw` resets handlers between tests automatically.

## Layer at a glance

| Scenario                        | What it proves                                                                             | Status |
| ------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| User books an available room    | End-to-end wiring works — form submit reaches the API, the booking appears on the timeline | ✅     |
| User attempting a conflict      | The conflict story wires through — banner, overlay, and 1/7 Fail matrix all land           | ✅     |
| User changes the selected room  | Room switching refetches bookings and the timeline updates                                 | ✅     |
| User recovers after a rejection | Fixing the form and resubmitting clears the failure state and the new booking lands        | ✅     |

Legend: ✅ implemented · 🚧 in progress · ⬜ not started

Format note: this document uses **Given/When/Then labels** as plain-language scaffolding for acceptance examples only. This is not Gherkin and not a recommendation to use Cucumber. The tests themselves use natural-prose names, consistent with every other spec in this tree.

---

## Scenario 1 — a user books an available room and sees it on the timeline

### Why it matters

The happy-path E2E. Proves the real Vite bundle, the real React Query wiring, the real `fetch` → MSW round-trip, and the real timeline rendering all agree on shape. If every lower-layer test passes but this one fails, something broke at the integration seam.

### Acceptance criterion

- **Given** the API reports one room (`The Boardroom`, capacity 12) with no existing bookings
- **When** the user opens the app, accepts the form defaults (10:00–11:00, 4 attendees), enters purpose `"Quarterly planning"`, and clicks `Execute Booking`
- **Then** the new booking is visible on the timeline with `"Quarterly planning"` as its title
- **And** the Rule Matrix header reads `0/7 Pass`
- **And** no `RuleViolationBanner` is shown

---

## Scenario 2 — a user attempting an overlapping booking sees the conflict signal everywhere

### Why it matters

This is the single moment of the workshop demo that has to land visually: the audience needs to see that violating one rule lights up the _right_ visual in three distinct places at once — the banner under the form, the `CONFLICT DETECTED` overlay on the timeline, and the `no-overlap` row in the Rule Matrix flipping to `1/7 Fail`. A test that watches all three is the demo's safety net.

### Acceptance criterion

- **Given** the API has a booking `10:00–11:30` in `The Boardroom` and responds `400 { error: 'Conflicts with an existing booking', rule: 'no-overlap' }` on POST
- **When** the user submits the default form (10:00–11:00, 4 attendees) against the already-booked room
- **Then** the `ConflictOverlay` is visible on the attempted range (`CONFLICT DETECTED`)
- **And** the Rule Matrix `no-overlap` row is in the fail state, with header `1/7 Fail`
- **And** the `RuleViolationBanner` under the form reads `Conflicts with an existing booking`

---

## Scenario 3 — a user changes the selected room and sees that room's bookings

### Why it matters

Room switching is the only multi-room flow in the app, and it exercises the React Query cache-key pattern end-to-end. If the cache-key wiring drifts (for example, the key stops including `roomId`), the timeline displays stale bookings on room change. This test catches that drift from the user's seat, without knowing anything about React Query.

### Acceptance criterion

- **Given** the API reports two rooms (`The Boardroom`, `The War Room`), each with a distinct booking
- **When** the user opens the app (defaults to the Boardroom, sees its booking) and picks `The War Room` from the Room selector
- **Then** the timeline header reads `Timeline / The War Room`
- **And** the War Room's booking is visible on the timeline
- **And** the Boardroom's booking is no longer visible

---

## Scenario 4 — a user corrects the form after a rejection and succeeds

### Why it matters

Recovery is the flow that proves the error state is not a dead end. Users make mistakes and the app has to let them out. If React Query's mutation-error state stopped clearing on a successful retry, the banner and overlay would stick and the user would be trapped on a "conflict" screen after resolving the conflict. This test watches the full round trip: failure state → corrected input → success → banner gone, overlay gone, matrix passes, new booking lands.

### Acceptance criterion

- **Given** the user has submitted a conflicting booking and is looking at the banner + overlay + `1/7 Fail` matrix
- **When** they adjust the start/end times to a non-conflicting slot and resubmit
- **And** the API accepts with `201`
- **Then** the `RuleViolationBanner` is gone
- **And** the `ConflictOverlay` is gone (`CONFLICT DETECTED` is no longer in the document)
- **And** the Rule Matrix header chip returns to `0/7 Pass`
- **And** the newly-created booking appears on the timeline
