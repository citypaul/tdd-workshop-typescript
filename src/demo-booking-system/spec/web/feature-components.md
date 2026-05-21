# Feature Components

Business requirements for the composite ("feature") React components that assemble the atoms from `spec/web/atomic-components.md` into the booking UI. Each scenario below is reflected by a behavioural test in `src/demo-booking-system/web/components/<Component>.test.tsx` that renders the component in real Chromium (Vitest Browser Mode) and asserts on what the user can observe — visible text, DOM semantics, accessible role/name, `data-*` contract attributes.

## Shape

- Components are pure presentation: props in, callbacks out, no side effects, no data fetching. Integration (API calls, state, hook wiring) happens in PR 6.
- Dependency direction: these components import types from `src/demo-booking-system/domain/types.ts` (e.g. `Booking`, `RuleId`) but never domain functions. They never import from `src/demo-booking-system/api/`.
- Timeline / booking / indicator positioning uses a CSS grid with **one row per half-hour** from 08:00 to 18:00 (20 rows). The time-to-row conversion is a pure helper used by the position-sensitive components; see `src/demo-booking-system/web/components/timeline-grid.ts`.
- Each component has a Storybook story next to it covering its user-observable states. Styling regressions are caught by stories; behavioural regressions by the tests in this spec.

## Components at a glance

| Component              | Role                                                                                                   | Status |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| `CurrentTimeIndicator` | Red dashed line on the timeline showing "now" — labelled with the time                                 | ✅     |
| `BookingBlock`         | A booking card on the timeline — title, time range, attendee chip, collision variant                   | ✅     |
| `ConflictOverlay`      | Hazard-stripe alert overlay on a violated timeslot, with the attempted time range labelled             | ✅     |
| `RuleViolationBanner`  | Thin red-left-strip note under the form showing the rule error the API returned                        | ✅     |
| `RuleMatrix`           | Six-row list of domain rules; one row highlights red when that rule is currently violated              | ✅     |
| `Timeline`             | The hour grid itself — renders hour labels, slots `BookingBlock`s at their times, hosts the overlays   | ✅     |
| `BookingForm`          | Controlled form — `FormField`s for room/start/end/attendees/purpose, room capacity, `Button` to submit | ✅     |

Legend: ✅ implemented · 🚧 in progress · ⬜ not started

Format note: Given / When / Then here, natural-prose test names in the code (consistent with `spec/web/atomic-components.md`).

---

## Component: `CurrentTimeIndicator`

### Why it matters

The dashed line is the user's anchor on the timeline — it shows "now" at a glance. Its position has to be accurate (placed on the correct grid row for the current time), and its label has to match that position (so users don't distrust a line sitting at 10:00 labelled "09:30").

### Scenario 1 — displays the time as HH:MM

- **Given** a `CurrentTimeIndicator` with `time = 2026-05-01T09:30:00Z`
- **When** the component renders
- **Then** the text `"09:30"` is in the document

### Scenario 2 — positions at the exact minute-offset from the timeline start

- **Given** a `CurrentTimeIndicator` with `time = 2026-05-01T09:30:00Z`
- **When** the component renders
- **Then** the rendered element exposes `data-minutes-from-start="90"` (60 + 30 minutes since the 08:00 start) so the visual position is the exact current time, not a snapped row — a booking-system looking live in front of the audience must read as _now_, not _sometime in this half-hour_
- **And** the analogous mappings at the edges: 08:00 → 0, 08:15 → 15, 17:30 → 570

---

## Component: `BookingBlock`

### Why it matters

Every booking on the timeline is a block. Users read the title, the time range, and the attendee count to understand the booking at a glance. When a booking collides with another, the block's left strip flips red — the visual signal that this is the conflicting booking, not a clean one.

### Scenario 1 — renders the booking's title, time range, and attendee count

- **Given** a `BookingBlock` for a booking titled `"Quarterly Planning"`, 10:00–11:30, 8 attendees
- **When** the component renders
- **Then** the text `"Quarterly Planning"` is visible
- **And** the text `"10:00 – 11:30"` is visible
- **And** the text `"8 attendees"` is visible (inside a `Chip`)

