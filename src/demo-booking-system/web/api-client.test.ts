import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { mswServer } from '@/test/msw.setup';
import { makeApiClient, RuleViolationError } from './api-client';

const API_URL = 'http://api.test';

describe('apiClient.getRooms', () => {
  it('returns the rooms the API responds with', async () => {
    mswServer.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
      ),
    );
    const apiClient = makeApiClient({ baseUrl: API_URL });

    const rooms = await apiClient.getRooms();

    expect(rooms).toEqual([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]);
  });

  it.each([
    { name: 'empty id', room: { id: '', name: 'The Boardroom', capacity: 12 } },
    { name: 'empty name', room: { id: 'boardroom', name: '', capacity: 12 } },
    { name: 'zero capacity', room: { id: 'boardroom', name: 'The Boardroom', capacity: 0 } },
    {
      name: 'fractional capacity',
      room: { id: 'boardroom', name: 'The Boardroom', capacity: 1.5 },
    },
  ])('rejects a room response with $name', async ({ room }) => {
    mswServer.use(http.get(`${API_URL}/api/rooms`, () => HttpResponse.json([room])));
    const apiClient = makeApiClient({ baseUrl: API_URL });

    await expect(apiClient.getRooms()).rejects.toThrow();
  });
});

describe('apiClient.getBookings', () => {
  it('sends the roomId query param and rehydrates Date fields from the response', async () => {
    mswServer.use(
      http.get(`${API_URL}/api/bookings`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('roomId') !== 'boardroom') {
          return new HttpResponse(null, { status: 400 });
        }
        return HttpResponse.json([
          {
            id: 'b1',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:00:00.000Z',
            attendees: 4,
            purpose: 'Quarterly planning',
          },
        ]);
      }),
    );
    const apiClient = makeApiClient({ baseUrl: API_URL });

    const bookings = await apiClient.getBookings({ roomId: 'boardroom' });

    expect(bookings).toEqual([
      {
        id: 'b1',
        roomId: 'boardroom',
        start: new Date('2026-05-01T10:00:00.000Z'),
        end: new Date('2026-05-01T11:00:00.000Z'),
        attendees: 4,
        purpose: 'Quarterly planning',
      },
    ]);
  });

  it('normalises missing purpose in a booking response to a blank purpose', async () => {
    mswServer.use(
      http.get(`${API_URL}/api/bookings`, () =>
        HttpResponse.json([
          {
            id: 'b1',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:00:00.000Z',
            attendees: 4,
          },
        ]),
      ),
    );
    const apiClient = makeApiClient({ baseUrl: API_URL });

    const bookings = await apiClient.getBookings({ roomId: 'boardroom' });
    const booking = bookings[0];
    if (booking === undefined) throw new Error('Expected one booking');

    expect(booking.purpose).toBe('');
  });

  it.each([
    {
      name: 'empty id',
      booking: {
        id: '',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'empty roomId',
      booking: {
        id: 'b1',
        roomId: '',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'invalid start datetime',
      booking: {
        id: 'b1',
        roomId: 'boardroom',
        start: 'yesterday',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    },
    {
      name: 'invalid end datetime',
      booking: {
        id: 'b1',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: 'tomorrow',
        attendees: 4,
      },
    },
    {
      name: 'zero attendees',
      booking: {
        id: 'b1',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 0,
      },
    },
    {
      name: 'fractional attendees',
      booking: {
        id: 'b1',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 1.5,
      },
    },
  ])('rejects a booking response with $name', async ({ booking }) => {
    mswServer.use(http.get(`${API_URL}/api/bookings`, () => HttpResponse.json([booking])));
    const apiClient = makeApiClient({ baseUrl: API_URL });

    await expect(apiClient.getBookings({ roomId: 'boardroom' })).rejects.toThrow();
  });
});

describe('apiClient.createBooking', () => {
  const createBookingRequestSchema = z
    .object({
      roomId: z.literal('boardroom'),
      start: z.literal('2026-05-01T10:00:00.000Z'),
      end: z.literal('2026-05-01T11:00:00.000Z'),
      attendees: z.literal(4),
      purpose: z.literal('Quarterly planning'),
    })
    .strict();

  it('POSTs the request as JSON and returns the created booking with Date fields', async () => {
    mswServer.use(
      http.post(`${API_URL}/api/bookings`, async ({ request }) => {
        if (request.headers.get('content-type') !== 'application/json') {
          return new HttpResponse(null, { status: 400 });
        }
        const parsed = createBookingRequestSchema.safeParse(await request.json());
        if (!parsed.success) return new HttpResponse(null, { status: 400 });
        return HttpResponse.json(
          {
            id: 'b1',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:00:00.000Z',
            attendees: 4,
            purpose: 'Quarterly planning',
          },
          { status: 201 },
        );
      }),
    );
    const apiClient = makeApiClient({ baseUrl: API_URL });

    const booking = await apiClient.createBooking({
      request: {
        roomId: 'boardroom',
        start: new Date('2026-05-01T10:00:00.000Z'),
        end: new Date('2026-05-01T11:00:00.000Z'),
        attendees: 4,
        purpose: 'Quarterly planning',
      },
    });

    expect(booking).toEqual({
      id: 'b1',
      roomId: 'boardroom',
      start: new Date('2026-05-01T10:00:00.000Z'),
      end: new Date('2026-05-01T11:00:00.000Z'),
      attendees: 4,
      purpose: 'Quarterly planning',
    });
  });

  it('POSTs a blank purpose when the user leaves purpose empty', async () => {
    const createBookingRequestSchema = z
      .object({
        roomId: z.literal('boardroom'),
        start: z.literal('2026-05-01T10:00:00.000Z'),
        end: z.literal('2026-05-01T11:00:00.000Z'),
        attendees: z.literal(4),
        purpose: z.literal(''),
      })
      .strict();
    mswServer.use(
      http.post(`${API_URL}/api/bookings`, async ({ request }) => {
        const parsed = createBookingRequestSchema.safeParse(await request.json());
        if (!parsed.success) return new HttpResponse(null, { status: 400 });
        return HttpResponse.json(
          {
            id: 'b1',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:00:00.000Z',
            attendees: 4,
            purpose: '',
          },
          { status: 201 },
        );
      }),
    );
    const apiClient = makeApiClient({ baseUrl: API_URL });

    const booking = await apiClient.createBooking({
      request: {
        roomId: 'boardroom',
        start: new Date('2026-05-01T10:00:00.000Z'),
        end: new Date('2026-05-01T11:00:00.000Z'),
        attendees: 4,
        purpose: '',
      },
    });

    expect(booking.purpose).toBe('');
  });

  it('throws a RuleViolationError carrying the error and rule when the API returns 400 with a rule payload', async () => {
    mswServer.use(
      http.post(`${API_URL}/api/bookings`, () =>
        HttpResponse.json(
          { error: 'Conflicts with an existing booking', rule: 'no-overlap' },
          { status: 400 },
        ),
      ),
    );
    const apiClient = makeApiClient({ baseUrl: API_URL });

    await expect(
      apiClient.createBooking({
        request: {
          roomId: 'boardroom',
          start: new Date('2026-05-01T10:00:00.000Z'),
          end: new Date('2026-05-01T11:00:00.000Z'),
          attendees: 4,
          purpose: '',
        },
      }),
    ).rejects.toSatisfy(
      (err) =>
        err instanceof RuleViolationError &&
        err.error === 'Conflicts with an existing booking' &&
        err.rule === 'no-overlap',
    );
  });

  it('understands the positive-attendees rule returned by the API', async () => {
    mswServer.use(
      http.post(`${API_URL}/api/bookings`, () =>
        HttpResponse.json(
          { error: 'At least one attendee is required', rule: 'positive-attendees' },
          { status: 400 },
        ),
      ),
    );
    const apiClient = makeApiClient({ baseUrl: API_URL });

    await expect(
      apiClient.createBooking({
        request: {
          roomId: 'boardroom',
          start: new Date('2026-05-01T10:00:00.000Z'),
          end: new Date('2026-05-01T11:00:00.000Z'),
          attendees: 0,
          purpose: '',
        },
      }),
    ).rejects.toSatisfy(
      (err) =>
        err instanceof RuleViolationError &&
        err.error === 'At least one attendee is required' &&
        err.rule === 'positive-attendees',
    );
  });
});
