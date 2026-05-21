# TypeScript TDD Workshop

A hands-on workshop teaching that tests are executable specifications: they describe what the system should do, not how the implementation happens to work.

The core exercise is a credit-card validator built through strict TDD in TypeScript. Later labs connect that same validator to a React form and use browser-based front-end tests to describe user-visible behaviour.

## Setup

You need Node.js 22.12+ and pnpm 10 or 11. If `pnpm` is not already available, recent Node installs can usually enable it with:

```bash
corepack enable
```

Install dependencies from the repository root:

```bash
pnpm install
pnpm test:card
```

To run the card-validator app:

```bash
pnpm dev:card
```

To run the booking-system demo:

```bash
pnpm dev:booking
pnpm test:booking
```

## Repository Layout

```text
spec/                         Lab specifications and workshop guides
src/card-validator/           Credit-card validator and React form
src/demo-booking-system/      Demo app for behavioural testing examples
```

## Labs

- **Lab 1** - basic validation: Luhn algorithm, sanitisation, empty/digits checks
- **Lab 2** - provider detection: Visa / Mastercard / Amex identification, provider-specific length rules, Mastercard 2221-2720 range
- **Lab 3** - wiring the validator into a React card-entry form and testing it through the browser

## Git Tags

| Tag | What it represents |
| --- | --- |
| `lab-1-start` | Before Lab 1 implementation |
| `lab-1-end` | Lab 1 complete |
| `lab-2-start` | Before Lab 2 implementation |
| `lab-2-end` | Lab 2 complete |
| `lab-3-start` | Before Lab 3 implementation |

Use the start tags during the workshop. Use the end tags only after trying the exercise, or when you want to inspect one finished route through the problem.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `pnpm test:card` | Run the card-validator tests |
| `pnpm test:card:unit` | Run pure validator tests |
| `pnpm test:card:browser` | Run React form browser tests |
| `pnpm mutate:card` | Run mutation testing for the card validator |
| `pnpm test:booking` | Run booking-system domain/API/web tests |
| `pnpm acceptance:booking` | Run booking-system Playwright acceptance tests |
| `pnpm mutation:booking` | Run booking-system mutation tests |
| `pnpm mutation:booking:mirror` | Run the mirror-test mutation demo |

## Test Data

| Provider | Number | Length |
| --- | --- | --- |
| Visa | `4111111111111111` | 16 |
| Visa | `4539578763621486` | 16 |
| Mastercard classic | `5111111111111118` | 16 |
| Mastercard 2-series | `2223003122003222` | 16 |
| Amex | `341111111111111` | 15 |
| Amex | `378282246310005` | 15 |