### Scenario 2 — positions on the grid according to the booking's start/end

- **Given** a `BookingBlock` for a booking 10:00–11:30
- **When** the component renders
- **Then** the rendered element exposes `data-grid-row-start="5"` and `data-grid-row-end="8"` (10:00→5, 11:30→8 in the half-hour grid)

### Scenario 3 — `collided` prop flips the block's visual state to the alert variant

- **Given** a `BookingBlock` rendered with `collided`
- **When** the component renders
- **Then** the rendered element exposes `data-collided="true"`
- **And** a `BookingBlock` with no `collided` prop exposes `data-collided="false"`
  (this is the observable contract; the actual red-strip styling is covered by a Storybook story)

---

## Component: `ConflictOverlay`

### Why it matters

When the user attempts a booking that would overlap an existing one, the violated timeslot on the timeline is overlaid with a hazard-stripe panel. The overlay carries the attempted time range so the user can see exactly which slot they tried to book.

### Scenario 1 — displays the attempted time range

- **Given** a `ConflictOverlay` for attempted range 10:00–11:00
- **When** the component renders
- **Then** the text `"CONFLICT DETECTED"` is visible (the headline)
- **And** the text `"10:00 – 11:00"` is visible

### Scenario 2 — positions on the grid according to the attempted range

- **Given** a `ConflictOverlay` for 10:00–11:00
- **When** the component renders
- **Then** the rendered element exposes `data-grid-row-start="5"` and `data-grid-row-end="7"`

---

## Component: `RuleViolationBanner`

### Why it matters

When the API rejects a booking on a rule violation, the user sees the reason as a short banner under the form. The banner shows the domain's own error message (so the wording comes from one source of truth: the domain) plus the rule id so visual tests can verify the right banner variant for each rule.

### Scenario 1 — displays the rule's error message

- **Given** a `RuleViolationBanner` for `{ error: "Conflicts with an existing booking", rule: "no-overlap" }`
- **When** the component renders
- **Then** the text `"Conflicts with an existing booking"` is visible

### Scenario 2 — exposes the rule id for downstream styling

- **Given** the same banner
- **When** the component renders
- **Then** the rendered element has `data-rule="no-overlap"`
  (used by tests and stories to verify the banner variant, not by CSS — styling is token-based)

### Scenario 3 — renders with an alert role so assistive tech announces it

- **Given** any `RuleViolationBanner`
- **When** the component renders
- **Then** there is an element with `role="alert"` containing the error message

---

## Component: `RuleMatrix`

### Why it matters

The "LIVE MONITOR" panel is the workshop's credibility moment: every business rule the system enforces has a row. Normally all rows pass; when a POST fails a rule, the matching row flips red. Skeptical engineers in the audience are watching whether the Rule Matrix is real or decorative — real means the `violatedRule` prop wires through to exactly one row.

### Scenario 1 — renders one row per domain rule

- **Given** a `RuleMatrix` with `violatedRule = null`
- **When** the component renders
- **Then** there is a row for each `RuleId` — `no-past`, `positive-duration`, `positive-attendees`, `no-overlap`, `capacity`, `max-duration`, `business-hours`
- **And** each row shows the rule's human-readable label

### Scenario 2 — the violated rule is marked as failing

- **Given** a `RuleMatrix` with `violatedRule = "no-overlap"`
- **When** the component renders
- **Then** the `"no-overlap"` row exposes `data-state="fail"` and is visibly the only row in the fail state
- **And** every other row exposes `data-state="pass"`

### Scenario 3 — all rows pass when `violatedRule` is null

- **Given** a `RuleMatrix` with `violatedRule = null`
- **When** the component renders
- **Then** every row exposes `data-state="pass"`

### Scenario 4 — the header chip reports the current fail count

- **Given** a `RuleMatrix` with `violatedRule = "no-overlap"`
- **When** the component renders
- **Then** the text `"1/7 Fail"` is visible (in the header chip)
- **And** with `violatedRule = null`, the text `"0/7 Pass"` is visible
  (the count protects the "this matrix is a real monitor, not decorative" claim — a mutant that stops wiring `violatedRule` through breaks the header chip observably)

