import { Hono } from 'hono';
import { z } from 'zod';
import type { BookingRequest } from '../domain/types';
import { validateBooking } from '../domain/validate-booking';
import type { NotificationsClient } from './clients/notifications';
import { attachErrorHandler, invalidRequest } from './responses';
import { registerRoomsRoutes } from './routes/rooms';
import type { Store } from './store';

export type CreateAppInput = {
  readonly store: Store;
  readonly now: () => Date;
  readonly notifications: NotificationsClient;
};

const listBookingsQuerySchema = z
  .object({
    roomId: z.string().min(1),
  })
  .strict();

const createBookingBodySchema = z
  .object({
    roomId: z.string().min(1),
    start: z.iso.datetime(),
    end: z.iso.datetime(),
    attendees: z.number().int().positive(),
    purpose: z.string().default(''),
  })
  .strict();

export const createApp = ({ store, now, notifications }: CreateAppInput): Hono => {
  const app = new Hono();
  attachErrorHandler(app);

  const api = new Hono();
  registerRoomsRoutes({ api, store });

  // The /bookings routes are intentionally left inline so the workshop can
  // extract them to `src/demo-booking-system/api/routes/bookings.ts` live, on stage, as the
  // refactoring demo — see plans/demo-booking-system.md §14.3. Every test
  // here hits `app.request()` and is therefore blind to where handlers
  // live, so the refactor stays green without touching a single test.
  api.get('/bookings', (c) => {
    const parsed = listBookingsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) return invalidRequest(c);

    return c.json(store.listBookingsForRoom({ roomId: parsed.data.roomId }));
  });

  api.post('/bookings', async (c) => {
    const parsed = createBookingBodySchema.safeParse(await c.req.json());
    if (!parsed.success) return invalidRequest(c);

    const room = store.listRooms().find((r) => r.id === parsed.data.roomId);
    if (!room) return invalidRequest(c);

    const request: BookingRequest = {
      roomId: parsed.data.roomId,
      start: new Date(parsed.data.start),
      end: new Date(parsed.data.end),
      attendees: parsed.data.attendees,
      purpose: parsed.data.purpose,
    };

    const result = validateBooking({
      request,
      room,
      existing: store.listBookingsForRoom({ roomId: request.roomId }),
      now: now(),
    });
    if (!result.success) return c.json({ error: result.error, rule: result.rule }, 400);

    const booking = store.saveBooking({ request });

    try {
      await notifications.bookingCreated({ booking });
    } catch {
      // Log-and-continue. The booking is already persisted and the client
      // has had to wait long enough; we will not turn a downstream hiccup
      // into a 5xx for them.
      //
      // In a real application this catch block would:
      //   - emit a structured log at warn/error level with the booking id
      //     and the error, so operators see it in their log aggregator
      //   - bump a metric like `notifications.booking_created.failed`
      //     so the failure shows up on dashboards and can trigger alerts
      //   - enqueue a retry (durable queue / outbox pattern) so the
      //     notification is eventually delivered rather than lost
      //
      // We skip those here because this is a teaching artefact and the
      // observability layer is not in scope. Swallowing without any of
      // that in production would be a real bug — documenting this so
      // engineers reading the repo don't copy the pattern verbatim.
    }

    return c.json(booking, 201);
  });

  app.route('/api', api);

  return app;
};
