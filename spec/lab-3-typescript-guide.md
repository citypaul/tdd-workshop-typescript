# Lab 3 Track A — TypeScript Workshop Guide

Practical companion to [Lab 3](./lab-3.md) for the TypeScript track. Covers the testing tools you'll use, the accessibility-first patterns that make the form testable, and aligned hints for working through each AC. **No spoilers** — you still TDD the implementation yourself.

---

## What's already set up for you

The `src/card-validator/` project is wired up with everything you need:

| Tool | Purpose |
|------|---------|
| **Vitest Browser Mode** + **Playwright/Chromium** | Run UI tests in a real browser, not jsdom |
| **vitest-browser-react** | `render(<App />)` returns a screen-scoped, async, browser-aware locator API |
| **axe-core** | Automated accessibility scan as a final safety-net test |
| **Stryker** + **@stryker-mutator/vitest-runner** | Mutation testing to verify your tests actually catch bugs |

The validator from Labs 1–2 is in `src/card-validator/validate-card.ts`. You will not modify it. The form shell to wire up is in `src/card-validator/app/App.tsx`.

### npm scripts you'll use

```bash
pnpm test          # run all tests once (unit + browser)
pnpm test:browser  # only the browser-mode tests
pnpm test:unit     # only the node-mode unit tests
pnpm test:watch    # CLI watch mode
pnpm test:watch:ui # opens Vitest UI in a browser tab AND a visible Chromium
                   # window — best for iterating with TDD
pnpm mutate        # run Stryker against src/card-validator/app/App.tsx
pnpm dev           # the form running in a browser at localhost:5173
```

### Project layout

```
src/
  validate-card.ts          ← Lab 1+2 validator (don't touch)
  validate-card.test.ts     ← validator's own tests (don't touch)
  app/
    App.tsx                 ← the form you wire up
    App.test.tsx            ← write your tests here
    main.tsx                ← entry point (don't touch)
    index.css               ← Tailwind + your CSS
```

`vite.config.ts` is set up as a multi-project: `unit` (Node, fast, for `validate-card.test.ts`) and `browser` (Chromium, for `App.test.tsx`). You can ignore the configuration unless you need to tweak it.

---

## Testing philosophy: accessible selectors are accessibility tests

This is the key idea that runs through Lab 3.

When you write `screen.getByRole("button", { name: /validate/i })`, you're not just locating an element — you're asserting that the button is **findable by an assistive-tech user**. If the markup uses a `<div onClick>` instead of a `<button>`, the query fails. If the button has no accessible name, the query fails.

The same principle extends further:

- `getByLabelText(/card number/i)` → fails if the input has no `<label htmlFor>` or `aria-label`
- `getByRole("textbox", { description: /required/i })` → fails if the input isn't `aria-describedby`-linked to an element containing that text
- `getByRole("img", { name: "Visa" })` → fails if the image has no accessible name

> Testing Library is explicit about this: queries should "enable testing the way users use it, including through accessibility interfaces like screen readers."

**The implication for how you test:** prefer accessible queries. They double as accessibility checks; the test contract IS the a11y contract. Use `data-testid` only as a last resort, and only for elements that are intentionally hidden from the accessibility tree.

**The implication for how you build:** if a test like `getByRole("textbox", { description: "Card number is required" })` fails, the fix isn't to weaken the test — it's to wire up `aria-describedby` properly so a real screen-reader user gets the description too.

### Where this stops working — and what to do then

Selectors don't catch everything. They can't see colour contrast, missing landmarks, ARIA misuse, duplicated IDs, or content that *shouldn't* be in the accessibility tree. Testing Library acknowledges this:

> Testing Library locators do not guarantee the accessibility of the elements being tested.

For everything below the selector layer, run an automated audit. **AC 11** asks for a single `axe-core` smoke test that scans the rendered form and asserts zero violations. Treat it as a baseline below your selector tests, not a replacement for them.

---

## Vitest Browser Mode quick reference

### Render

```ts
import { render } from "vitest-browser-react";
import { App } from "./App.js";

const screen = await render(<App />);
//    ^ note: render is async — always await it
```

`screen` is the locator API scoped to your rendered component. It looks like Testing Library's `screen` object, but the methods are `Locator`-aware (they auto-retry, they support `await expect.element(...)`).

