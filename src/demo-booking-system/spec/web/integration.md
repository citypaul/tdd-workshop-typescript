# Integration / App Layer

Business requirements for the pieces that wire the atomic and feature components into a working single-page app: the HTTP client, the hook that fetches bookings for the selected room, and the top-level `App.tsx` that holds state and routes events between the form, the timeline, and the rule matrix.

Tests at this layer exercise the real React rendering lifecycle in Chromium (Vitest Browser Mode) and intercept the network with **MSW at both ends**:

- **api-client** is tested against **`msw/node`** in the good-node project.
- **App integration tests** run in the browser project with **`msw/browser`**. A real `ApiClient` constructed against a known baseUrl runs inside the App; MSW intercepts the outbound `fetch` and answers per-scenario. No stubs or fakes of the api-client itself — the fetch wire is part of what's tested.

The `useBookings` hook is not tested in isolation. Its behaviour surfaces through the App scenarios.

## Shape

- `src/demo-booking-system/web/api-client.ts` — typed fetch wrapper exposing `getRooms`, `getBookings({ roomId })`, `createBooking({ request })`. Tested in `good-node` with `msw/node` (api-client is plain TS, no React).
- `src/demo-booking-system/web/use-bookings.ts` — `useBookings({ roomId, apiClient })` hook that fetches bookings on mount and whenever `roomId` changes, exposing `{ bookings, refetch }`. **The hook is implementation detail** of `App` and is **not tested in isolation** (`renderHook` is banned) — its contract surfaces through App's integration scenarios below.
- `src/demo-booking-system/web/App.tsx` — composes `Timeline`, `BookingForm`, `RuleMatrix`; holds the selected room, the API error (if any), and the violated rule id (derived). Owns the submit flow.
- Integration tests in `src/demo-booking-system/web/App.test.tsx` — render `<App />` with a fake `ApiClient` injected via prop, per scenario.

## Layer at a glance

| Surface          | What it tests                                                            | Status |
| ---------------- | ------------------------------------------------------------------------ | ------ |
| `api-client.ts`  | Shape of outbound request, parsing of response, thrown error on non-2xx  | ✅     |
| App: happy path  | User submits a valid booking → success → timeline updates                | ✅     |
| App: conflict    | User submits a conflicting booking → overlay + banner + rule matrix flag | ✅     |
| App: room switch | User changes the selected room → timeline + matrix update                | ✅     |
| App: recovery    | User fixes the form after a rejection → error clears, success lands      | ✅     |

Legend: ✅ implemented · 🚧 in progress · ⬜ not started

Format note: this document expresses **acceptance criteria** in Given/When/Then. The tests themselves use natural-prose names (consistent with every other spec in this tree).

---

## `api-client.ts`

### Why it matters

The api-client is the one place the frontend speaks HTTP. If its request shape drifts from what the Hono API expects, every feature above it silently breaks. Tests pin the wire contract on all three endpoints.

### Scenario 1 — `getRooms()` returns the seeded rooms

- **Given** the API responds to `GET /api/rooms` with `[{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]`
- **When** `getRooms()` is called
- **Then** the returned array contains that room

### Scenario 2 — `getBookings({ roomId })` requests the matching room and preserves purpose

- **Given** the API responds to `GET /api/bookings?roomId=boardroom` with a JSON array of bookings
- **When** `getBookings({ roomId: 'boardroom' })` is called
- **Then** the returned array contains those bookings with their `start`/`end` re-hydrated as `Date` objects
- **And** any booking purpose is present on the returned booking

### Scenario 3 — `createBooking({ request })` POSTs and returns the created booking with purpose

- **Given** a valid `BookingRequest` with a purpose
- **When** `createBooking({ request })` is called
- **Then** the API receives a POST to `/api/bookings` with the JSON-encoded request, including purpose
- **And** the returned `Booking` has its `start` / `end` re-hydrated as `Date` objects

### Scenario 4 — a 400 response surfaces as a typed rule violation

- **Given** the API responds to `POST /api/bookings` with `400 { error: 'Conflicts with an existing booking', rule: 'no-overlap' }`
- **When** `createBooking({ request })` is called
- **Then** the call throws a `RuleViolationError` carrying the error message and rule id so callers can distinguish rule violations from transport errors

---

## App integration

### Scenario 1 — a user books an available room and sees it on the timeline

- **Given** the API lists `The Boardroom` (capacity 12) with no existing bookings
- **When** the user fills the form (start 10:00, end 11:00, attendees 4, purpose `"Quarterly planning"`) and clicks `Execute Booking`
- **Then** the API receives a `POST /api/bookings` with the request
- **And** the new booking appears on the timeline with `"Quarterly planning"` as its title and the time range visible
- **And** the Rule Matrix stays in the all-pass state
- **And** no `RuleViolationBanner` is shown

### Scenario 2 — a user attempting an overlapping booking sees the conflict signal everywhere

- **Given** the API lists a booking 10:00–11:30 in `The Boardroom`
- **When** the user submits a booking that overlaps (e.g. 10:30–11:00)
- **And** the API responds `400 { error: 'Conflicts with an existing booking', rule: 'no-overlap' }`
- **Then** the timeline shows a `ConflictOverlay` on the attempted range
- **And** the Rule Matrix row for `no-overlap` flips to `fail`
- **And** the Rule Matrix header Chip reads `1/7 Fail`
- **And** a `RuleViolationBanner` with the rule's error message is visible under the form

### Scenario 3 — a user changes the selected room

- **Given** the app has loaded with `The Boardroom` selected and its bookings visible
- **When** the user picks `The War Room` from the room selector
- **Then** the timeline header updates to `Timeline / The War Room`
- **And** the bookings shown on the timeline are the war-room ones

### Scenario 4 — a user corrects the form after a rejection and succeeds

- **Given** a user has submitted a conflicting booking and is looking at the banner + overlay + fail matrix
- **When** they adjust the times to a non-conflicting slot and resubmit
- **And** the API accepts it
- **Then** the banner disappears
- **And** the overlay disappears
- **And** the Rule Matrix header chip returns to the all-pass state
- **And** the newly-created booking appears on the timeline
