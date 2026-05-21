# Lab 3 TypeScript Guide

Practical companion to [Lab 3](./lab-3.md). This guide covers the testing
tools, the accessibility-first query patterns, and the front-end lab shape.

## What's Already Set Up

The `src/card-validator/` project is wired up with:

| Tool                                      | Purpose                                                               |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Vitest Browser Mode + Playwright/Chromium | Run UI tests in a real browser                                        |
| `vitest-browser-react`                    | Render React components and query them through browser-aware locators |
| `axe-core`                                | Optional accessibility smoke test                                     |

The validator from Labs 1 and 2 lives in
`src/card-validator/validate-card.ts`. The form shell lives in
`src/card-validator/app/App.tsx`.

## What Changes From Labs 1 And 2?

The TDD loop does not change:

1. write a failing test for one behaviour;
2. make the smallest change that passes;
3. refactor while the test stays green.

What changes is the boundary. In Labs 1 and 2, the public surface was a
TypeScript function. In Lab 3, the public surface is the rendered UI: labelled
fields, buttons, status text, and accessibility state.

The point is to use the validator as a small library from the React form, then
test that usage through the DOM. Do not duplicate the validation rules in the
component. Let the UI call `validateCard(...)`, then prove that the result is
shown to the user correctly.

### Commands

```bash
pnpm test:card          # run all card-validator tests
pnpm test:card:browser  # run the browser-mode React tests
pnpm test:card:unit     # run pure validator tests
pnpm test:card:watch    # watch mode
pnpm test:card:watch:ui # browser-mode watch UI
pnpm dev:card           # run the form at localhost:5173
```

### Project Layout

```text
src/card-validator/
  validate-card.ts              Lab 1+2 validator
  validate-card.test.ts         validator tests
  app/
    App.tsx                     form to evolve
    App.test.tsx                UI tests
    test-setup.ts               imports CSS for browser tests
```

`vite.config.ts` has two test projects:

- `unit` for pure validator tests in Node;
- `browser` for React tests in Chromium.

## The Core Test Shape

A front-end test in this lab should read like a user story:

```ts
const screen = await render(<App />);

await screen.getByLabelText(/card number/i).fill("4111111111111111");
await screen.getByRole("button", { name: /validate/i }).click();

await expect.element(screen.getByRole("status")).toHaveTextContent(/visa/i);
```

The important shape is:

1. render the UI;
2. interact through roles and labels;
3. assert visible or accessibility-visible behaviour.

Notice what is not in that shape: no direct call to `validateCard(...)` from
the UI test, and no assertion on React state. The unit tests already specify the
library. The front-end tests specify that the product surface uses the library
correctly.

## Accessible Selectors Are Part Of The Contract

When you write:

```ts
screen.getByRole("button", { name: /validate/i });
screen.getByLabelText(/card number/i);
screen.getByRole("status");
```

you are not only finding elements. You are asserting that the UI exposes a
usable accessibility surface.

Prefer queries in this order:

1. role plus accessible name;
2. label text;
3. visible text;
4. test id only for deliberately decorative content.

Examples:

```ts
screen.getByRole("button", { name: /validate/i });
screen.getByRole("textbox", { name: /card number/i });
screen.getByRole("textbox", { description: /required/i });
screen.getByRole("status");
```

If a role/name/description query fails, first ask whether the UI is missing an
accessibility contract before weakening the test.

## Live Regions

Use `role="status"` and `aria-live="polite"` for results that appear after a
submit.

The result region should be present before any submission:

```tsx
<p id={resultId} role="status" aria-live="polite">
  {message}
</p>
```

A useful test:

```ts
await expect.element(screen.getByRole("status")).toHaveTextContent("");
```

This catches the common mistake of conditionally rendering the live region only
after a message exists.

## Error Association

When validation fails, the input should expose the error through the
accessibility tree:

```tsx
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? resultId : undefined}
/>
<p id={resultId} role="status" aria-live="polite">
  {message}
</p>
```

The contract can be tested by finding the textbox by its description:

```ts
screen.getByRole("textbox", {
  description: "Card number is required",
});
```

Also assert the invalid state:

```ts
await expect
  .element(screen.getByLabelText(/card number/i))
  .toHaveAttribute("aria-invalid", "true");
```

When the user later succeeds, clear `aria-invalid` and avoid leaving stale error
descriptions attached to the field.

## Optional Accessibility Smoke Test

If the core behaviours are done, add one `axe-core` smoke test:

```ts
import axe from "axe-core";

test("the rendered form has no axe-core violations", async () => {
  const screen = await render(<App />);
  const { violations } = await axe.run(screen.container);
  expect(violations).toEqual([]);
});
```

This is useful, but it is not the core of the lab. The core is behaviour first,
through accessible user-facing contracts.

## When You Get Stuck

- If `getByRole("textbox", { description: ... })` fails, check
  `aria-describedby`.
- If `getByRole("button", { name: /validate/i })` fails, check whether the
  submit control is really a button with an accessible name.
- If an assertion times out, treat it as "the user-visible behaviour never
  appeared", not as a timing problem.
- If the form appears to submit the page, check that the submit handler calls
  `event.preventDefault()`.

## Resources

- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [vitest-browser-react](https://github.com/vitest-dev/vitest-browser-react)
- [Testing Library - ByRole queries](https://testing-library.com/docs/queries/byrole/)
- [axe-core rule reference](https://dequeuniversity.com/rules/axe/)
