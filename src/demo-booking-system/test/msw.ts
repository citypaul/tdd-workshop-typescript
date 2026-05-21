import type { SetupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export type CapturedJsonRequest = {
  readonly contentType: string | null;
  readonly body: unknown;
};

export type CaptureJsonPostInput = {
  readonly server: SetupServer;
  readonly url: string;
};

/**
 * Observe a one-way POST via MSW's life-cycle events API. The life-cycle
 * events API is what MSW recommends when the application does not observably
 * react to the downstream's response — see
 * https://mswjs.io/docs/best-practices/avoid-request-assertions.
 *
 * For request-response flows where the app DOES react (e.g. a login form
 * reacting to 401), prefer baking the validation into the handler and
 * asserting on the user-visible outcome instead.
 *
 * This helper registers a default 2xx handler so MSW does not flag the
 * request as unhandled, then resolves a Promise with the first matching
 * request observed by the life-cycle events listener. Call
 * `server.events.removeAllListeners()` in `afterEach` so listeners do not
 * leak across tests.
 */
export const captureJsonPost = ({
  server,
  url,
}: CaptureJsonPostInput): Promise<CapturedJsonRequest> => {
  server.use(http.post(url, () => HttpResponse.json({ ok: true })));

  return new Promise((resolve) => {
    server.events.on('request:start', async ({ request }) => {
      if (request.method !== 'POST' || request.url !== url) return;

      const clone = request.clone();
      resolve({
        contentType: request.headers.get('content-type'),
        body: await clone.json(),
      });
    });
  });
};
