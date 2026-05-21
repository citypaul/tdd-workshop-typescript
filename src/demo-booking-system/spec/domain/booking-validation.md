# Booking Validation

Business requirements for the domain's `validateBooking()` function. Every rule below is reflected by a behavioural test in `src/demo-booking-system/domain/validate-booking.test.ts`.

## Function signature

```typescript
validateBooking(input: {
  request: BookingRequest;
  room: Room;
  existing: readonly Booking[];
  now: Date;
}): BookingResult;
```

On success: `{ success: true }`.
On failure: `{ success: false, error: <business-readable message>, rule: <RuleId> }`.

## Rules at a glance

| ID                   | Name                                           | Status |
| -------------------- | ---------------------------------------------- | ------ |
| `no-past`            | Bookings cannot be in the past                 | ✅     |
| `positive-duration`  | Start must be before end                       | ✅     |
| `positive-attendees` | At least one attendee is required              | ✅     |
| `no-overlap`         | No overlapping bookings (back-to-back allowed) | ✅     |
| `capacity`           | Attendees cannot exceed room capacity          | ✅     |
| `max-duration`       | Bookings cannot exceed 8 hours                 | ✅     |
| `business-hours`     | Bookings must fall within 08:00–18:00          | ✅     |

Legend: ✅ implemented · 🚧 in progress · ⬜ not started

Format note: this document expresses **acceptance criteria** in Given/When/Then for readers coming from a BDD background. The tests themselves do NOT use Given/When/Then in their names — test names read as natural-prose sentences about system behaviour (see `src/demo-booking-system/domain/validate-booking.test.ts`).

Implementation structure: `validateBooking()` is composed of named rule helpers in `src/demo-booking-system/domain/rules/` — one file per rule. The helpers are pure predicates that return `true` when the rule is violated. `validateBooking()` orchestrates the cascade and owns the business-readable error messages.

---

## Rule: `no-past` — bookings cannot be in the past

### Why it matters

A booking system that accepts bookings in the past is useless: users double-book themselves, calendar history gets rewritten, and any audit trail loses meaning. The rule exists to protect the integrity of the schedule relative to the current moment.

### Scenario 1 — a booking that starts before now is rejected

- **Given** the current time is `2026-05-01T10:00:00Z`
- **When** a booking is submitted that starts at `2026-04-30T14:00:00Z`
- **Then** the result is `{ success: false, error: "Cannot book in the past", rule: "no-past" }`

### Scenario 2 (boundary) — a booking that starts exactly at the current time is not rejected by this rule

- **Given** the current time is `2026-05-01T10:00:00Z`
- **When** a booking is submitted that starts at `2026-05-01T10:00:00Z`
- **Then** the `no-past` rule does not reject the booking
  (other rules may still reject it — `no-past` is specifically not triggered at the boundary)

---

## Rule: `positive-duration` — start must be before end

### Why it matters

A zero- or negative-duration booking is meaningless: nobody can attend a meeting that ends before it starts. Rejecting both cases protects the schedule from being polluted with invalid data, keeps downstream calculations (like overlap detection) honest, and gives the user immediate feedback that their input is malformed rather than silently storing nonsense.

### Scenario 1 — a booking with zero duration is rejected

- **Given** the current time is `2026-05-01T10:00:00Z`
- **When** a booking is submitted with `start = 2026-05-01T10:00:00Z` and `end = 2026-05-01T10:00:00Z`
- **Then** the result is `{ success: false, error: "Booking must have a positive duration", rule: "positive-duration" }`

### Scenario 2 — a booking whose end is before its start is rejected

- **Given** the current time is `2026-05-01T10:00:00Z`
- **When** a booking is submitted with `start = 2026-05-01T11:00:00Z` and `end = 2026-05-01T10:30:00Z`
- **Then** the result is `{ success: false, error: "Booking must have a positive duration", rule: "positive-duration" }`

---

## Rule: `no-overlap` — bookings cannot overlap in the same room

### Why it matters

Two meetings cannot occupy the same room at the same time without one interrupting the other. Overlap detection is the single most-visible rule of the system — it is what the calendar primarily exists to protect. Back-to-back bookings (where one ends exactly as another begins) are intentionally allowed because they represent the common pattern of rooms turning over between meetings.

Overlap is scoped per room: two bookings in different rooms at the same time are perfectly fine.

### Scenario 1 — a booking that overlaps an existing one in the same room is rejected

- **Given** an existing booking in `boardroom` from `10:00` to `11:00`
- **When** a booking is submitted in `boardroom` from `10:30` to `11:30`
- **Then** the result is `{ success: false, error: "Conflicts with an existing booking", rule: "no-overlap" }`

### Scenario 2 (boundary) — a booking that starts exactly when another ends is accepted

- **Given** an existing booking in `boardroom` from `10:00` to `11:00`
- **When** a booking is submitted in `boardroom` from `11:00` to `12:00`
- **Then** the result is `{ success: true }`