---

## Component: `Timeline`

### Why it matters

The right-hand column of the app — the visual centrepiece. Given a room and its bookings, it renders the half-hour grid, positions each `BookingBlock` at the correct rows, and hosts the `CurrentTimeIndicator` and optional `ConflictOverlay`. The Timeline is where accuracy claims are most visible: a booking 10:00–11:30 has to literally align with the 10:00 and 11:30 hour labels.

### Scenario 1 — renders an hour label for every hour in the 08:00–18:00 window

- **Given** a `Timeline` with any room and no bookings
- **When** the component renders
- **Then** the text `"08:00"`, `"09:00"`, …, `"18:00"` are all visible (11 labels)

### Scenario 2 — renders one BookingBlock per booking passed in

- **Given** a `Timeline` with one booking in the room
- **When** the component renders
- **Then** the booking's title, time range, and attendee count are all visible

### Scenario 3 — hosts the CurrentTimeIndicator at the given `now`

- **Given** a `Timeline` with `now = 2026-05-01T09:30:00Z`
- **When** the component renders
- **Then** the text `"09:30"` is visible (the indicator's label)

### Scenario 4 — hosts the ConflictOverlay when a `conflict` range is passed

- **Given** a `Timeline` with `conflict = { start: 10:00, end: 11:00 }`
- **When** the component renders
- **Then** the text `"CONFLICT DETECTED"` is visible
- **And** without a `conflict` prop, no `"CONFLICT DETECTED"` text is present

---

## Component: `BookingForm`

### Why it matters

The form is the only way a user creates a booking. It has to be keyboard-usable end-to-end (tab order, labels associated with inputs, the submit button not silently stealing Enter from text inputs elsewhere), and it has to emit a clean `BookingRequest` shape to its `onSubmit` callback so the parent can pass it straight to the API client. Any error the API returns surfaces via the external `error` prop.

### Scenario 1 — renders FormFields for room, start, end, attendees, purpose and a submit Button

- **Given** a `BookingForm` with no initial error
- **When** the component renders
- **Then** inputs are present for the five fields (resolved via `getByLabelText`) and a button labelled `"Execute Booking"` is in the document

### Scenario 2 — emits a BookingRequest on submit

- **Given** a `BookingForm` wired to an `onSubmit` stub
- **When** the user fills room, start, end, attendees, purpose and clicks the submit button
- **Then** the `onSubmit` stub is called once with the `BookingRequest`-shaped object containing the entered values

### Scenario 3 — prevents malformed submissions with native form constraints

- **Given** a `BookingForm` wired to an `onSubmit` stub
- **When** the user clears start time, clears end time, leaves attendees blank, enters `0`, or enters `1.5`
- **Then** the browser constraint validation prevents submit and the `onSubmit` stub is not called

### Scenario 4 — shows an error banner when the external `error` prop is set

- **Given** a `BookingForm` with `error = { error: "Conflicts with an existing booking", rule: "no-overlap" }`
- **When** the component renders
- **Then** the error message is visible (inside a `RuleViolationBanner`)
- **And** without an `error` prop, no banner is visible

### Scenario 5 — notifies the parent when the user picks a different room

- **Given** a `BookingForm` wired to an `onRoomChange` stub, with `rooms = [boardroom, warRoom]`
- **When** the user selects `war-room` from the Room selector
- **Then** the `onRoomChange` stub is called with the `warRoom` object (the App lifts the selected room via this callback so the timeline and bookings query can follow — see `spec/web/integration.md` "App: room switch"; emitting the full `Room` means the App stores it directly instead of re-deriving it from an id on every render)

### Scenario 5 — shows each room's capacity in the room selector

- **Given** a `BookingForm` with rooms `"The Boardroom"` capacity 12 and `"The War Room"` capacity 8
- **When** the component renders
- **Then** the Room selector options show `"The Boardroom (capacity 12)"` and `"The War Room (capacity 8)"` so a user can choose a room that can actually hold the attendee count they are about to enter
