# Card Test Numbers

Use these numbers in the card-validator labs. They are test numbers, not real
cards.

## Lab 1: Basic Validation

In Lab 1, provider detection is out of scope. Use provider names only as labels
for known test numbers. The validator should care only whether the input is
empty, contains allowed characters, and passes the Luhn checksum.

| Number                | Expected result  | Why it is useful                                                   |
| --------------------- | ---------------- | ------------------------------------------------------------------ |
| `4539578763621486`    | valid            | Valid Visa-shaped number that exercises the Luhn "subtract 9" step |
| `4111111111111111`    | valid            | Familiar valid Visa test number with a simple checksum path        |
| `5111111111111118`    | valid            | Valid Mastercard-shaped number                                     |
| `341111111111111`     | valid            | Valid Amex-shaped 15-digit number; useful for Luhn parity          |
| `4111111111111112`    | invalid checksum | Same shape as `4111111111111111`, but the last digit is wrong      |
| `4111111111111116`    | invalid checksum | Near-miss checksum; useful once the basic invalid case passes      |
| `1234567890`          | invalid checksum | All digits, but not a valid card number                            |
| `abcd`                | digits error     | Contains no digits                                                 |
| `4111abcd1111`        | digits error     | Mixes digits and letters                                           |
| `41111111111111!1`    | digits error     | Contains punctuation that is not an allowed separator              |
| `4111 1111 1111 1111` | valid            | Common user formatting should be accepted                          |
| `4111-1111-1111-1111` | valid            | Common user formatting should be accepted                          |

## Lab 2: Provider Detection

In Lab 2, provider rules become part of the behaviour. These examples help
describe those rules explicitly.

| Number             | Expected provider | Why it is useful                                    |
| ------------------ | ----------------- | --------------------------------------------------- |
| `4111111111111111` | Visa              | Starts with `4`, valid 16-digit Visa-shaped number  |
| `4539578763621486` | Visa              | Another valid Visa-shaped number                    |
| `5111111111111118` | Mastercard        | Classic Mastercard `51-55` range                    |
| `2223003122003222` | Mastercard        | Mastercard 2-series range                           |
| `341111111111111`  | Amex              | Starts with `34`, valid 15-digit Amex-shaped number |
| `378282246310005`  | Amex              | Starts with `37`, valid 15-digit Amex-shaped number |

Useful Mastercard 2-series boundaries:

| Prefix | Expected result                        |
| ------ | -------------------------------------- |
| `2220` | outside Mastercard 2-series range      |
| `2221` | first valid Mastercard 2-series prefix |
| `2720` | last valid Mastercard 2-series prefix  |
| `2721` | outside Mastercard 2-series range      |

## Choosing Examples

Do not use every number at once. Pick the smallest example that describes the
next missing behaviour. Add more examples when they catch a different kind of
mistake.
