import { describe, it, expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { App } from './App';
import { makeApiClient } from './api-client';
import { mswBrowserWorker } from '@/test/msw.browser.setup';
import { renderWithProviders } from '@/test/render';

const API_URL = 'http://api.test';
// Shared across tests because the api-client is stateless — it only holds
// the baseUrl. Per-test MSW handlers control what each call resolves to.
const apiClient = makeApiClient({ baseUrl: API_URL });
const now = () => new Date('2026-05-01T09:00:00Z');

const bookingPostSchema = z
  .object({
    roomId: z.string().min(1),
    start: z.iso.datetime(),
    end: z.iso.datetime(),
    attendees: z.number().int().positive(),
    purpose: z.literal('Quarterly planning'),
  })
  .strict();

describe('App — integration', () => {
  it('shows "No rooms available" when the API responds with no rooms', async () => {
    mswBrowserWorker.use(http.get(`${API_URL}/api/rooms`, () => HttpResponse.json([])));

    const screen = await renderWithProviders(<App apiClient={apiClient} now={now} />);

    await expect.element(screen.getByText('No rooms available')).toBeInTheDocument();
  });

  it('lets a user book an available room and shows the new booking on the timeline', async () => {
    // Initial state: one room, no bookings.
    mswBrowserWorker.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
      ),
      http.get(`${API_URL}/api/bookings`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('roomId') !== 'boardroom') {
          return new HttpResponse(null, { status: 400 });
        }
        return HttpResponse.json([]);
      }),
    );

    const screen = await renderWithProviders(<App apiClient={apiClient} now={now} />);

    await expect.element(screen.getByText('Timeline / The Boardroom')).toBeInTheDocument();
    await expect.element(screen.getByLabelText('Attendees')).toBeInTheDocument();

    // Accept the POST, then make future GET /bookings return the created one.
    mswBrowserWorker.use(
      http.post(`${API_URL}/api/bookings`, async ({ request }) => {
        const parsed = bookingPostSchema.safeParse(await request.json());
        if (!parsed.success) {
          return HttpResponse.json(
            { error: 'Unexpected booking request', rule: 'capacity' },
            { status: 400 },
          );
        }

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

    await userEvent.fill(screen.getByLabelText('Purpose'), 'Quarterly planning');
    await userEvent.click(screen.getByRole('button', { name: 'Execute Booking' }));

    await expect.element(screen.getByText('Quarterly planning')).toBeInTheDocument();
    await expect.element(screen.getByText('10:00 – 11:00')).toBeInTheDocument();
    await expect.element(screen.getByText('0/7 Pass')).toBeInTheDocument();
    expect(screen.container.querySelector('[role="alert"]')).toBeNull();
  });

  it('uses the generated booking title when a booking has a blank purpose', async () => {
    mswBrowserWorker.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
      ),
      http.get(`${API_URL}/api/bookings`, () =>
        HttpResponse.json([
          {
            id: 'b1',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:00:00.000Z',
            attendees: 4,
            purpose: '',
          },
        ]),
      ),
    );

    const screen = await renderWithProviders(<App apiClient={apiClient} now={now} />);

    await expect.element(screen.getByText('Booking b1')).toBeInTheDocument();
  });

  it('uses the generated booking title when a booking has a whitespace-only purpose', async () => {
    mswBrowserWorker.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
      ),
      http.get(`${API_URL}/api/bookings`, () =>
        HttpResponse.json([
          {
            id: 'b1',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:00:00.000Z',
            attendees: 4,
            purpose: '   ',
          },
        ]),
      ),
    );

    const screen = await renderWithProviders(<App apiClient={apiClient} now={now} />);

    await expect.element(screen.getByText('Booking b1')).toBeInTheDocument();
  });

  it('shows the conflict overlay, the rule matrix fail, and the rule violation banner when the API rejects on no-overlap', async () => {
    mswBrowserWorker.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
      ),
      http.get(`${API_URL}/api/bookings`, () =>
        HttpResponse.json([
          {
            id: 'existing',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:30:00.000Z',
            attendees: 8,
          },
        ]),
      ),
      http.post(`${API_URL}/api/bookings`, () =>
        HttpResponse.json(
          { error: 'Conflicts with an existing booking', rule: 'no-overlap' },
          { status: 400 },
        ),
      ),
    );

    const screen = await renderWithProviders(<App apiClient={apiClient} now={now} />);

    await expect.element(screen.getByText('Timeline / The Boardroom')).toBeInTheDocument();

    // Form defaults submit a 10:00–11:00 booking which overlaps the existing
    // 10:00–11:30 booking; the API says so.
    await userEvent.click(screen.getByRole('button', { name: 'Execute Booking' }));

    // The banner carrying the domain's error message is visible.
    await expect
      .element(screen.getByText('Conflicts with an existing booking'))
      .toBeInTheDocument();

    // The Rule Matrix flips the no-overlap row and updates the header chip.
    await expect
      .element(screen.getByText('No overlapping bookings'))
      .toHaveAttribute('data-state', 'fail');
    await expect.element(screen.getByText('1/7 Fail')).toBeInTheDocument();

    // The timeline shows a ConflictOverlay announcing the conflict.
    await expect.element(screen.getByText(/conflict detected/i)).toBeInTheDocument();
  });

  it('clears the banner, overlay, and fail matrix when the user corrects the form and resubmits successfully', async () => {
    // Initial state: boardroom holds a 10:00–11:30 booking that conflicts with the form's default slot.
    mswBrowserWorker.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
      ),
      http.get(`${API_URL}/api/bookings`, () =>
        HttpResponse.json([
          {
            id: 'existing',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:30:00.000Z',
            attendees: 8,
          },
        ]),
      ),
      http.post(`${API_URL}/api/bookings`, () =>
        HttpResponse.json(
          { error: 'Conflicts with an existing booking', rule: 'no-overlap' },
          { status: 400 },
        ),
      ),
    );

    const screen = await renderWithProviders(<App apiClient={apiClient} now={now} />);

    await userEvent.click(screen.getByRole('button', { name: 'Execute Booking' }));

    // All three failure signals visible: banner, overlay, fail matrix.
    await expect
      .element(screen.getByText('Conflicts with an existing booking'))
      .toBeInTheDocument();
    await expect.element(screen.getByText(/conflict detected/i)).toBeInTheDocument();
    await expect.element(screen.getByText('1/7 Fail')).toBeInTheDocument();

    // The user adjusts the times to a non-conflicting slot; the API now accepts and GET /bookings returns the new booking alongside the existing one.
    mswBrowserWorker.use(
      http.post(`${API_URL}/api/bookings`, async ({ request }) => {
        const body = (await request.json()) as { readonly roomId: string };
        return HttpResponse.json(
          {
            id: 'b-new',
            roomId: body.roomId,
            start: '2026-05-01T13:00:00.000Z',
            end: '2026-05-01T14:00:00.000Z',
            attendees: 4,
          },
          { status: 201 },
        );
      }),
      http.get(`${API_URL}/api/bookings`, () =>
        HttpResponse.json([
          {
            id: 'existing',
            roomId: 'boardroom',
            start: '2026-05-01T10:00:00.000Z',
            end: '2026-05-01T11:30:00.000Z',
            attendees: 8,
          },
          {
            id: 'b-new',
            roomId: 'boardroom',
            start: '2026-05-01T13:00:00.000Z',
            end: '2026-05-01T14:00:00.000Z',
            attendees: 4,
          },
        ]),
      ),
    );

    await userEvent.fill(screen.getByLabelText('Start time'), '13:00');
    await userEvent.fill(screen.getByLabelText('End time'), '14:00');
    await userEvent.click(screen.getByRole('button', { name: 'Execute Booking' }));

    // New booking renders and the rule matrix returns to the all-pass state.
    await expect.element(screen.getByText('Booking b-new')).toBeInTheDocument();
    await expect.element(screen.getByText('0/7 Pass')).toBeInTheDocument();

    // Banner and overlay are gone.
    expect(screen.container.querySelector('[role="alert"]')).toBeNull();
    expect(screen.container.textContent).not.toContain('CONFLICT DETECTED');
  });

  it('switches the timeline to the selected room when the user picks a different one', async () => {
    mswBrowserWorker.use(
      http.get(`${API_URL}/api/rooms`, () =>
        HttpResponse.json([
          { id: 'boardroom', name: 'The Boardroom', capacity: 12 },
          { id: 'war-room', name: 'The War Room', capacity: 8 },
        ]),
      ),
      http.get(`${API_URL}/api/bookings`, ({ request }) => {
        const url = new URL(request.url);
        const roomId = url.searchParams.get('roomId');
        if (roomId === 'boardroom') {
          return HttpResponse.json([
            {
              id: 'b-board',
              roomId: 'boardroom',
              start: '2026-05-01T10:00:00.000Z',
              end: '2026-05-01T11:00:00.000Z',
              attendees: 4,
            },
          ]);
        }
        if (roomId === 'war-room') {
          return HttpResponse.json([
            {
              id: 'b-war',
              roomId: 'war-room',
              start: '2026-05-01T13:00:00.000Z',
              end: '2026-05-01T14:00:00.000Z',
              attendees: 2,
            },
          ]);
        }
        return new HttpResponse(null, { status: 400 });
      }),
    );

    const screen = await renderWithProviders(<App apiClient={apiClient} now={now} />);

    // Initially on the boardroom; its booking is visible.
    await expect.element(screen.getByText('Timeline / The Boardroom')).toBeInTheDocument();
    await expect.element(screen.getByText('Booking b-board')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Room'), 'war-room');

    // Timeline header and bookings update to the war room.
    await expect.element(screen.getByText('Timeline / The War Room')).toBeInTheDocument();
    await expect.element(screen.getByText('Booking b-war')).toBeInTheDocument();
  });
});
