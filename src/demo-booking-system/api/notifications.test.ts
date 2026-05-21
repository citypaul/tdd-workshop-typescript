import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { makeHttpNotificationsClient } from './clients/notifications';
import { makeApp, makeRoom, makeStore } from '@/test/factories';
import { captureJsonPost } from '@/test/msw';
import { mswServer } from '@/test/msw.setup';

const NOTIFICATIONS_URL = 'http://notifications.test';

describe('POST /api/bookings notifications', () => {
  it('notifies the downstream service with a JSON payload', async () => {
    const captured = captureJsonPost({
      server: mswServer,
      url: `${NOTIFICATIONS_URL}/notifications/bookings`,
    });

    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'boardroom' })],
        nextId: () => 'b1',
      }),
      notifications: makeHttpNotificationsClient({ baseUrl: NOTIFICATIONS_URL }),
    });

    await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      }),
    });

    expect(await captured).toEqual({
      contentType: 'application/json',
      body: {
        booking: {
          id: 'b1',
          roomId: 'boardroom',
          start: '2026-05-01T10:00:00.000Z',
          end: '2026-05-01T11:00:00.000Z',
          attendees: 4,
          purpose: '',
        },
      },
    });
  });

  it('still returns 201 when the notifications service is unreachable', async () => {
    mswServer.use(
      http.post(`${NOTIFICATIONS_URL}/notifications/bookings`, () => HttpResponse.error()),
    );

    const app = makeApp({
      store: makeStore({ rooms: [makeRoom({ id: 'boardroom' })] }),
      notifications: makeHttpNotificationsClient({ baseUrl: NOTIFICATIONS_URL }),
    });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      }),
    });

    expect(response.status).toBe(201);
  });
});
