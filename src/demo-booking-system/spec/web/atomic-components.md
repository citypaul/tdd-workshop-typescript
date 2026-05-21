# Atomic Components

Business requirements for the atomic components that make up the "Break Something" booking UI. Each scenario below is reflected by a behavioural test in `src/demo-booking-system/web/components/<Component>.test.tsx` that renders the component in real Chromium (Vitest Browser Mode) and asserts on what the user can observe — visible text, DOM semantics, focus behaviour. No spying on props, no shallow rendering.

## Shape

- Components are small React function components with a single-object props signature — `readonly` throughout, no positional props.
- Brutalist visual style — sharp edges, offset shadows, no rounding — is declarative via Tailwind classes derived from the tokens in `src/demo-booking-system/web/styles/global.css`.
- Every component has a Storybook story next to it (`<Component>.stories.tsx`) covering the visual states. Storybook is the **visual** acceptance surface; this spec + Vitest tests are the **behavioural** one.

## Components at a glance

| Component   | Role                                                                                 | Status |
| ----------- | ------------------------------------------------------------------------------------ | ------ |
| `Button`    | The primary CTA — `EXECUTE BOOKING` on the form, any other brutal-button needed      | ✅     |
| `Chip`      | Small uppercase pill used for `V_1.0.0`, `1/7 FAIL`, `4 ATTENDEES`, etc.             | ✅     |
| `FormField` | Label + brutal-bordered wrapper around a form control; the `<input>` slot is a child | ✅     |

Legend: ✅ implemented · 🚧 in progress · ⬜ not started

Format note: this document expresses **acceptance criteria** in Given/When/Then for readers coming from a BDD background. The tests themselves do NOT use Given/When/Then in their names — test names read as natural-prose sentences about what the user observes (see the test files listed above).

Testing split (for reviewers wondering why certain assertions aren't here):

- **Behavioural tests** (this doc, Vitest Browser Mode) — user-visible outcomes: is the label rendered, is the control clickable, is focus moving where the user expects.
- **Visual stories** (Storybook, no assertions) — every visual state so designers can eyeball the rest state, hover state, alert tone, etc.
- **Semantic scope** — accessibility claims (role, label-to-input association) belong in the behavioural tests because they are user-observable through assistive tech.

---

## Component: `Button`

### Why it matters

Every interactive action in the app runs through `Button`. Keyboard users need it to behave like a native button (Enter / Space activate, focus visible); mouse users need hover/active feedback; screen-reader users need the accessible name to read out; the form submit contract needs `type="button"` unless we explicitly opt into `type="submit"`. Getting any of that wrong on the atom silently breaks every consumer.

### Scenario 1 — renders the caller's label

- **Given** a `Button` with children `"Execute Booking"`
- **When** the component renders
- **Then** an element with accessible role `button` and accessible name `Execute Booking` is in the document

### Scenario 2 — invokes the `onClick` callback when activated

- **Given** a `Button` wired to an `onClick` stub
- **When** the user clicks the button
- **Then** the stub is called exactly once (the stub is a `vi.fn()` — a standard Testing-Library-shaped test collaborator passed through the public prop surface, not a spy on any internal function)

### Scenario 3 — the `disabled` prop disables the element

- **Given** a `Button` rendered with `disabled`
- **When** the component renders
- **Then** the rendered element is reported as disabled (assistive tech will say so; the browser owns "disabled buttons don't fire click"; the test asserts on the DOM-level attribute)

### Scenario 4 — default `type` is `"button"`

- **Given** a `Button` used inside a `<form>` with no `type` prop
- **When** the user clicks the button
- **Then** the form is not submitted (the default `type` is `"button"`, not `"submit"`, so accidental drops of a `type="button"` attribute on a consumer won't silently trigger submission)

### Scenario 5 — `type="submit"` opt-in lets the button submit its form

- **Given** a `Button` rendered with `type="submit"`
- **When** the component renders
- **Then** the rendered element has the attribute `type="submit"` (the explicit opt-in that lets the Button function as a form's submit control — `BookingForm` relies on this)

---

## Component: `Chip`

### Why it matters

The chip is the small text marker that communicates system state at a glance — `V_1.0.0` in the header, `1/7 FAIL` on the Rule Matrix, `4 ATTENDEES` on a booking block. Its brutalist treatment (2px border, no rounding, uppercase, wide tracking, tabular numbers) is the visual signature of the app; its readable label is what the user actually reads.

### Scenario 1 — renders the caller's label

- **Given** a `Chip` with children `"1/7 FAIL"`
- **When** the component renders
- **Then** the text `"1/7 FAIL"` is in the document

### Scenario 2 — the `tone` prop drives the visual treatment

- **Given** a `Chip` with `tone="alert"`
- **When** the component renders
- **Then** the rendered element exposes a `data-tone` attribute equal to `"alert"` (the contract the Storybook stories rely on; this also makes tone-switching observable to the mutation tester so a mutant flipping `"alert"` to `"default"` fails a test)
- **And** a `Chip` with no `tone` prop exposes `data-tone="default"`

---

## Component: `FormField`

### Why it matters

Every form control in the app (`Room`, `Start Time`, `End Time`, `Attendees`) is wrapped in a `FormField` whose job is to pair a label with the control. Assistive tech relies on the label being programmatically associated with the control (so a screen reader reads "Attendees, required, 4" when the input gets focus); sighted users rely on clicking the label to focus the control. Both are accessibility contracts that either work or don't.

### Scenario 1 — renders the label text

- **Given** a `FormField` with `label="Attendees"` wrapping an `<input>`
- **When** the component renders
- **Then** the text `"Attendees"` is in the document

### Scenario 2 — clicking the label focuses the input

- **Given** a `FormField` with `label="Attendees"` wrapping an `<input>`
- **When** the user clicks the rendered label
- **Then** the wrapped input has focus
  (native browser behaviour kicks in when the `<label>` element is properly associated with its `<input>` — the test does double duty: it proves both the label→input focus flow AND the label/input association, because `getByLabelText('Attendees')` can only return the input if the pair is correctly wired. No separate "association" test is needed.)