### Scenario 3 (boundary) — a booking that ends exactly when another begins is accepted

- **Given** an existing booking in `boardroom` from `11:00` to `12:00`
- **When** a booking is submitted in `boardroom` from `10:00` to `11:00`
- **Then** the result is `{ success: true }`
  (the "end meets start" boundary must hold symmetrically in both directions)

### Scenario 4 — overlapping bookings in different rooms are allowed

- **Given** an existing booking in `war-room` from `10:00` to `11:00`
- **When** a booking is submitted in `boardroom` from `10:30` to `11:30`
- **Then** the result is `{ success: true }`

---

## Rule: `capacity` — attendees cannot exceed room capacity

### Why it matters

A room has a physical attendee limit. Accepting a booking that exceeds it sets users up for failure — people turn up on the day and have nowhere to sit. The rule enforces the limit at booking time and surfaces the actual capacity in the error message so the user can either pick a bigger room or reduce their invite list.

### Scenario 1 — a booking whose attendees exceed capacity is rejected

- **Given** a room with capacity `12`
- **When** a booking is submitted with `attendees = 13`
- **Then** the result is `{ success: false, error: "Exceeds room capacity of 12", rule: "capacity" }`
  (the error message includes the actual capacity)

### Scenario 2 (boundary) — a booking with attendees exactly equal to capacity is accepted

- **Given** a room with capacity `12`
- **When** a booking is submitted with `attendees = 12`
- **Then** the result is `{ success: true }`

---

## Rule: `positive-attendees` — at least one attendee is required

### Why it matters

A room booking with no attendees is not a real booking. Rejecting zero and negative attendee counts keeps the domain honest for every caller, even if the current HTTP API also rejects those values at the request-shape boundary before the domain is invoked.

### Scenario 1 — a booking with zero attendees is rejected

- **When** a booking is submitted with `attendees = 0`
- **Then** the result is `{ success: false, error: "At least one attendee is required", rule: "positive-attendees" }`

### Scenario 2 — a booking with negative attendees is rejected

- **When** a booking is submitted with `attendees = -1`
- **Then** the result is `{ success: false, error: "At least one attendee is required", rule: "positive-attendees" }`

---

## Rule: `max-duration` — bookings cannot exceed eight hours

### Why it matters

Without a hard cap on duration, users accidentally block rooms for entire days or weeks. Eight hours reflects "one working day" as a reasonable maximum; anything longer is almost always a mistake, and if it is intentional, it should be multiple bookings rather than a single marathon.

### Scenario 1 — a booking longer than eight hours is rejected

- **When** a booking is submitted with `start = 2026-05-01T09:00:00Z` and `end = 2026-05-01T18:00:00Z` (nine hours)
- **Then** the result is `{ success: false, error: "Bookings cannot exceed 8 hours", rule: "max-duration" }`

### Scenario 2 (boundary) — a booking of exactly eight hours is accepted

- **When** a booking is submitted with `start = 2026-05-01T09:00:00Z` and `end = 2026-05-01T17:00:00Z` (eight hours)
- **Then** the result is `{ success: true }`

---

## Rule: `business-hours` — bookings must be within 08:00–18:00

### Why it matters

Outside of business hours, no-one is around to open the building, run AV, or respond if something goes wrong. Pinning bookings to the 08:00–18:00 window keeps operations predictable and avoids surprise overnight slots. The window is inclusive at both ends — 08:00 sharp and 18:00 sharp are valid boundaries for the first and last bookings of the day.

All times below are UTC; the check uses the start's and end's UTC time-of-day.

### Scenario 1 — a booking that starts before 08:00 is rejected

- **When** a booking is submitted with `start = 07:00` and `end = 08:30`
- **Then** the result is `{ success: false, error: "Bookings must be within business hours (8am–6pm)", rule: "business-hours" }`

### Scenario 2 — a booking that ends after 18:00 is rejected

- **When** a booking is submitted with `start = 17:00` and `end = 18:30`
- **Then** the result is `{ success: false, error: "Bookings must be within business hours (8am–6pm)", rule: "business-hours" }`

### Scenario 3 (boundary) — a booking that starts at close of business is rejected

- **When** a booking is submitted with `start = 18:00` and `end = 18:30`
- **Then** the result is `{ success: false, error: "Bookings must be within business hours (8am–6pm)", rule: "business-hours" }`
  (positive duration forces end beyond close, triggering the rule)

### Scenario 4 (boundary) — a booking that starts exactly at opening time is accepted

- **When** a booking is submitted with `start = 08:00` and `end = 09:00`
- **Then** the result is `{ success: true }`

### Scenario 5 (boundary) — a booking that ends exactly at closing time is accepted

- **When** a booking is submitted with `start = 17:00` and `end = 18:00`
- **Then** the result is `{ success: true }`
