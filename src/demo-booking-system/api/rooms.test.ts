import { describe, it, expect } from 'vitest';
import { makeApp, makeBooking, makeRoom, makeStore } from '@/test/factories';
import type { Store } from './store';

describe('GET /rooms', () => {
  it('returns the seeded rooms with id, name, and capacity', async () => {
    const boardroom = makeRoom({ id: 'boardroom', name: 'The Boardroom', capacity: 12 });
    const app = makeApp({ store: makeStore({ rooms: [boardroom] }) });

    const response = await app.request('/api/rooms');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { id: 'boardroom', name: 'The Boardroom', capacity: 12 },
    ]);
  });

  it('returns 500 with a generic body when the store throws', async () => {
    const exploding: Store = {
      listRooms: () => {
        throw new Error('store is down');
      },
      listBookingsForRoom: () => [],
      saveBooking: () => makeBooking(),
    };
    const app = makeApp({ store: exploding });

    const response = await app.request('/api/rooms');

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
});
