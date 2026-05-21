# Lab 1: Basic Validation

## Purpose

Implement basic credit card number validation using strict TDD (RED-GREEN-REFACTOR). By the end of this lab, you'll have a function that can tell whether a card number is structurally valid.

This lab does NOT cover provider detection (Lab 2) or provider-specific rules like length (Lab 4). We're only checking: is this a plausible card number?

## Background: The Luhn Algorithm

The Luhn algorithm (also called "mod 10") is a checksum formula used to validate credit card numbers, IMEI numbers, and other identification numbers. It was invented in 1954 by Hans Peter Luhn at IBM.

**What it does**: catches accidental typos and digit transpositions. It is not a security measure — it's a quick sanity check before sending a number to a payment processor.

**How it works** ([source: Stripe](https://stripe.com/gb/resources/more/how-to-use-the-luhn-algorithm-a-guide-in-applications-for-businesses)):

1. Starting from the right, **double the second-to-last digit**, then continue doubling every second digit going left
2. If any doubled value is greater than 9, **add its digits together** to get a single digit (e.g. 14 -> 1+4 = 5)
3. **Sum all the digits** — both the doubled values and the ones you didn't double
4. If the total is a **multiple of 10**, the number is valid

### Example 1: `4539578763621486` (valid)

**Step 1** — Write out the digits and identify which to double. Starting from the right, the last digit is the check digit (never doubled). Then going left, double every other digit:

| Digit | 4 | 5 | 3 | 9 | 5 | 7 | 8 | 7 | 6 | 3 | 6 | 2 | 1 | 4 | 8 | 6 |
|-------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Action | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | check |

**Step 2** — Do the doubling. If a result is greater than 9, add its digits together:

| Doubled | Result | |
|---------|--------|---|
| 4 × 2 = 8 | 8 | |
| 3 × 2 = 6 | 6 | |
| 5 × 2 = 10 | **1** | (1+0) |
| 8 × 2 = 16 | **7** | (1+6) |
| 6 × 2 = 12 | **3** | (1+2) |
| 6 × 2 = 12 | **3** | (1+2) |
| 1 × 2 = 2 | 2 | |
| 8 × 2 = 16 | **7** | (1+6) |

**Step 3** — Replace the doubled digits with their new values, keep everything else:

| Original | 4 | 5 | 3 | 9 | 5 | 7 | 8 | 7 | 6 | 3 | 6 | 2 | 1 | 4 | 8 | 6 |
|----------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Final | **8** | 5 | **6** | 9 | **1** | 7 | **7** | 7 | **3** | 3 | **3** | 2 | **2** | 4 | **7** | 6 |

**Step 4** — Sum all the final values: 8+5+6+9+1+7+7+7+3+3+3+2+2+4+7+6 = **80**

80 ÷ 10 = 8 remainder **0** — valid.

### Example 2: `4111111111111112` (invalid)

Same process, but with a number that fails. This is `4111111111111111` (a valid Visa test number) with the last digit changed from 1 to 2.

**Step 1** — Identify which digits to double:

| Digit | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |
|-------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Action | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | | ×2 | check |

**Step 2** — Double the marked digits (no results exceed 9 here, so no digit-adding needed):

| Doubled | Result |
|---------|--------|
| 4 × 2 = 8 | 8 |
| 1 × 2 = 2 | 2 |
| 1 × 2 = 2 | 2 |
| 1 × 2 = 2 | 2 |
| 1 × 2 = 2 | 2 |
| 1 × 2 = 2 | 2 |
| 1 × 2 = 2 | 2 |
| 1 × 2 = 2 | 2 |

**Step 3** — Replace the doubled digits:

| Original | 4 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 2 |
|----------|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Final | **8** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 1 | **2** | 2 |

**Step 4** — Sum: 8+1+2+1+2+1+2+1+2+1+2+1+2+1+2+2 = **31**

31 ÷ 10 = 3 remainder **1** — not valid.

For comparison, the valid version `4111111111111111` has check digit 1 instead of 2, giving a sum of **30** (divisible by 10). Changing a single digit breaks the checksum — that's the point.

### Resources

- [Luhn algorithm (Wikipedia)](https://en.wikipedia.org/wiki/Luhn_algorithm)
- [How the Luhn algorithm works (Stripe)](https://stripe.com/resources/more/how-to-use-the-luhn-algorithm-a-guide-in-applications-for-businesses)
- [The math behind credit card numbers (Scientific American)](https://www.scientificamerican.com/article/what-is-the-luhn-algorithm-the-math-behind-secure-credit-card-numbers/)

## Acceptance Criteria

### Validation order

The function sanitises, then validates in this order. The first failing check produces the error.

1. **Sanitise** — strip spaces and dashes from input
2. **Empty check** — reject if nothing remains after sanitising
3. **Digits check** — reject if non-digit characters remain after sanitising
4. **Luhn check** — reject if checksum fails

This matches how [Braintree's card-validator](https://github.com/braintree/card-validator) and [Stripe's jquery.payment](https://github.com/stripe-archive/jquery.payment) work — sanitisation is the library's responsibility, not the caller's.

### AC 1: Reject empty input

An empty string (or a string that is only spaces/dashes) should be rejected with the error message "Card number is required".

| Input | Result |
|-------|--------|
| `""` | required error |
| `"   "` | required error (empty after stripping spaces) |
| `"---"` | required error (empty after stripping dashes) |

### AC 2: Reject non-numeric characters

After stripping spaces and dashes, if anything other than digits `0-9` remains, reject with the error message "Card number must contain only digits".

| Input | Result |
|-------|--------|
| `"abcd"` | digits error |
| `"4111abcd1111"` | digits error |
| `"41111111111111!1"` | digits error |

### AC 3: Reject invalid Luhn checksum

If the number is all digits but fails the Luhn algorithm, reject with the error message "Invalid card number".

| Input | Result |
|-------|--------|
| `"4111111111111112"` | Luhn error (last digit wrong) |
| `"1234567890"` | Luhn error |

### AC 4: Accept valid card numbers

If the number passes all checks, it should be accepted as valid.

| Input | Result |
|-------|--------|
| `"4111111111111111"` | valid (Visa test number) |
| `"5111111111111118"` | valid (Mastercard test number) |
| `"341111111111111"` | valid (Amex test number) |

### AC 5: Accept card numbers with spaces or dashes

Spaces and dashes are stripped before validation. If the number is valid after stripping, accept it.

| Input | Result |
|-------|--------|
| `"4111 1111 1111 1111"` | valid (spaces stripped) |
| `"4111-1111-1111-1111"` | valid (dashes stripped) |

## TDD implementation order

Each test introduces exactly one new behaviour:

1. **Empty string -> error** — forces basic function structure and return type
2. **Valid card number -> success** — forces the function to not just return errors
3. **Non-digit characters -> error** — forces digit checking
4. **Invalid Luhn -> error** — forces Luhn implementation
5. **Valid number with spaces -> success** — forces sanitisation
6. **Valid number with dashes -> success** — confirms sanitisation handles dashes too

## Strengthening your tests

Once your tests are green, ask yourself:

**Is your test data exercising all of your Luhn implementation?** Look at Example 1 above — some doubled digits exceed 9 and need the extra step, while in Example 2 none of them do. If your only valid card number is `4111111111111111`, which branches of your code are actually being tested?

**Are you only testing with one card number?** A single valid number might happen to have a narrow range of digit values. Try searching online for test card numbers from different providers — they have different lengths and digit patterns, which will exercise your Luhn implementation in different ways.

**How wrong is your invalid test number?** If your only invalid Luhn test is a number whose checksum is way off, a subtle bug in your implementation might still go undetected. What happens with a number that's only *slightly* wrong — say, where the Luhn sum is close to a multiple of 10 but not quite?

**What you don't need to add yet**: You don't need to check which provider a card belongs to, validate card number lengths, or enforce any provider-specific rules. Your validator should accept *any* number that passes Luhn, regardless of what it starts with or how long it is. Provider detection and provider-specific validation are coming in Labs 2 and 4.

## What this lab does NOT cover

- Provider detection (Visa, Mastercard, Amex) — Lab 2
- Card number length requirements per provider — Lab 4
- CVV validation — Lab 4
- Frontend/backend integration — Lab 3
