# Lab 2: Provider Detection and Validation

## Purpose

Extend the card validator to identify the card provider (Visa, Mastercard, Amex) and enforce provider-specific rules. By the end of this lab, the validator will not only check whether a card number is structurally valid, but also verify it matches a known provider's format and report which provider it belongs to.

This lab builds directly on Lab 1. All existing validation behaviour must continue to work.

## Background: Card Providers

Different card providers issue numbers with different formats. Your validator needs to recognise these three providers:

| Provider | Starts with | Length |
|----------|-------------|--------|
| Visa | 4 | 16 digits |
| Mastercard | 51–55 or 2221–2720 | 16 digits |
| Amex | 34 or 37 | 15 digits |

**Visa** numbers always start with the digit 4 and are 16 digits long.

**Mastercard** has two prefix ranges. The classic range is numbers starting with 51 through 55. In 2017, Mastercard added a second range: numbers starting with 2221 through 2720. Both ranges are 16 digits long.

**American Express (Amex)** numbers start with 34 or 37 and are 15 digits long.

### Resources

- [Test card numbers (Stripe)](https://docs.stripe.com/testing#cards)
- [Payment card number prefixes (Wikipedia)](https://en.wikipedia.org/wiki/Payment_card_number#Issuer_identification_number_(IIN))

## Acceptance Criteria

### Validation order

Building on Lab 1's pipeline, provider detection and length validation slot in after the digits check and before the Luhn checksum:

1. **Sanitise** — strip spaces and dashes (Lab 1)
2. **Empty check** — reject if nothing remains (Lab 1)
3. **Digits check** — reject if non-digit characters remain (Lab 1)
4. **Provider detection** — identify the provider from the prefix, reject if unknown
5. **Length check** — reject if wrong length for the detected provider
6. **Luhn check** — reject if checksum fails (Lab 1)

There's no point running a checksum on a number that's the wrong length or from an unrecognised provider.

### AC 1: Identify the card provider

The validation result must tell the caller which provider issued the card.

| Input | Expected provider |
|-------|-------------------|
| A valid 16-digit number starting with 4 | Visa |
| A valid 16-digit number starting with 51 | Mastercard |
| A valid 16-digit number starting with 2221 | Mastercard |
| A valid 15-digit number starting with 34 | Amex |
| A valid 15-digit number starting with 37 | Amex |

### AC 2: Reject unknown providers

If a card number doesn't match any known provider's prefix, reject it with the error message "Unknown card provider" — even if it would pass the Luhn checksum.

### AC 3: Validate card number length per provider

Each provider requires a specific number of digits. If a number matches a provider's prefix but has the wrong number of digits, the error message must name the provider and state the required length.

| Scenario | Error message |
|----------|---------------|
| Starts with 4, but is not 16 digits | `"Visa cards must be 16 digits"` |
| Starts with 34, but is not 15 digits | `"Amex cards must be 15 digits"` |
| Starts with 51, but is not 16 digits | `"Mastercard cards must be 16 digits"` |

### AC 4: Mastercard's full prefix range

Both of Mastercard's prefix ranges must be recognised:

| Prefix | Provider |
|--------|----------|
| 2220 | **Not** Mastercard |
| 2221 | Mastercard |
| 2500 | Mastercard |
| 2720 | Mastercard |
| 2721 | **Not** Mastercard |
| 51 | Mastercard |
| 55 | Mastercard |
| 50 | **Not** Mastercard |
| 56 | **Not** Mastercard |

### AC 5: All Lab 1 validation still works

Everything from Lab 1 must continue to function:

- Empty input → `"Card number is required"`
- Non-digit characters → `"Card number must contain only digits"`
- Spaces and dashes are stripped before validation
- Luhn checksum validation still applies (after provider and length checks)

## Hints

Look at the test card numbers you already have from Lab 1. You've been using numbers from different providers — now your validator needs to recognise them.

For Mastercard's prefix ranges, think about which specific test values will give you confidence that your boundaries are correct. The table in AC 4 is a good starting point.

Think carefully about the order you tackle these requirements. One of them will require the biggest change to your existing code — starting there will make everything else easier.

## What this lab does NOT cover

- CVV validation — a separate field, not part of the card number
- Discover, JCB, UnionPay, or other providers — keeping scope to three providers
- Frontend/backend integration — Lab 3
