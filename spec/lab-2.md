# Lab 2: Provider Detection and Validation

## Purpose

Extend the card validator so it can identify supported card providers and apply
provider-specific rules.

By the end of this lab, the validator will still answer the Lab 1 question:

> Does this input look like a plausible card number?

It will also answer a new product question:

> If the number is plausible, which supported provider does it belong to?

This lab builds directly on Lab 1. All existing validation behaviour must keep
working. Lab 1 only needed to say "there is an error" or "there is no error",
so a small return shape was enough. The validator is still evolving. Lab 2 adds
a behaviour that needs more information, so the tests help us keep the Lab 1
business rules intact while we iterate on the API's return value. If other code
already consumed this function, changing that return value would be a breaking
API change, so the tests should make that cost visible and help you update
deliberately.

That means the first useful move in this lab is not only "add a new provider
test." First, look at the Lab 1 tests and decide how those expectations should
read now that the caller needs a richer response. Updating existing
expectations is part of the design work.

## Getting Started

From a clean worktree, switch to this lab checkpoint:

```bash
pnpm start:lab2
```

Read the **Purpose**, **Business Requirements**, and **Acceptance Criteria**
before you write any new tests. In the workshop, this lab will run as a
whole-room ensemble so the design decisions stay visible.

From the repository root, start the card-validator unit tests in watch mode:

```bash
pnpm test:card:watch --project=unit
```

Continue in `src/card-validator/validate-card.test.ts`. Start by reviewing the
Lab 1 expectations. Some of them will need to change so they describe the same
business rules through the new response shape. Then add provider behaviour one
test at a time.

The implementation lives in `src/card-validator/validate-card.ts`.

Useful starting question:

> What must the caller be able to observe now, and which existing expectations
> need to change to express that?

If you want to run the card-validator unit tests once instead of watch mode:

```bash
pnpm test:card:unit
```

## Business Requirements

Imagine this validator is used by a checkout or booking form before the system
sends anything to a payment processor. Lab 1 gave users fast feedback for
obvious card-number mistakes. Lab 2 adds the supported-provider promise.

The validator should:

- keep all Lab 1 behaviour working;
- identify valid Visa, Mastercard, and Amex numbers;
- report the detected provider to the caller;
- reject card numbers from unsupported providers with a clear error;
- enforce the length required by the detected provider;
- recognise both Mastercard prefix ranges, including their boundaries.

The validator should not:

- contact a payment provider;
- decide whether a card account is real, active, or has funds;
- support Discover, JCB, UnionPay, or other providers;
- validate CVV, expiry dates, names, billing addresses, or postal codes;
- build any UI behaviour yet. That comes in Lab 3.

Useful card-number examples are collected in
[Card Test Numbers](./card-test-numbers.md).

## Provider Rules

Your validator needs to recognise these supported providers:

| Provider | Starts with | Length |
| --- | --- | --- |
| Visa | `4` | 16 digits |
| Mastercard | `51`-`55` or `2221`-`2720` | 16 digits |
| Amex | `34` or `37` | 15 digits |

Notes:

- Visa numbers start with `4` and are 16 digits long.
- Mastercard has two prefix ranges: the classic `51`-`55` range and the
  `2221`-`2720` range. Both are 16 digits long.
- Amex numbers start with `34` or `37` and are 15 digits long.

## Acceptance Criteria

### AC 1: Identify the card provider

The validation result must tell the caller which provider issued the card.

| Input | Expected provider |
| --- | --- |
| A valid 16-digit number starting with `4` | Visa |
| A valid 16-digit number starting with `51` | Mastercard |
| A valid 16-digit number starting with `2221` | Mastercard |
| A valid 15-digit number starting with `34` | Amex |
| A valid 15-digit number starting with `37` | Amex |

This is an API-feedback point. The Lab 1 result shape was enough when the
validator only answered "error or no error". Lab 2 needs the caller to know the
provider as well. Thinking ahead is allowed, but the TDD skill is listening to
feedback from the next executable specification. When tests show the current
return value no longer carries enough information, you can change it while the
existing business rules stay protected.

### AC 2: Reject unknown providers

If a card number does not match any supported provider prefix, reject it with:

```text
Unknown card provider
```

This should happen even if the number would pass the Luhn checksum.

### AC 3: Validate card number length per provider

Each provider requires a specific number of digits. If a number matches a
provider prefix but has the wrong number of digits, the error message must name
the provider and state the required length.

| Scenario | Error message |
| --- | --- |
| Starts with `4`, but is not 16 digits | `Visa cards must be 16 digits` |
| Starts with `34` or `37`, but is not 15 digits | `Amex cards must be 15 digits` |
| Starts with a Mastercard prefix, but is not 16 digits | `Mastercard cards must be 16 digits` |

### AC 4: Mastercard's full prefix range

Both of Mastercard's prefix ranges must be recognised.

| Prefix | Expected result |
| --- | --- |
| `2220` | not Mastercard |
| `2221` | Mastercard |
| `2500` | Mastercard |
| `2720` | Mastercard |
| `2721` | not Mastercard |
| `50` | not Mastercard |
| `51` | Mastercard |
| `55` | Mastercard |
| `56` | not Mastercard |

The boundary examples matter. A broad "starts with 2" or "starts with 5"
implementation would give false confidence here.

### AC 5: All Lab 1 validation still works

Everything from Lab 1 must continue to function:

- Empty input -> `Card number is required`
- Non-digit characters -> `Card number must contain only digits`
- Spaces and dashes do not make an otherwise valid card number fail validation
- Luhn checksum validation still applies for supported provider numbers that
  otherwise meet the provider rule

## Choosing Examples

Do not turn the acceptance criteria into a batch of tests upfront. Use them as
raw material for the next executable specification.

Start with these questions:

> What must the caller be able to observe that it could not observe before?
>
> Which existing Lab 1 expectations need to change so they still describe the
> same business rules through the richer response?

Some existing tests need to change because the API return value evolves. That
is okay. The business rules stay; the returned value is what is being iterated
so it can support the new provider behaviour.

One useful spine is:

1. agree what the caller now needs from the response;
2. update the existing Lab 1 expectations so required errors, digit errors,
   checksum errors, and known-valid cards still mean the same thing through the
   new response shape;
3. add the first provider example that proves the response now needs to expose
   provider information.

For example, the known-valid card examples from Lab 1 should still say
"accepted card number" rather than becoming provider-detection tests by
accident. Add a separate provider test when the behaviour you mean is "caller
can observe Visa."

Useful prompts:

- Which example gives us the smallest useful design change?
- What information did Lab 1 not need to return?
- Which example proves the result now needs to expose a provider?
- Which existing expectation should we update first to describe the new
  response contract?
- Which existing tests protect Lab 1's business rules while we iterate the API
  return value?
- If this function already had consumers, what would break and how would the
  tests show us?
- Which boundary would catch an over-generalised prefix check?
- Which old Lab 1 test tells us a business rule still works after the return
  value changes?

Good first behaviours to consider:

- empty input still reports `Card number is required` through the new response
  shape;
- a known-valid card still reports success through the new response shape;
- a valid Visa reports `visa`;
- a valid Mastercard in the classic range reports `mastercard`;
- a valid Amex reports `amex`;
- an unsupported but Luhn-valid number rejects with `Unknown card provider`;
- a Mastercard boundary example proves the `2221`-`2720` range.

The exact order can change as the design teaches you something. Keep the loop
small: one failing test, one implementation change, one refactor.

## What This Lab Does Not Cover

- CVV validation - a separate field, not part of the card number
- Discover, JCB, UnionPay, or other providers
- Frontend/backend integration - Lab 3
