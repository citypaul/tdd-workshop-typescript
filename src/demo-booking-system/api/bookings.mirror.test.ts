import { describe, expect, it, vi } from 'vitest';
import type { NotificationsClient } from './clients/notifications';
import { createApp } from './app';
import { validateBooking } from '../domain/validate-booking';
import { makeRoom, makeStore } from '@/test/factories';

vi.mock('../domain/validate-booking', () => ({
  validateBooking: vi.fn(),
}));

const silentNotifications: NotificationsClient = {
  bookingCreated: () => Promise.resolve(),
};

describe('POST /api/bookings mirror tests (intentionally bad examples)', () => {
  it('mirrors validation failure mapping by stubbing validateBooking', async () => {
    const now = new Date('2026-05-01T12:00:00.000Z');
    const store = makeStore({
      rooms: [makeRoom({ id: 'boardroom' })],
      nextId: () => 'booking-from-mirror-test',
    });
    vi.mocked(validateBooking).mockReturnValueOnce({
      success: false,
      error: 'Cannot book in the past',
      rule: 'no-past',
    });
    const app = createApp({
      store,
      now: () => now,
      notifications: silentNotifications,
    });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-04-30T10:00:00.000Z',
        end: '2026-04-30T11:00:00.000Z',
        attendees: 4,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Cannot book in the past',
      rule: 'no-past',
    });
    expect(vi.mocked(validateBooking)).toHaveBeenCalledWith({
      request: {
        roomId: 'boardroom',
        start: new Date('2026-04-30T10:00:00.000Z'),
        end: new Date('2026-04-30T11:00:00.000Z'),
        attendees: 4,
        purpose: '',
      },
      room: makeRoom({ id: 'boardroom' }),
      existing: [],
      now,
    });
  });
});
