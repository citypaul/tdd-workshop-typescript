# TypeScript TDD Workshop

A hands-on workshop teaching that tests are executable specifications: they describe what the system should do, not how the implementation happens to work.

The core exercise is a credit-card validator built through strict TDD in TypeScript. Later labs connect that same validator to a React form and use browser-based front-end tests to describe user-visible behaviour.

## Setup

You need:

- Node.js 22.12.0 or newer. Node 22 LTS is the simplest choice.
- pnpm 10 or 11.
- Git.

Check your versions:

```bash
node --version
pnpm --version
git --version
```

### Fix Node.js

If `node --version` is missing or lower than `v22.12.0`, install Node 22 with one of these:

macOS/Linux with `nvm`:

```bash
nvm install 22
nvm use 22
```

Windows with `nvm-windows`:

```powershell
nvm install 22
nvm use 22
```

Any OS with Volta:

```bash
volta install node@22
```

After changing Node, open a new terminal and run `node --version` again.

### Fix pnpm

If `pnpm --version` is missing, or is not `10.x` or `11.x`, use Corepack:

```bash
corepack enable
corepack install -g pnpm@10
pnpm --version
```

If Corepack cannot create the `pnpm` command on Windows, run the terminal as Administrator and try again, or install pnpm directly:

```bash
npm install -g pnpm@10
```

### Install Dependencies

From the repository root:

```bash
pnpm install
pnpm exec playwright install chromium
pnpm test:card
```

The Playwright command installs Chromium for browser-mode tests. If Chromium is already installed, it is quick.

To run the card-validator app:

```bash
pnpm dev:card
```

To run the booking-system demo:

```bash
pnpm dev:booking
pnpm test:booking
```

### Windows Notes

The main workshop commands should work on Windows from PowerShell, Windows Terminal, Git Bash, or the VS Code terminal:

```bash
pnpm install
pnpm test:card
pnpm dev:card
pnpm dev:booking
pnpm test:booking
```

Prefer a short checkout path, such as `C:\dev\tdd-workshop-typescript`, especially on locked-down corporate machines.

Known exception: `pnpm mutation:booking:diff` runs a Bash script. Use Git Bash or WSL for that optional command. The normal lab commands do not need Bash.

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

| Tag           | What it represents          |
| ------------- | --------------------------- |
| `lab-1-start` | Before Lab 1 implementation |
| `lab-1-end`   | Lab 1 complete              |
| `lab-2-start` | Before Lab 2 implementation |
| `lab-2-end`   | Lab 2 complete              |
| `lab-3-start` | Before Lab 3 implementation |

Use the start tags during the workshop. Use the end tags only after trying the exercise, or when you want to inspect one finished route through the problem.

## Useful Commands

| Command                        | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `pnpm test:card`               | Run the card-validator tests                   |
| `pnpm test:card:unit`          | Run pure validator tests                       |
| `pnpm test:card:browser`       | Run React form browser tests                   |
| `pnpm mutate:card`             | Run mutation testing for the card validator    |
| `pnpm test:booking`            | Run booking-system domain/API/web tests        |
| `pnpm acceptance:booking`      | Run booking-system Playwright acceptance tests |
| `pnpm mutation:booking`        | Run booking-system mutation tests              |
| `pnpm mutation:booking:mirror` | Run the mirror-test mutation demo              |

## Test Data

| Provider            | Number             | Length |
| ------------------- | ------------------ | ------ |
| Visa                | `4111111111111111` | 16     |
| Visa                | `4539578763621486` | 16     |
| Mastercard classic  | `5111111111111118` | 16     |
| Mastercard 2-series | `2223003122003222` | 16     |
| Amex                | `341111111111111`  | 15     |
| Amex                | `378282246310005`  | 15     |
