import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures';

test("a user changes the selected room and sees that room's bookings", async ({ page, worker }) => {
  const bookingsByRoom: Record<string, readonly unknown[]> = {
    boardroom: [
      {
        id: 'b-board',
        roomId: 'boardroom',
        start: '2026-05-01T10:00:00.000Z',
        end: '2026-05-01T11:00:00.000Z',
        attendees: 4,
      },
    ],
    'war-room': [
      {
        id: 'b-war',
        roomId: 'war-room',
        start: '2026-05-01T13:00:00.000Z',
        end: '2026-05-01T14:00:00.000Z',
        attendees: 2,
      },
    ],
  };

  await worker.use(
    http.get('/api/rooms', () =>
      HttpResponse.json([
        { id: 'boardroom', name: 'The Boardroom', capacity: 12 },
        { id: 'war-room', name: 'The War Room', capacity: 8 },
      ]),
    ),
    http.get('/api/bookings', ({ request }) => {
      const roomId = new URL(request.url).searchParams.get('roomId') ?? '';
      return HttpResponse.json(bookingsByRoom[roomId] ?? []);
    }),
  );

  await page.goto('/');

  await expect(page.getByText('Timeline / The Boardroom')).toBeVisible();
  await expect(page.getByText('Booking b-board')).toBeVisible();

  await page.getByLabel('Room').selectOption('war-room');

  await expect(page.getByText('Timeline / The War Room')).toBeVisible();
  await expect(page.getByText('Booking b-war')).toBeVisible();
  await expect(page.getByText('Booking b-board')).toHaveCount(0);
});
