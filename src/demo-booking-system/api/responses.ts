import type { Context, Hono } from 'hono';

export const attachErrorHandler = (app: Hono): void => {
  app.onError((_err, c) => c.json({ error: 'Internal server error' }, 500));
};

export const invalidRequest = (c: Context) => c.json({ error: 'Invalid request' }, 400);
