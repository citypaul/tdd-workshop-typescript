import type { Hono } from 'hono';
import { createApp } from '@/api/app';
import type { NotificationsClient } from '@/api/clients/notifications';
import { makeInMemoryStore, type Store } from '@/api/store';
import type { Booking, BookingRequest, Room } from '@/domain/types';

export const makeRoom = (overrides?: Partial<Room>): Room => ({
  id: 'boardroom',
  name: 'The Boardroom',
  capacity: 12,
  ...overrides,
});

export const makeBookingRequest = (overrides?: Partial<BookingRequest>): BookingRequest => ({
  roomId: 'boardroom',
  start: new Date('2026-05-01T10:00:00Z'),
  end: new Date('2026-05-01T11:00:00Z'),
  attendees: 4,
  purpose: '',
  ...overrides,
});

export const makeBooking = (overrides?: Partial<Booking>): Booking => ({
  ...makeBookingRequest(overrides),
  id: 'booking-1',
  ...overrides,
});

export type MakeStoreInput = {
  readonly rooms?: readonly Room[];
  readonly bookings?: readonly Booking[];
  readonly nextId?: () => string;
};

export const makeStore = ({ rooms, bookings, nextId }: MakeStoreInput = {}): Store =>
  makeInMemoryStore({
    rooms: rooms ?? [makeRoom()],
    bookings: bookings ?? [],
    nextId: nextId ?? (() => crypto.randomUUID()),
  });

export type MakeAppInput = {
  readonly store?: Store;
  readonly now?: () => Date;
  readonly notifications?: NotificationsClient;
};

/**
 * A **fake** NotificationsClient that does nothing. Used by default in
 * tests that don't care about the downstream integration — e.g. all the
 * validation and rule pass-through tests for POST /api/bookings. They
 * still exercise the full handler path (including the `await
 * notifications.bookingCreated(...)` call inside the try/catch), but
 * the call is a no-op, so no MSW setup is needed.
 *
 * Tests that DO care about the downstream integration (see
 * `src/demo-booking-system/api/notifications.test.ts`) pass a real
 * `makeHttpNotificationsClient({ baseUrl })` and intercept the outbound
 * fetch with MSW — that's where the contract with the downstream is
 * asserted. Keeping the fake here silent, rather than a spy, means it
 * can't be used to "prove" the handler called it — which matches our
 * rule that contract assertions live at the network boundary, not on
 * in-process spies.
 */
const silentNotifications: NotificationsClient = {
  bookingCreated: () => Promise.resolve(),
};

export const makeApp = ({ store, now, notifications }: MakeAppInput = {}): Hono =>
  createApp({
    store: store ?? makeStore(),
    now: now ?? (() => new Date('2026-05-01T09:00:00.000Z')),
    notifications: notifications ?? silentNotifications,
  });