### Common queries (priority order)

```ts
// 1. Role + accessible name — best
screen.getByRole("button", { name: /submit/i })
screen.getByRole("textbox", { name: /email/i })
screen.getByRole("status")
screen.getByRole("img", { name: "Visa" })
screen.getByRole("textbox", { description: /required/i })  // resolves aria-describedby

// 2. Form fields by label
screen.getByLabelText(/card number/i)

// 3. Visible text
screen.getByText(/welcome/i)

// 4. Last resort
screen.getByTestId("card-preview")
```

### Async assertions

Vitest Browser Mode uses `expect.element(...)` for DOM assertions. They **auto-retry** until they pass or time out — you almost never need `waitFor`.

```ts
await expect.element(screen.getByRole("status")).toHaveTextContent(/visa/i);
await expect.element(screen.getByLabelText(/card number/i)).toHaveValue("4111");
await expect.element(screen.getByRole("button")).toBeVisible();
await expect.element(input).toHaveAttribute("aria-invalid", "true");
```

Without `expect.element`, you have non-retrying assertions:

```ts
expect(screen.getByRole("img").elements()).toHaveLength(3);  // synchronous count
```

### Common interactions

```ts
const cardField = screen.getByLabelText(/card number/i);

await cardField.fill("4111111111111111");  // sets value, fires change event
await cardField.clear();
await cardField.click();

// Or via userEvent (CDP keyboard simulation):
import { userEvent } from "vitest/browser";
await userEvent.fill(cardField, "4111111111111111");
await userEvent.keyboard("{Enter}");
```

Both forms work. The locator-method form is shorter; `userEvent` is sometimes needed for complex keyboard flows.

### Idempotency rule

Browser-mode tests may run in parallel. Each test must:
- Render its own state from scratch (no shared `beforeEach` setup)
- Use unique data where collisions are possible
- Never assume DOM state from a previous test

The existing tests in this project use a small factory (`submitCardNumber`) — that's fine. Avoid `let`/`beforeEach`.

---

## Accessibility patterns you'll need

These cover ACs 9–11. Each has a "wrong way / right way" comparison so you can recognise the failure mode.

### 1. Live regions: keep them in the DOM

`role="status"` (and `aria-live="polite"`) are how screen readers announce dynamic updates without moving focus. The rule is: **the live region must exist before its content changes.** If you mount the element and the message at the same time, many screen readers miss the announcement entirely — they observe a new node appearing, not a content change inside an existing live region.

```tsx
// ❌ Conditional render — many SRs will miss this
{message !== null && <p role="status">{message}</p>}

// ✅ Always rendered — content toggles inside
<p role="status" aria-live="polite">{message}</p>
```

The accessible-selector test that drives this:

```ts
// before any submission, the region is there but empty
await expect.element(screen.getByRole("status")).toHaveTextContent("");
```

### 2. Errors must be linked to the input

When the validator rejects an input, screen-reader users need to know **at the input** that something is wrong. Two ARIA attributes do this:

- `aria-invalid="true"` on the input → SR announces "invalid entry"
- `aria-describedby="<id-of-error-region>"` → SR announces the description text when focus is on the input

```tsx
<input
  aria-invalid={hasError}
  aria-describedby={resultRegionId}
  ...
/>
<p id={resultRegionId} role="status" aria-live="polite">{message}</p>
```

Use `useId()` from React for the id — it generates a unique value per render (and avoids string-literal mutation testing pitfalls).

The accessible-selector test that drives this is the slick part:

```ts
// after a validation error, the input is findable BY its description
screen.getByRole("textbox", { description: "Visa cards must be 16 digits" });

// and explicitly invalid
await expect.element(input).toHaveAttribute("aria-invalid", "true");
```

If the wiring is missing, `getByRole(..., { description: ... })` returns no element and the test fails. The query itself is the contract.

### 3. Decorative content: hide it from assistive technology

Anything that's there for sighted users only — placeholders that mirror an input, gradient backgrounds, branding flourishes, the chip on a credit-card visual — should be `aria-hidden="true"`. A screen-reader user shouldn't have to wade through it on the way to the actual form.

