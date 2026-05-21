import { http, HttpResponse } from 'msw';
import { test, expect } from './fixtures';

test('a user books an available room and sees it on the timeline', async ({ page, worker }) => {
  const bookings: {
    readonly id: string;
    readonly roomId: string;
    readonly start: string;
    readonly end: string;
    readonly attendees: number;
    readonly purpose?: string;
  }[] = [];

  await worker.use(
    http.get('/api/rooms', () =>
      HttpResponse.json([{ id: 'boardroom', name: 'The Boardroom', capacity: 12 }]),
    ),
    http.get('/api/bookings', ({ request }) => {
      const roomId = new URL(request.url).searchParams.get('roomId');
      return HttpResponse.json(bookings.filter((b) => b.roomId === roomId));
    }),
    http.post('/api/bookings', async ({ request }) => {
      const body = (await request.json()) as {
        readonly roomId: string;
        readonly start: string;
        readonly end: string;
        readonly attendees: number;
        readonly purpose?: string;
      };
      const created = { id: 'e2e-1', ...body };
      bookings.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),
  );

  await page.goto('/');

  await expect(page.getByText('Timeline / The Boardroom')).toBeVisible();
  await expect(page.getByText('0/7 Pass')).toBeVisible();

  await page.getByLabel('Purpose').fill('Quarterly planning');
  await page.getByRole('button', { name: 'Execute Booking' }).click();

  await expect(page.getByText('Quarterly planning')).toBeVisible();
  await expect(page.getByText('0/7 Pass')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
