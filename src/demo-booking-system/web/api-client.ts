import { z } from 'zod';
import type { Booking, BookingRequest, Room, RuleId } from '../domain/types';

export class RuleViolationError extends Error {
  readonly error: string;
  readonly rule: RuleId;

  constructor(input: { readonly error: string; readonly rule: RuleId }) {
    super(input.error);
    this.error = input.error;
    this.rule = input.rule;
  }
}

export type ApiClient = {
  readonly getRooms: () => Promise<readonly Room[]>;
  readonly getBookings: (input: { readonly roomId: string }) => Promise<readonly Booking[]>;
  readonly createBooking: (input: { readonly request: BookingRequest }) => Promise<Booking>;
};

export type MakeApiClientInput = {
  readonly baseUrl: string;
};

const roomSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    capacity: z.number().int().positive(),
  })
  .strict();

const bookingSchema = z
  .object({
    id: z.string().min(1),
    roomId: z.string().min(1),
    start: z.iso.datetime(),
    end: z.iso.datetime(),
    attendees: z.number().int().positive(),
    purpose: z.string().default(''),
  })
  .strict();

const ruleIdSchema = z.enum([
  'no-past',
  'positive-duration',
  'positive-attendees',
  'no-overlap',
  'capacity',
  'max-duration',
  'business-hours',
]) satisfies z.ZodType<RuleId>;

const ruleViolationSchema = z
  .object({
    error: z.string().min(1),
    rule: ruleIdSchema,
  })
  .strict();

const hydrateBooking = (parsed: z.infer<typeof bookingSchema>): Booking => ({
  id: parsed.id,
  roomId: parsed.roomId,
  start: new Date(parsed.start),
  end: new Date(parsed.end),
  attendees: parsed.attendees,
  purpose: parsed.purpose,
});

const encodeRequest = (request: BookingRequest) => ({
  roomId: request.roomId,
  start: request.start.toISOString(),
  end: request.end.toISOString(),
  attendees: request.attendees,
  purpose: request.purpose,
});

export const makeApiClient = ({ baseUrl }: MakeApiClientInput): ApiClient => ({
  getRooms: async () => {
    const response = await fetch(`${baseUrl}/api/rooms`);
    return z.array(roomSchema).parse(await response.json());
  },
  getBookings: async ({ roomId }) => {
    const response = await fetch(`${baseUrl}/api/bookings?roomId=${encodeURIComponent(roomId)}`);
    const parsed = z.array(bookingSchema).parse(await response.json());
    return parsed.map(hydrateBooking);
  },
  createBooking: async ({ request }) => {
    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(encodeRequest(request)),
    });
    if (response.status === 400) {
      const body = ruleViolationSchema.parse(await response.json());
      throw new RuleViolationError({ error: body.error, rule: body.rule });
    }
    return hydrateBooking(bookingSchema.parse(await response.json()));
  },
});
