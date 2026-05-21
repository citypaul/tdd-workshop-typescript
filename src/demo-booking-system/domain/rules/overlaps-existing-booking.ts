import type { Booking, BookingRequest } from '../types';

export type OverlapsExistingBookingInput = {
  readonly request: BookingRequest;
  readonly existing: readonly Booking[];
};

export const overlapsExistingBooking = ({
  request,
  existing,
}: OverlapsExistingBookingInput): boolean =>
  existing.some(
    (booking) =>
      booking.roomId === request.roomId &&
      booking.start < request.end &&
      request.start < booking.end,
  );