```tsx
<div aria-hidden="true" className="...the gradient card...">
  <p>0000 0000 0000 0000</p>     {/* decorative placeholder */}
  <p>Card Validator · TDD Workshop</p>  {/* decorative branding */}
</div>
```

Inner SVGs of accessible icons should also be `aria-hidden` to avoid double-announcement:

```tsx
<span role="img" aria-label="Visa">
  <VisaIcon aria-hidden="true" />
</span>
```

This pattern doesn't get a dedicated unit test — it's caught by the axe-core smoke test in AC 11.

### 4. The axe-core smoke test (AC 11)

```ts
import axe from "axe-core";

test("the rendered form has no axe-core violations", async () => {
  const screen = await render(<App />);
  const { violations } = await axe.run(screen.container);
  expect(violations).toEqual([]);
});
```

This catches what selectors can't: missing `<main>` landmark, missing page heading, colour contrast issues, ARIA misuse, decorative content not hidden. Make it pass — but don't treat it as a substitute for thinking about accessibility.

> **Why not `vitest-axe`?** It's the natural matcher wrapper, but at the time of writing it imports `node:module`, which doesn't exist in Vitest Browser Mode's runtime. Calling `axe-core` directly avoids the dependency issue and reads almost as cleanly.

---

## Mutation testing notes

Run `pnpm mutate` after each green to verify your tests actually catch bugs. It takes ~8 minutes — don't run it after every test, but **do** run it after each AC clears.

### What you'll see

Stryker generates ~30 mutants from `App.tsx` (one mutant = one small change to the production code). For each, it runs your tests and reports:

- **Killed** ✓ — at least one test failed when the mutant was applied. Good.
- **Survived** ✗ — every test still passed. The mutation represents a bug your tests don't catch.
- **Timed out** — counted as detected.
- **Equivalent** (rare) — the mutation is observably identical to the original; cannot be killed.

The score you're aiming for is **100%** — anything less means there's a behaviour you haven't tested.

### Common surviving mutants and how to kill them

| Pattern | Why it survives | Fix |
|---------|-----------------|-----|
| `useState("")` → `useState("Stryker was here!")` | No test asserts the input starts empty | Add a "field is empty before any input" test |
| `{message !== null && (` → `{true && (` | No test asserts the live region is empty before submit | Add the AC 9 "result region is present and empty" test |
| `: ""` → `: "Stryker was here!"` (in a className ternary) | Tests check for `is-active` presence, not absence of garbage classes | Use `undefined` instead of `""` for the falsy branch — Stryker doesn't mutate `undefined` |
| `digitsOnly.slice(0, 19)` → `digitsOnly` (slice removed) | If you also have `maxLength={19}` on the input, Playwright's keyboard simulation respects it and the slice is dead code | Remove `maxLength`; let the slice be the single source of truth |
| `const REGION_ID = "card-number-result"` → `""` | The same "" appears as both the input's `aria-describedby` and the region's `id`, so they still link up | Use `useId()` instead of a string literal |

### When to ask "is this an equivalent mutant?"

Sometimes a mutant survives because the change has no observable effect — `.trim()` removed when there's no whitespace to trim, an empty string changed to junk in a className that's never styled. The mutation-testing skill calls these "equivalent mutants" — they're real, they're rare, and they're worth flagging to a teammate (or the workshop facilitator) before deciding whether to refactor or accept.

For Lab 3, the workshop's expectation is **100% mutation score**. If you hit a survivor that looks equivalent, prefer a small refactor that eliminates the mutation target (using `undefined` over `""`, `useId()` over string constants, removing redundant safety checks) over accepting the gap.

---

## Hints, by AC

These are pointers, not solutions. You should still TDD each AC: write the failing test first, then the minimum code to pass.

### AC 1 — Submitting a valid number names the provider

- A `<form onSubmit={...}>` with `event.preventDefault()` is the right shape — the form is doing client-side work, nothing leaves the browser.
- The success message should name the provider; reading it from `validateCard`'s return shape is the simplest path. Don't hardcode `"Visa card accepted"` if your test would be stronger with all three providers covered.

### AC 2 — Validator errors surfaced verbatim

