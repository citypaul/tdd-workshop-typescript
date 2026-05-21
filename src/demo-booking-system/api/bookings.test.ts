import { describe, it, expect } from 'vitest';
import { makeApp, makeBooking, makeRoom, makeStore } from '@/test/factories';

describe('GET /api/bookings', () => {
  it('returns the bookings for the requested room', async () => {
    const boardroom = makeRoom({ id: 'boardroom' });
    const booking = makeBooking({
      id: 'b1',
      roomId: 'boardroom',
      start: new Date('2026-05-01T10:00:00Z'),
      end: new Date('2026-05-01T11:00:00Z'),
      attendees: 4,
    });
    const app = makeApp({
      store: makeStore({ rooms: [boardroom], bookings: [booking] }),
    });

    const response = await app.request('/api/bookings?roomId=boardroom');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'b1',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
        purpose: '',
      },
    ]);
  });

  it('returns bookings for a room with a single-character id', async () => {
    const room = makeRoom({ id: 'a', name: 'A' });
    const booking = makeBooking({
      id: 'b1',
      roomId: 'a',
      start: new Date('2026-05-01T10:00:00Z'),
      end: new Date('2026-05-01T11:00:00Z'),
      attendees: 1,
    });
    const app = makeApp({
      store: makeStore({ rooms: [room], bookings: [booking] }),
    });

    const response = await app.request('/api/bookings?roomId=a');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'b1',
        roomId: 'a',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 1,
        purpose: '',
      },
    ]);
  });

  it('only returns bookings for the requested room', async () => {
    const inBoardroom = makeBooking({ id: 'b1', roomId: 'boardroom' });
    const inWarRoom = makeBooking({ id: 'b2', roomId: 'war-room' });
    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'boardroom' })],
        bookings: [inBoardroom, inWarRoom],
      }),
    });

    const response = await app.request('/api/bookings?roomId=boardroom');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ id: 'b1', roomId: 'boardroom' }),
    ]);
  });

  it('returns [] when the requested room has no bookings', async () => {
    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'boardroom' })],
        bookings: [],
      }),
    });

    const response = await app.request('/api/bookings?roomId=boardroom');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it('returns 400 when the roomId query param is missing', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when the roomId query param is empty', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings?roomId=');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when the query has unknown keys', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings?roomId=boardroom&tenant=acme');

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });
});

