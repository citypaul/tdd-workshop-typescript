# Lab 1: Basic Validation

## Purpose

Implement basic credit card number validation using strict TDD
(RED-GREEN-REFACTOR). By the end of this lab, you'll have a function that can
tell whether a card number is structurally valid.

This lab does NOT cover provider detection or provider-specific rules like
length; those come in Lab 2. We're only checking: is this a plausible card
number?

## Getting Started

From a clean worktree, switch to this lab checkpoint:

```bash
pnpm start:lab1
```

Read the **Purpose**, **Business Requirements**, and **Acceptance Criteria**
before you write any tests. In the workshop, we will read these together first,
then choose the first few behaviours as a group.

From the repository root, start the card-validator unit tests in watch mode:

```bash
pnpm test:card:watch --project=unit
```

Start in `src/card-validator/validate-card.test.ts`. At `lab-1-start`, it
contains a tiny smoke test. Replace that with your first behaviour test.

Create the implementation in `src/card-validator/validate-card.ts` when your
first failing test asks for it.

Work one behaviour at a time:

1. write one failing test;
2. make the smallest change that passes;
3. refactor before adding the next test.

The first couple of tests will be written together in the workshop so everyone
can see the red-green-refactor rhythm. After that, continue in pairs by default
or work solo if that helps you learn better.

If you want to run the card-validator unit tests once instead of watch mode:

```bash
pnpm test:card:unit
```

## Business Requirements

Imagine this validator is used by a checkout or booking form before the system
sends anything to a payment processor. The business wants fast, clear feedback
for obvious mistakes, without pretending to take a payment or check whether a
real account exists.

The validator answers one product question:

> Does this input look like a plausible card number?

It should:

- reject missing input with a clear required-message;
- reject letters, punctuation, or symbols that are not part of a card number;
- reject numbers that fail the card-number checksum;
- accept structurally valid card numbers;
- tolerate spaces and dashes because users often type or paste card numbers in
  groups.

It should not:

- contact a payment provider;
- decide whether the card account is real, active, or has funds;
- identify the card provider;
- enforce provider-specific lengths;
- validate CVV, expiry dates, names, billing addresses, or postal codes.

Useful card-number examples are collected in
[Card Test Numbers](./card-test-numbers.md).

## Acceptance Criteria

### AC 1: Reject empty input

An empty string (or a string that is only spaces/dashes) should be rejected with
the error message "Card number is required".

| Input | Result |
|-------|--------|
| `""` | required error |
| `"   "` | required error (empty after stripping spaces) |
| `"---"` | required error (empty after stripping dashes) |

### AC 2: Reject non-numeric characters

After stripping spaces and dashes, if anything other than digits `0-9` remains,
reject with the error message "Card number must contain only digits".

| Input | Result |
|-------|--------|
| `"abcd"` | digits error |
| `"4111abcd1111"` | digits error |
| `"41111111111111!1"` | digits error |

### AC 3: Reject invalid checksum

If the number is all digits but fails the checksum, reject with the error
message "Invalid card number".

| Input | Result |
|-------|--------|
| `"4111111111111112"` | checksum error (last digit wrong) |
| `"1234567890"` | checksum error |

### AC 4: Accept valid card numbers

If the number passes all checks, it should be accepted as valid.

| Input | Result |
|-------|--------|
| `"4111111111111111"` | valid (Visa test number) |
| `"5111111111111118"` | valid (Mastercard test number) |
| `"341111111111111"` | valid (Amex test number) |

### AC 5: Accept card numbers with spaces or dashes

The validator is responsible for common user formatting. Spaces and dashes
should not make an otherwise valid card number fail validation, and callers
should not need to strip those separators first.

