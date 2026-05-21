# Lab 3: Front-End TDD with Accessibility Contracts

## Purpose

Take the card validator from Labs 1 and 2 and use it inside a real
user-facing React form.

The process is the same as the earlier labs: name one behaviour with a failing
test, make the smallest change that makes it pass, then refactor while the
behaviour stays protected. The boundary is different, but the discipline is the
same.

The main teaching point is:

> Front-end tests can be executable specifications of user behaviour and
> accessibility contracts.

This is not a React testing theory lab. It is a hands-on lab for writing tests
that describe what a user can do, what they can perceive, and how validation
feedback is exposed through the DOM.

You are not rewriting the validator in React. You are using the library you just
built and testing that the UI uses it correctly.

## What You Start With

The `src/card-validator/` project already has:

- a styled card-entry form in `src/card-validator/app/App.tsx`;
- the validator from Labs 1 and 2 in `src/card-validator/validate-card.ts`;
- Vitest Browser Mode configured for React tests;
- a starter smoke test in `src/card-validator/app/App.test.tsx`.

At the start of the lab, the shell has no complete submit behaviour and no
complete result display. Your job is to wire it up with tests.

Use the companion guide at
[`lab-3-typescript-guide.md`](./lab-3-typescript-guide.md) while working. It
explains Vitest Browser Mode, accessible queries, live regions, and the
accessibility contracts this lab uses.

## Lab Rhythm

This lab starts with a short whole-room mob so everyone sees the front-end test
shape once before working in pairs.

| Time   | Mode           | Focus                                                                    |
| ------ | -------------- | ------------------------------------------------------------------------ |
| 10 min | Concept        | The DOM is the public API: roles, labels, names, status messages         |
| 20 min | Whole-room mob | First valid-card path from failing test to green UI                      |
| 25 min | Pairs          | Invalid inputs, stale result replacement, and accessibility error wiring |
| 10 min | Pairs/stretch  | Provider logo, card preview, or axe-core smoke test                      |
| 10 min | Debrief        | What did the tests specify?                                              |

## Background: Why This Lab Exists

Functions do not ship to users. To deliver value, a function has to be attached
to a surface: an input field, an API endpoint, a CLI, a background job.

This lab is the moment the pure function becomes part of a product surface. The
front end does not need another copy of the rules; it needs to call the
validator and translate its result into something a user can see and assistive
technology can announce.

The surface is a contract in its own right. A user does not know whether
validation happens through a shared function, inline logic, or a remote service.
They only experience what the interface does.

That means UI tests should prove observable behaviour:

- what the user can enter;
- what happens when they submit;
- what message appears;
- which provider is shown;
- whether validation errors are connected to the field for assistive technology.

Do not test React internals. Test through the rendered DOM.

## Acceptance Criteria

### AC 1: Submitting a valid number shows success and the detected provider

Entering a valid Luhn number for a known provider and clicking Validate should
display a success message that names the provider.

| Input              | Expected message                  |
| ------------------ | --------------------------------- |
| `4111111111111111` | success message naming Visa       |
| `5111111111111118` | success message naming Mastercard |
| `341111111111111`  | success message naming Amex       |

The exact wording is your call. The user must be able to tell that the card was
accepted and which provider it belongs to.

### AC 2: Submitting an invalid number shows the validator's error

When the validator rejects the input, the UI must show the error message from
the validator verbatim.

| Input              | Expected message displayed     |
| ------------------ | ------------------------------ |
| empty submit       | `Card number is required`      |
| `1234567890123456` | `Unknown card provider`        |
| `411111111111111`  | `Visa cards must be 16 digits` |
| `4111111111111112` | `Invalid card number`          |

### AC 3: A new submission replaces the previous result

If the user submits, sees a result, then changes the input and submits again,
only the latest result is shown.

No stale success or error messages should remain visible.

### AC 4: The detected provider's logo is highlighted

The card visual displays provider logos for Visa, Mastercard, and Amex.

When validation succeeds, the matching logo is highlighted. The others remain
unhighlighted. Invalid submissions leave all provider logos unhighlighted.

| State                      | Visa logo     | Mastercard logo | Amex logo     |
| -------------------------- | ------------- | --------------- | ------------- |
| No result yet              | unhighlighted | unhighlighted   | unhighlighted |
| Valid Visa submitted       | highlighted   | unhighlighted   | unhighlighted |
| Valid Mastercard submitted | unhighlighted | highlighted     | unhighlighted |
| Valid Amex submitted       | unhighlighted | unhighlighted   | highlighted   |
| Invalid card submitted     | unhighlighted | unhighlighted   | unhighlighted |

Tests should query the logos by accessible name or by a stable test id and
assert the provider state through the public DOM.

### AC 5: The result region is always present in the DOM

The element that announces results must be present in the DOM at all times,
with empty content before any submission and message text after validation.

Use a live-region pattern:

```tsx
<p role="status" aria-live="polite"></p>
```

Screen readers attach announcement listeners to live regions that exist when
the page loads. If the live region is conditionally rendered only after submit,
the announcement can be missed.

### AC 6: Validation errors are programmatically associated with the input

When validation fails:

1. `aria-invalid="true"` is set on the input.
2. `aria-describedby` on the input points at the result region.

When validation succeeds, the input should not remain linked to a stale error.

Tests should use accessible queries where possible. For example, a test can find
the input by role and error description:

```ts
screen.getByRole("textbox", { description: "Card number is required" });
```

If that query fails, the UI is probably failing a real accessibility contract
too.

## Bonus Behaviours

If the core lab is complete, add one or more of these:

- the card visual mirrors what the user has typed;
- the field rejects non-digit characters at the source;
- the field caps input at 19 digits;
- the rendered form passes an `axe-core` accessibility smoke test;
- validation updates live while the user types.

## Testing Approach

Use Vitest Browser Mode and `vitest-browser-react`.

Tests should read like a user interacting with the page:

1. render the app;
2. type into the card field;
3. click Validate;
4. assert the visible or accessibility-visible result.

Prefer accessible queries:

- `getByRole`;
- `getByLabelText`;
- role with accessible name;
- role with accessible description.

Use `data-testid` only when the element is intentionally not exposed to
assistive technology.
