import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { attachErrorHandler } from './responses';

describe('attachErrorHandler', () => {
  it('returns 500 with a generic body when a handler throws', async () => {
    const app = new Hono();
    app.get('/boom', () => {
      throw new Error('sensitive internal details nobody should see');
    });
    attachErrorHandler(app);

    const response = await app.request('/boom');

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
});
