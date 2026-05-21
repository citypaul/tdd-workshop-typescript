import type { Booking, BookingRequest, BookingResult, Room } from './types';
import { exceedsCapacity } from './rules/exceeds-capacity';
import { exceedsMaxDuration } from './rules/exceeds-max-duration';
import { hasNonPositiveAttendees } from './rules/has-non-positive-attendees';
import { hasNonPositiveDuration } from './rules/has-non-positive-duration';
import { isInPast } from './rules/is-in-past';
import { isOutsideBusinessHours } from './rules/is-outside-business-hours';
import { overlapsExistingBooking } from './rules/overlaps-existing-booking';

export type ValidateBookingInput = {
  readonly request: BookingRequest;
  readonly room: Room;
  readonly existing: readonly Booking[];
  readonly now: Date;
};

export const validateBooking = (input: ValidateBookingInput): BookingResult => {
  const { request, room, existing, now } = input;

  if (isInPast({ start: request.start, now })) {
    return {
      success: false,
      error: 'Cannot book in the past',
      rule: 'no-past',
    };
  }

  if (hasNonPositiveDuration({ start: request.start, end: request.end })) {
    return {
      success: false,
      error: 'Booking must have a positive duration',
      rule: 'positive-duration',
    };
  }

  if (hasNonPositiveAttendees({ attendees: request.attendees })) {
    return {
      success: false,
      error: 'At least one attendee is required',
      rule: 'positive-attendees',
    };
  }

  if (overlapsExistingBooking({ request, existing })) {
    return {
      success: false,
      error: 'Conflicts with an existing booking',
      rule: 'no-overlap',
    };
  }

  if (exceedsCapacity({ request, room })) {
    return {
      success: false,
      error: `Exceeds room capacity of ${String(room.capacity)}`,
      rule: 'capacity',
    };
  }

  if (exceedsMaxDuration({ start: request.start, end: request.end })) {
    return {
      success: false,
      error: 'Bookings cannot exceed 8 hours',
      rule: 'max-duration',
    };
  }

  if (isOutsideBusinessHours({ start: request.start, end: request.end })) {
    return {
      success: false,
      error: 'Bookings must be within business hours (8am–6pm)',
      rule: 'business-hours',
    };
  }

  return { success: true };
};