- The validator already produces the exact strings the test table expects. Your form should just pass them through. Don't translate or reword.
- One test per error category is plenty. The validator's own unit tests cover the boundary cases (e.g., 14- vs 15- vs 16-digit Visa) — the surface test only needs to prove the message is rendered.

### AC 3 — A new submission replaces the previous result

- A single piece of state for the message, overwritten on each submit, is enough. No need for arrays or history.
- Test by submitting twice with different inputs and asserting only the second result is visible.

### AC 4 — Detected provider's logo is highlighted

- The spec recommends an `is-active` CSS class (or similar). Make the toggle live in CSS, not JSX — your JSX should just add or remove **one class** based on the active provider. The styling work belongs in `index.css` (scoped to the logo elements by their `role="img"` + `aria-label`).
- For inactive logos, returning `undefined` from your "which class?" helper is cleaner than returning `""` (and kills a mutation testing case).
- Query logos by accessible name: `getByRole("img", { name: "Visa" })`.

### AC 5 — No real network request

- `event.preventDefault()` in your submit handler does the page-reload prevention.
- A `vi.spyOn(window, "fetch")` test that asserts `fetchSpy` was never called is enough.

### AC 6 — Card visual mirrors what the user typed

- Bind the card-visual element's text to the input's state, with a fallback to the placeholder when empty.
- The card visual is decoration (see AC 11 / decorative-hiding); querying it by `data-testid` is the right exception to the "no testid" rule.

### AC 7 — Reject non-digits at the source

- A controlled input with an `onChange` that does `value.replace(/\D/g, "")` before calling `setState` keeps the field digits-only by construction.
- This makes the AC 2 "must contain only digits" path unreachable from the surface — that's intended. The validator's unit tests still cover the underlying logic.

### AC 8 — Cap at 19 characters

- `digitsOnly.slice(0, 19)` in the same `onChange` handler.
- Resist the urge to also add `maxLength={19}` on the input. With both, Playwright's keyboard simulation respects `maxLength` and the slice becomes invisible to mutation testing.

### AC 9 — Result region always present

- The element wrapping `role="status"` lives in the DOM at all times. Toggle the **content** (the message string), not the **element**.
- A test like `await expect.element(screen.getByRole("status")).toHaveTextContent("")` on initial render is what enforces this.

### AC 10 — Errors associated with the input

- Track `hasError` separately from `message` — a successful validation has a message ("Visa card accepted") but the input is not invalid.
- The `aria-describedby` value should match the result region's `id`. Use `useId()` for the id.
- The slick test: `screen.getByRole("textbox", { description: "Visa cards must be 16 digits" })`. If your wiring is missing, the query fails.

### AC 11 — Axe-core smoke test

- Run `axe.run(screen.container)` and assert `violations` is empty.
- To make this pass: add a `<main>` landmark, `aria-hidden="true"` on decorative card visuals, and `aria-hidden="true"` on the inner SVGs of the logo wrappers. None of these need their own unit tests — axe is the contract for them.

---

## When you're stuck

- **A test fails for an unexpected reason.** Read the error carefully — Browser Mode's auto-retry waits for the assertion to pass, so timeouts usually mean "the element never appeared with the expected content," not "the test ran too fast."
- **Stryker won't run.** Make sure `pnpm test:browser` passes first; Stryker won't even start if your tests are red.
- **Stryker survives a mutation that looks equivalent.** Refactor toward the simplest source of truth (one place, one literal) — usually a small simplification kills the mutant cleanly.
- **axe-core flags something that seems unfair.** Read the rule it's flagging on the [axe rules reference](https://dequeuniversity.com/rules/axe/) — most rules have a clear fix.

---

## Resources

- [Vitest Browser Mode](https://vitest.dev/guide/browser/) — official docs
- [vitest-browser-react](https://github.com/vitest-dev/vitest-browser-react) — render/renderHook for React
- [Testing Library — Accessibility API](https://testing-library.com/docs/dom-testing-library/api-accessibility/)
- [Testing Library — `ByRole` queries](https://testing-library.com/docs/queries/byrole/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) — patterns for live regions, alerts, dialogs, etc.
- [axe-core rule reference](https://dequeuniversity.com/rules/axe/) — what each violation means and how to fix it
- [Stryker Mutator](https://stryker-mutator.io/) — mutation testing concepts
