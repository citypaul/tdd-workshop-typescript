import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures';

test('a user corrects the form after a rejection and succeeds', async ({ page, worker }) => {
  const bookings: {
    readonly id: string;
    readonly roomId: string;
    readonly start: string;
    readonly end: string;
    readonly attendees: number;
  }[] = [
    {
      id: 'existing',
      roomId: 'boardroom',
      start: '2026-05-01T10:00:00.000Z',
      end: '2026-05-01T11:30:00.000Z',
      attendees: 8,
    },
  ];

  // Initial scenario: POST rejects with a no-overlap rule violation.
  await worker.use(
    http.get('/api/rooms', () =>
      HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
    ),
    http.get('/api/bookings', ({ request }) => {
      const roomId = new URL(request.url).searchParams.get('roomId');
      return HttpResponse.json(bookings.filter((b) => b.roomId === roomId));
    }),
    http.post('/api/bookings', () =>
      HttpResponse.json(
        { error: 'Conflicts with an existing booking', rule: 'no-overlap' },
        { status: 400 },
      ),
    ),
  );

  await page.goto('/');

  // First submit fails — form defaults (10:00–11:00) overlap the existing booking.
  await page.getByRole('button', { name: 'Execute Booking' }).click();
  await expect(page.getByText('Conflicts with an existing booking')).toBeVisible();
  await expect(page.getByText(/conflict detected/i)).toBeVisible();
  await expect(page.getByText('1/7 Fail')).toBeVisible();

  // Swap the POST handler to accept. GET handlers stay as they are; the in-closure
  // `bookings` array is the same one they read from, so the new booking lands there.
  await worker.use(
    http.post('/api/bookings', async ({ request }) => {
      const body = (await request.json()) as {
        readonly roomId: string;
        readonly start: string;
        readonly end: string;
        readonly attendees: number;
      };
      const created = { id: 'e2e-1', ...body };
      bookings.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
  );

  await page.getByLabel('Start time').fill('13:00');
  await page.getByLabel('End time').fill('14:00');
  await page.getByRole('button', { name: 'Execute Booking' }).click();

  await expect(page.getByText('Booking e2e-1')).toBeVisible();
  await expect(page.getByText('0/7 Pass')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText(/conflict detected/i)).toHaveCount(0);
});
