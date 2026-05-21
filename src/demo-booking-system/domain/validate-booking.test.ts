import { describe, it, expect } from 'vitest';
import { validateBooking } from './validate-booking';
import { makeBooking, makeBookingRequest, makeRoom } from '@/test/factories';

describe('validateBooking', () => {
  it('rejects bookings that start before now', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-04-30T14:00:00Z'),
        end: new Date('2026-04-30T15:00:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T10:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Cannot book in the past',
      rule: 'no-past',
    });
  });

  it('accepts a booking that starts exactly at the current time', () => {
    const rightNow = new Date('2026-05-01T10:00:00Z');

    const result = validateBooking({
      request: makeBookingRequest({
        start: rightNow,
        end: new Date('2026-05-01T11:00:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: rightNow,
    });

    expect(result).toEqual({ success: true });
  });

  it('rejects bookings with zero duration', () => {
    const rightNow = new Date('2026-05-01T10:00:00Z');

    const result = validateBooking({
      request: makeBookingRequest({
        start: rightNow,
        end: rightNow,
      }),
      room: makeRoom(),
      existing: [],
      now: rightNow,
    });

    expect(result).toEqual({
      success: false,
      error: 'Booking must have a positive duration',
      rule: 'positive-duration',
    });
  });

  it('rejects bookings with negative duration', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T11:00:00Z'),
        end: new Date('2026-05-01T10:30:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T10:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Booking must have a positive duration',
      rule: 'positive-duration',
    });
  });

  it('rejects a booking that overlaps an existing booking in the same room', () => {
    const existing = makeBooking({
      id: 'quarterly-planning',
      roomId: 'boardroom',
      start: new Date('2026-05-01T10:00:00Z'),
      end: new Date('2026-05-01T11:00:00Z'),
    });

    const result = validateBooking({
      request: makeBookingRequest({
        roomId: 'boardroom',
        start: new Date('2026-05-01T10:30:00Z'),
        end: new Date('2026-05-01T11:30:00Z'),
      }),
      room: makeRoom({ id: 'boardroom' }),
      existing: [existing],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Conflicts with an existing booking',
      rule: 'no-overlap',
    });
  });

  it('allows back-to-back bookings where one ends exactly as another begins', () => {
    const existing = makeBooking({
      id: 'quarterly-planning',
      roomId: 'boardroom',
      start: new Date('2026-05-01T10:00:00Z'),
      end: new Date('2026-05-01T11:00:00Z'),
    });

    const result = validateBooking({
      request: makeBookingRequest({
        roomId: 'boardroom',
        start: new Date('2026-05-01T11:00:00Z'),
        end: new Date('2026-05-01T12:00:00Z'),
      }),
      room: makeRoom({ id: 'boardroom' }),
      existing: [existing],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({ success: true });
  });

  it('allows a booking that ends exactly as an existing booking begins', () => {
    const existing = makeBooking({
      id: 'architecture-review',
      roomId: 'boardroom',
      start: new Date('2026-05-01T11:00:00Z'),
      end: new Date('2026-05-01T12:00:00Z'),
    });

    const result = validateBooking({
      request: makeBookingRequest({
        roomId: 'boardroom',
        start: new Date('2026-05-01T10:00:00Z'),
        end: new Date('2026-05-01T11:00:00Z'),
      }),
      room: makeRoom({ id: 'boardroom' }),
      existing: [existing],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({ success: true });
  });

  it('allows overlapping bookings in different rooms', () => {
    const existing = makeBooking({
      id: 'war-room-standup',
      roomId: 'war-room',
      start: new Date('2026-05-01T10:00:00Z'),
      end: new Date('2026-05-01T11:00:00Z'),
    });

    const result = validateBooking({
      request: makeBookingRequest({
        roomId: 'boardroom',
        start: new Date('2026-05-01T10:30:00Z'),
        end: new Date('2026-05-01T11:30:00Z'),
      }),
      room: makeRoom({ id: 'boardroom' }),
      existing: [existing],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({ success: true });
  });

  it('rejects bookings where attendees exceed the room capacity', () => {
    const result = validateBooking({
      request: makeBookingRequest({ attendees: 13 }),
      room: makeRoom({ capacity: 12 }),
      existing: [],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Exceeds room capacity of 12',
      rule: 'capacity',
    });
  });

  it('accepts a booking with attendees equal to room capacity', () => {
    const result = validateBooking({
      request: makeBookingRequest({ attendees: 12 }),
      room: makeRoom({ capacity: 12 }),
      existing: [],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({ success: true });
  });

  it('rejects bookings with zero attendees', () => {
    const result = validateBooking({
      request: makeBookingRequest({ attendees: 0 }),
      room: makeRoom({ capacity: 12 }),
      existing: [],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'At least one attendee is required',
      rule: 'positive-attendees',
    });
  });

  it('rejects bookings with negative attendees', () => {
    const result = validateBooking({
      request: makeBookingRequest({ attendees: -1 }),
      room: makeRoom({ capacity: 12 }),
      existing: [],
      now: new Date('2026-05-01T09:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'At least one attendee is required',
      rule: 'positive-attendees',
    });
  });

  it('rejects bookings longer than eight hours', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T09:00:00Z'),
        end: new Date('2026-05-01T18:00:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T08:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Bookings cannot exceed 8 hours',
      rule: 'max-duration',
    });
  });

  it('accepts a booking of exactly eight hours', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T09:00:00Z'),
        end: new Date('2026-05-01T17:00:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T08:00:00Z'),
    });

    expect(result).toEqual({ success: true });
  });

  it('rejects bookings that start before 08:00', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T07:00:00Z'),
        end: new Date('2026-05-01T08:30:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T06:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Bookings must be within business hours (8am–6pm)',
      rule: 'business-hours',
    });
  });

  it('rejects bookings that end after 18:00', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T17:00:00Z'),
        end: new Date('2026-05-01T18:30:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T08:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Bookings must be within business hours (8am–6pm)',
      rule: 'business-hours',
    });
  });

  it('rejects a booking that starts at close of business', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T18:00:00Z'),
        end: new Date('2026-05-01T18:30:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T08:00:00Z'),
    });

    expect(result).toEqual({
      success: false,
      error: 'Bookings must be within business hours (8am–6pm)',
      rule: 'business-hours',
    });
  });

  it('accepts a booking that starts exactly at opening time', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T08:00:00Z'),
        end: new Date('2026-05-01T09:00:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T07:00:00Z'),
    });

    expect(result).toEqual({ success: true });
  });

  it('accepts a booking that ends exactly at closing time', () => {
    const result = validateBooking({
      request: makeBookingRequest({
        start: new Date('2026-05-01T17:00:00Z'),
        end: new Date('2026-05-01T18:00:00Z'),
      }),
      room: makeRoom(),
      existing: [],
      now: new Date('2026-05-01T08:00:00Z'),
    });

    expect(result).toEqual({ success: true });
  });
});
