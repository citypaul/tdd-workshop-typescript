import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures';

test('a user attempting an overlapping booking sees the conflict signal everywhere', async ({
  page,
  worker,
}) => {
  await worker.use(
    http.get('/api/rooms', () =>
      HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
    ),
    http.get('/api/bookings', () =>
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
    http.post('/api/bookings', () =>
      HttpResponse.json(
        { error: 'Conflicts with an existing booking', rule: 'no-overlap' },
        { status: 400 },
      ),
    ),
  );

  await page.goto('/');

  // The form's defaults (10:00–11:00) overlap the existing 10:00–11:30 booking.
  await page.getByRole('button', { name: 'Execute Booking' }).click();

  await expect(page.getByText('Conflicts with an existing booking')).toBeVisible();
  await expect(page.getByText(/conflict detected/i)).toBeVisible();
  await expect(page.getByText('1/7 Fail')).toBeVisible();
});
