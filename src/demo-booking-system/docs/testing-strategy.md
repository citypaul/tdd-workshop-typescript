# Testing strategy

This project tests the same business logic at multiple layers on purpose. That is a deliberate choice, and it is not the only reasonable way to do things. This document explains what we do, why we do it, and what we give up in exchange, so that readers can evaluate the tradeoffs for their own context.

## What we do, at a glance

Four test layers, each with a clear job:

| Layer             | Entry point                          | What it tests exhaustively                                                                                | What it does NOT re-test                                     |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Domain**        | `validateBooking()` and rule helpers | Every business rule and every boundary, as a spec for the pure logic                                      | HTTP, persistence, UI                                        |
| **API**           | HTTP requests against the Hono app   | Every business rule and every boundary _again_, **plus** parsing, status codes, persistence, error bodies | UI                                                           |
| **Web component** | React props and DOM interactions     | Component behaviour given inputs — error banners, form state, rendered data                               | Business rules (MSW mocks the API at the network boundary)   |
| **Acceptance**    | Playwright + MSW in a real browser   | 3–5 user stories end-to-end — "a user books a room", "a user sees the conflict overlay"                   | Exhaustive scenarios; these are representative, not complete |

The **domain and API layers both test every business rule**. That's the duplication, and it is the most controversial part of this strategy. The rest of the document is primarily about why.

## Intentional anti-pattern suite

The repo also contains `*.mirror.test.*` files. These are not examples to copy.
They exist as a workshop teaching artefact: implementation-coupled tests can
stay green while the real product promise is broken.

For example, `api/bookings.mirror.test.ts` stubs `validateBooking` and proves
that the API handler maps a stubbed `no-past` validation result to a `400`. That
sounds useful, but it does **not** prove the real `no-past` rule. If the domain
stops rejecting past bookings, the mirror test still passes because it supplied
the rejection itself. The behaviour tests in `domain/validate-booking.test.ts`
and `api/bookings.test.ts` are the tests that protect the product promise.

## Why we chose this

### 1. Localised failure signals

When someone breaks a business rule, we want a specific test named for that business rule to fail. When someone breaks HTTP wiring, we want an HTTP-specific test to fail. With layered tests at every public entry point, a failure tells you not just _what_ broke but _at which boundary_.

A domain test named `rejects bookings that start before now` that fails is a louder, more useful signal than an API test named `returns 400 when the request is invalid` that fails.

### 2. Fast TDD loops at the domain

The domain layer has no async, no request construction, no JSON, no date serialisation. You can drive a rule from RED to GREEN in a few seconds per cycle. Compared to writing the same cycle through the API, the ceremony per test drops by roughly 5×. For a rule-heavy codebase built via strict TDD, that compounds quickly.

### 3. Defense in depth for business logic

Business rules are where bugs hurt the most. By testing every rule at two layers, a bug in the rule must slip past _both_ test suites to reach production. A weakened or accidentally deleted domain test still leaves the API layer as a safety net, and vice versa.

This is not paranoia — it is a reflection of how testing actually degrades over time. Teams prune tests, refactor test helpers, deprecate methods. Having the same behavioural claim expressed at two independent boundaries makes that erosion visible: if one layer's test goes away, the other still anchors the behaviour.

### 4. Drift detection between layers

In real systems, validation logic in an API handler and validation logic in a domain function _drift apart_. Someone adds a "trim whitespace" check in the handler but forgets the domain. Someone introduces a feature flag in the domain but forgets the API shortcut path. When each layer has its own tests for the shared behaviour, drift surfaces immediately — the API test passes, the domain test fails, and the engineer sees the inconsistency.

If only one layer has the tests, drift is invisible.

### 5. Scales to new entry points

Today this project has a single HTTP API consumer. In the real world, domain logic tends to grow callers over time: a CLI, a cron job, a gRPC service, a queue worker. With the "test at every public entry point" convention already established, each new caller inherits an obvious testing responsibility: _verify the business behaviour through your own interface_. No team debates about "do we need tests here if the domain has them already?" — the pattern answers the question.

### 6. Clean mutation signals

