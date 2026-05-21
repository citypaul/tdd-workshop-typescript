import { test as base, expect } from '@playwright/test';
import { http } from 'msw';
import { createWorkerFixture, type MockServiceWorker } from 'playwright-msw';
import { defaultHandlers } from './handlers';

// Playwright test fixture that wires MSW into the page via `playwright-msw`.
// Interception happens at the driver layer, so the app (main.tsx) stays pure
// production code — no VITE_E2E flag, no scenario protocol, no window globals.
// Tests pass their scenario as MSW handlers via `worker.use(...)`, which is
// the same API the Vitest browser tests already use.
export const test = base.extend<{
  worker: MockServiceWorker;
  http: typeof http;
}>({
  worker: createWorkerFixture(defaultHandlers),
  http,
});

export { expect };