describe('POST /api/bookings', () => {
  it('creates a booking and returns it with a generated id', async () => {
    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'boardroom' })],
        nextId: () => 'b1',
      }),
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
    expect(await response.json()).toEqual({
      id: 'b1',
      roomId: 'boardroom',
      start: '2026-05-01T10:00:00.000Z',
      end: '2026-05-01T11:00:00.000Z',
      attendees: 4,
      purpose: '',
    });
  });

  it('creates a booking for a room with a single-character id', async () => {
    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'a', name: 'A', capacity: 4 })],
        nextId: () => 'b1',
      }),
    });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'a',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 1,
      }),
    });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: 'b1',
      roomId: 'a',
      start: '2026-05-01T10:00:00.000Z',
      end: '2026-05-01T11:00:00.000Z',
      attendees: 1,
      purpose: '',
    });
  });

  it('persists a created booking so a subsequent GET returns it', async () => {
    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'boardroom' })],
        nextId: () => 'b1',
      }),
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

    const response = await app.request('/api/bookings?roomId=boardroom');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'b1',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
        purpose: '',
      },
    ]);
  });

  it('persists the booking purpose so it can be shown on the timeline', async () => {
    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'boardroom' })],
        nextId: () => 'b1',
      }),
    });

    const createResponse = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
        purpose: 'Quarterly planning',
      }),
    });

    expect(createResponse.status).toBe(201);
    expect(await createResponse.json()).toEqual({
      id: 'b1',
      roomId: 'boardroom',
      start: '2026-05-01T10:00:00.000Z',
      end: '2026-05-01T11:00:00.000Z',
      attendees: 4,
      purpose: 'Quarterly planning',
    });

    const getResponse = await app.request('/api/bookings?roomId=boardroom');

    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual([
      {
        id: 'b1',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
        purpose: 'Quarterly planning',
      },
    ]);
  });

  it('returns 400 when required fields are missing from the body', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: 'boardroom' }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it.each([
    {
      name: 'roomId is missing',
      body: {
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'start is missing',
      body: {
        roomId: 'boardroom',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'end is missing',
      body: {
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'attendees is missing',
      body: {
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
      },
    },
  ])('returns 400 when $name', async ({ body }) => {
    const app = makeApp();

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it.each([
    {
      name: 'roomId is not a string',
      body: {
        roomId: 123,
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'start is not an ISO datetime',
      body: {
        roomId: 'boardroom',
        start: 'yesterday',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'end is not an ISO datetime',
      body: {
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: 'tomorrow',
        attendees: 4,
      },
    },
    {
      name: 'attendees is not a number',
      body: {
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 'four',
      },
    },
  ])('returns 400 when $name', async ({ body }) => {
    const app = makeApp();

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when roomId is empty even if the store contains an empty-id room', async () => {
    const app = makeApp({ store: makeStore({ rooms: [makeRoom({ id: '' })] }) });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: '',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 1,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when attendees is zero', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 0,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when attendees is fractional', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 1.5,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when the body contains unknown fields', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
        tenant: 'acme',
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 400 when the roomId does not match any seeded room', async () => {
    const app = makeApp({ store: makeStore({ rooms: [makeRoom({ id: 'boardroom' })] }) });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'unknown-room',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request' });
  });

  it('returns 500 via the unified error handler when the body is not valid JSON', async () => {
    const app = makeApp();

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });

  it('rejects a booking in the past with the no-past rule', async () => {
    const app = makeApp({
      store: makeStore({ rooms: [makeRoom({ id: 'boardroom' })] }),
      now: () => new Date('2026-05-01T12:00:00.000Z'),
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
  });

  it('rejects a booking that overlaps an existing one with the no-overlap rule', async () => {
    const existing = makeBooking({
      id: 'b-existing',
      roomId: 'boardroom',
      start: new Date('2026-05-01T10:00:00.000Z'),
      end: new Date('2026-05-01T11:00:00.000Z'),
    });
    const app = makeApp({
      store: makeStore({
        rooms: [makeRoom({ id: 'boardroom' })],
        bookings: [existing],
      }),
    });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:30:00.000Z',
        end: '2026-05-01T11:30:00.000Z',
        attendees: 4,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Conflicts with an existing booking',
      rule: 'no-overlap',
    });
  });

  it('rejects a zero-duration booking with the positive-duration rule', async () => {
    const app = makeApp({ store: makeStore({ rooms: [makeRoom({ id: 'boardroom' })] }) });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T10:00:00.000Z',
        attendees: 4,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Booking must have a positive duration',
      rule: 'positive-duration',
    });
  });

  it('rejects a booking that exceeds room capacity with the capacity rule', async () => {
    const app = makeApp({
      store: makeStore({ rooms: [makeRoom({ id: 'boardroom', capacity: 4 })] }),
    });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 5,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Exceeds room capacity of 4',
      rule: 'capacity',
    });
  });

  it('rejects a booking longer than eight hours with the max-duration rule', async () => {
    const app = makeApp({ store: makeStore({ rooms: [makeRoom({ id: 'boardroom' })] }) });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T09:00:00.000Z',
        end: '2026-05-01T17:30:00.000Z',
        attendees: 4,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Bookings cannot exceed 8 hours',
      rule: 'max-duration',
    });
  });

  it('rejects a booking outside business hours with the business-hours rule', async () => {
    const app = makeApp({
      store: makeStore({ rooms: [makeRoom({ id: 'boardroom' })] }),
      now: () => new Date('2026-05-01T06:00:00.000Z'),
    });

    const response = await app.request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'boardroom',
        start: '2026-05-01T07:00:00.000Z',
        end: '2026-05-01T08:00:00.000Z',
        attendees: 4,
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Bookings must be within business hours (8am–6pm)',
      rule: 'business-hours',
    });
  });
});