Stryker mutates each source file and asks which tests kill which mutants. With layered tests, a mutation to `validate-booking.ts` dies to domain tests (and usually API tests too — which is fine, defense in depth). A mutation to `api/handlers/bookings.ts` dies only to API tests — the domain doesn't know about HTTP. Each mutation report reads clearly: "this line is protected by these tests at this layer."

If the API layer owned business-logic testing, mutations in `validate-booking.ts` would only die to API tests, and the report's narrative about which tests protect which layers would blur.

## What we give up

Being honest about the costs:

### Duplication

The same behavioural claim is expressed twice — once as a domain test, once as an API test. Roughly 15 tests become ~35. When a business rule changes, both layers' tests need to change. That is real maintenance overhead.

We accept this because the workshop's message — "tests are executable specifications" — is strengthened, not weakened, by having the spec expressed at every boundary where that spec must hold.

### Coupling to the architecture

Tests that exist at the domain layer assume there _is_ a domain layer. If we decided to inline all validation into the HTTP handlers, the domain tests would need deleting rather than just porting. An outside-in approach (see below) is more resilient to this particular class of refactoring.

We accept this because the current architecture is deliberate and the boundaries are stable. If the codebase's architecture were in flux, we'd bias toward outside-in for exactly the flexibility outside-in offers.

### Maintenance overhead on rule changes

If the "no-overlap" rule changes from "can't overlap" to "can't overlap unless one booking is marked as tentative", both domain and API test suites need new scenarios. That is more work than updating one suite.

We accept this because rule changes are rare compared to everyday development, and when they happen we _want_ both layers to declare the new contract.

## Honest comparison with alternatives

There are several well-known testing strategies that would produce different tradeoffs. We considered each.

### Alternative A — Outside-in only

**What it is:** test only through the public HTTP API. No separate domain tests. Business rules are proven by the HTTP contract.

**What it's good at:**

- Maximum refactoring freedom — restructure internals arbitrarily, tests still pass.
- No duplication: one test per behaviour.
- Tests always exercise the _real_ path, not a unit in isolation.
- Each test matches the user/consumer's perspective.

**Where it hurts for us:**

- TDD loops are slow — each rule cycle needs request construction, JSON, async, routing.
- When a rule breaks, multiple HTTP tests cascade-fail; the root-cause location is obscured.
- Adding a new consumer type (CLI, worker) means establishing a whole new testing infrastructure before the pattern can extend.
- Mutation reports are noisier — domain mutations only die to HTTP-shaped tests, which describe consequences, not causes.

**Where we'd choose it instead:** small domains where the logic is a thin mapping; apps whose only entry point will ever be the HTTP API; teams that can tolerate slower TDD feedback in exchange for maximum refactoring freedom at lower layers.

### Alternative B — Classic / unit-only

**What it is:** exhaustive domain tests; no API tests, or only a single smoke test that "the server starts."

**What it's good at:**

- Fastest possible test suite.
- Cleanest mutation signals at the domain layer.
- Minimum ceremony per test.
- Ideal for pure algorithmic work.

**Where it hurts for us:**

- Parsing bugs, serialisation bugs, status-code bugs all slip through.
- No confidence that the API is actually wired up correctly.
- Drift between domain and API goes undetected.
- Production bugs tend to concentrate in the untested seam.

**Where we'd choose it instead:** algorithm libraries published as packages; pure computation engines with no integration surface; the domain layer of an outside-in project where the domain tests are a refactoring aid rather than the contract.

### Alternative C — Integration-only (no unit tests)

**What it is:** only API-level tests; no separate domain suite.

This is a variant of outside-in. Same tradeoffs, with the added problem that the domain is tested _indirectly_, often through just-enough-scenarios rather than exhaustive coverage.

**Where it hurts for us:** same reasons as (A), but with weaker guarantees because integration-only tests often end up as sampling rather than specification.

**Where we'd choose it instead:** prototypes; throwaway scripts; projects where the "domain" is a handful of functions that would be silly to abstract.

### Alternative D — Pyramid with representative integration tests

