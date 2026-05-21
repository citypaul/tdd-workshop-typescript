import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupWorker } from 'msw/browser';

export const mswBrowserWorker = setupWorker();

beforeAll(async () => {
  await mswBrowserWorker.start({ onUnhandledRequest: 'error', quiet: true });
});

afterEach(() => {
  mswBrowserWorker.resetHandlers();
});

afterAll(() => {
  mswBrowserWorker.stop();
});