This matches the caller contract in libraries such as
[Braintree's card-validator](https://github.com/braintree/card-validator) and
[Stripe's jquery.payment](https://github.com/stripe-archive/jquery.payment):
formatting separators are accepted by the validator, not pre-cleaned by the
caller.

| Input | Result |
|-------|--------|
| `"4111 1111 1111 1111"` | valid (spaces stripped) |
| `"4111-1111-1111-1111"` | valid (dashes stripped) |

## Implementation Details

You do not need these details before choosing the first test. They are here to
support the implementation once a failing example asks for checksum behaviour.

### Background: The Luhn Algorithm

The Luhn algorithm (also called "mod 10") is a checksum formula used to validate
credit card numbers, IMEI numbers, and other identification numbers. It was
invented in 1954 by Hans Peter Luhn at IBM.

**What it does**: catches accidental typos and digit transpositions. It is not a
security measure - it's a quick sanity check before sending a number to a
payment processor.

**How it works** ([source: Stripe](https://stripe.com/gb/resources/more/how-to-use-the-luhn-algorithm-a-guide-in-applications-for-businesses)):

1. Starting from the right, **double the second-to-last digit**, then continue
   doubling every second digit going left
2. If any doubled value is greater than 9, **add its digits together** to get a
   single digit (e.g. 14 -> 1+4 = 5)
3. **Sum all the digits** - both the doubled values and the ones you didn't
   double
4. If the total is a **multiple of 10**, the number is valid

### Example 1: `4539578763621486` (valid)

**Step 1** - Write out the digits and identify which to double. Starting from
the right, the last digit is the check digit (never doubled). Then going left,
double every other digit:

| Digit | 4 | 5 | 3 | 9 | 5 | 7 | 8 | 7 | 6 | 3 | 6 | 2 | 1 | 4 | 8 | 6 |
|-------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Action | x2 | | x2 | | x2 | | x2 | | x2 | | x2 | | x2 | | x2 | check |

**Step 2** - Do the doubling. If a result is greater than 9, add its digits
together:

| Doubled | Result | |
|---------|--------|---|
| 4 x 2 = 8 | 8 | |
| 3 x 2 = 6 | 6 | |
| 5 x 2 = 10 | **1** | (1+0) |
| 8 x 2 = 16 | **7** | (1+6) |
| 6 x 2 = 12 | **3** | (1+2) |
| 6 x 2 = 12 | **3** | (1+2) |
| 1 x 2 = 2 | 2 | |
| 8 x 2 = 16 | **7** | (1+6) |

**Step 3** - Replace the doubled digits with their new values, keep everything
else:

| Original | 4 | 5 | 3 | 9 | 5 | 7 | 8 | 7 | 6 | 3 | 6 | 2 | 1 | 4 | 8 | 6 |
|----------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Final | **8** | 5 | **6** | 9 | **1** | 7 | **7** | 7 | **3** | 3 | **3** | 2 | **2** | 4 | **7** | 6 |

**Step 4** - Sum all the final values:

8+5+6+9+1+7+7+7+3+3+3+2+2+4+7+6 = **80**

80 / 10 = 8 remainder **0** - valid.

### Example 2: `4111111111111112` (invalid)

Same process, but with a number that fails. This is `4111111111111111` (a valid
Visa test number) with the last digit changed from 1 to 2.

**Step 1** - Identify which digits to double:

| Digit | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |
|-------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Action | x2 | | x2 | | x2 | | x2 | | x2 | | x2 | | x2 | | x2 | check |

**Step 2** - Double the marked digits (no results exceed 9 here, so no
digit-adding needed):

| Doubled | Result |
|---------|--------|
| 4 x 2 = 8 | 8 |
| 1 x 2 = 2 | 2 |
| 1 x 2 = 2 | 2 |
| 1 x 2 = 2 | 2 |
| 1 x 2 = 2 | 2 |
| 1 x 2 = 2 | 2 |
| 1 x 2 = 2 | 2 |
| 1 x 2 = 2 | 2 |

**Step 3** - Replace the doubled digits:

| Original | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |
|----------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Final | **8** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 2 |

**Step 4** - Sum:

8+1+2+1+2+1+2+1+2+1+2+1+2+1+2+2 = **31**

31 / 10 = 3 remainder **1** - not valid.

For comparison, the valid version `4111111111111111` has check digit 1 instead
of 2, giving a sum of **30** (divisible by 10). Changing a single digit breaks
the checksum - that's the point.

### Resources

- [Luhn algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Luhn_algorithm)
- [How the Luhn algorithm works (Stripe)](https://stripe.com/resources/more/how-to-use-the-luhn-algorithm-a-guide-in-applications-for-businesses)
- [The math behind credit card numbers (Scientific American)](https://www.scientificamerican.com/article/what-is-the-luhn-algorithm-the-math-behind-secure-credit-card-numbers/)

## Strengthening your tests

Once your tests are green, ask a stronger question:

> If my Luhn implementation were subtly wrong, which example would catch it?

Useful ways to prove the checksum behaviour:

1. **Use at least one valid number that exercises the "subtract 9" step.**
   `4111111111111111` is valid, but none of its doubled digits go above 9.
   `4539578763621486` is more useful because some doubled digits become 10 or
   more.
2. **Use more than one valid number.** A small set of known-valid card numbers
   gives you more confidence than one magic value. In Lab 1, provider names are
   labels for recognisable card-number shapes, not behaviour to detect yet:

   | Example | Number | Why it is useful |
   | --- | --- | --- |
   | Visa-shaped number | `4539578763621486` | Exercises the "subtract 9" step |
   | Visa all-ones test number | `4111111111111111` | Familiar valid checksum example |
   | Mastercard-shaped number | `5111111111111118` | Another valid 16-digit number |
   | Amex-shaped number | `341111111111111` | Valid 15-digit number with different Luhn parity |

   If you turn these into a table test, keep the test name about the Lab 1
   behaviour: accepting known-valid card numbers. Provider detection starts in
   Lab 2.

3. **Include a same-shape invalid number.** `4111111111111112` is useful because
   it is the valid Visa test number with only the final digit changed.
4. **Include a near-miss invalid number.** `4111111111111116` is still invalid,
   but the checksum sum is closer to a multiple of 10. This catches mistakes
   that only reject numbers that are obviously wrong.
5. **Cover different lengths before you care about providers.** A 15-digit valid
   number such as `341111111111111` and a 16-digit valid number exercise the
   left/right parity of the Luhn algorithm differently. You are still not
   enforcing provider-specific length rules in this lab.
6. **Test through `validateCard`, not through a private Luhn helper.** The
   behaviour that matters is the validator's answer for a card number. You do
   not need tests for intermediate sums or doubled digits.

What good Luhn tests should catch:

- forgetting to double every second digit;
- doubling from the wrong side;
- forgetting to subtract 9 when a doubled digit is greater than 9;
- accepting an all-digit number just because it has the right shape;
- treating a near-miss checksum as valid.

What you do not need to add yet: You do not need to check which provider a card
belongs to, validate card number lengths, or enforce any provider-specific
rules. Your validator should accept *any* number that passes the checksum,
regardless of what it starts with or how long it is. Provider detection and
provider-specific validation are coming in Lab 2.

## What this lab does NOT cover

- Provider detection (Visa, Mastercard, Amex) - Lab 2
- Card number length requirements per provider - Lab 2
- CVV validation - out of scope for this workshop
- Frontend/backend integration - Lab 3