**What it is:** exhaustive domain tests, plus one or two API tests per feature as a smoke-test layer.

This is the classic test-pyramid approach and is a _very_ reasonable choice.

**Where it hurts for us:** the API layer becomes sampling rather than specification. When the API handler's mapping of domain errors to HTTP responses has a subtle bug in a rule category that wasn't picked as a representative, the bug reaches production.

**Where we'd choose it instead:** mature codebases with stable interfaces; teams where the velocity cost of duplicate tests outweighs the defense-in-depth benefit; cases where the API handler is genuinely trivial (a one-line forwarder).

## When we'd change our minds

We'd revisit this strategy if:

1. **The domain becomes a thin wrapper.** If `validateBooking` shrinks to a 3-line function, the domain tests carry less weight than the HTTP ceremony they replace. At that point, outside-in wins.
2. **The API surface explodes.** If we end up with dozens of endpoints, maintaining parallel exhaustive suites becomes expensive. We'd sample at the API layer and rely on domain tests as the specification.
3. **A second consumer appears.** If a CLI or worker starts calling `validateBooking` directly, the domain-layer exhaustive suite becomes even more valuable (it protects _that_ consumer), and the API layer's responsibility narrows to "HTTP-specific concerns only."
4. **Test-suite runtime passes a threshold.** If domain + API + component + acceptance together start feeling slow (>30s locally, >3 minutes in CI), we'd prune. The domain would stay exhaustive; the API would sample.

None of these are true now, so the current strategy stands.

## Applying the strategy when adding new code

When introducing a new feature or a new component:

1. **Identify the entry points.** Domain function? API route? React component? Each is a boundary.
2. **Write behavioural tests at each entry point.** Each test describes what a caller of that boundary should observe — not how it works internally.
3. **Duplicate across boundaries only for business rules.** Plumbing concerns (status codes, query parsing, DOM details) are tested only at the layer they live at.
4. **Use MSW at the web layer.** Components should never call a real API in their tests; the network boundary is mocked per scenario.
5. **Keep acceptance tests sparse.** Three to five user-story scenarios, not one per rule. Their job is "the whole stack works for the happy paths and the critical failure paths," not exhaustive coverage.

## The Multi-Layer Break Playbook

This is how the workshop demonstrates the strategy live. Each category of break maps to a predictable failure pattern:

| What breaks              | Which tests fail                                   | What the audience sees                                             |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------ |
| A business rule (domain) | Domain test **and** API test                       | Both layers catch the regression — defense in depth in action      |
| An HTTP concern          | API test only                                      | Localised failure at the HTTP boundary; domain unaffected          |
| A UI rendering decision  | Web component test only                            | Localised failure at the UI boundary; business logic unaffected    |
| A user-flow wiring bug   | Acceptance test (plus potentially component tests) | End-to-end path is broken; individual components pass in isolation |

The pattern is legible: _which test fails tells you which boundary broke_.

## Further reading

For engineers who want to dig into the debates behind these choices:

- **Kent Beck** — _Test-Driven Development: By Example_. The foundational text. Read this first if you haven't.
- **Steve Freeman and Nat Pryce** — _Growing Object-Oriented Software, Guided by Tests_. The canonical London-school / outside-in reference.
- **Jay Fields** — _Working Effectively with Unit Tests_. Classic-school counterpoint with strong opinions on what unit tests should and shouldn't do.
- **Dave Farley** — _Continuous Delivery_ and his YouTube channel. Modern take on what tests are really for and when each layer earns its keep.
- **Ian Cooper** — _"TDD, Where Did It All Go Wrong"_ (GOTO talk). A counter-argument to over-testing that is worth wrestling with even if you disagree.
- **Martin Fowler** — _"Mocks Aren't Stubs"_ and _"TestPyramid"_. Short articles that frame the vocabulary the rest of the field uses.
- **Michael Feathers** — _Working Effectively with Legacy Code_. Essential for understanding how test coverage and architecture interact as code ages.

No single book will tell you "the right way to test." The right way depends on the codebase, the team, and what you are trying to prove. This project's strategy is one informed answer; yours should be another.
