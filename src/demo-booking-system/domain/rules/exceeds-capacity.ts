import type { BookingRequest, Room } from '../types';

export type ExceedsCapacityInput = {
  readonly request: BookingRequest;
  readonly room: Room;
};

export const exceedsCapacity = ({ request, room }: ExceedsCapacityInput): boolean =>
  request.attendees > room.capacity;
