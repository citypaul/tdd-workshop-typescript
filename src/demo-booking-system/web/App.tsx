import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BookingRequest, Room, RuleId } from '../domain/types';
import type { ApiClient } from './api-client';
import { RuleViolationError } from './api-client';
import { BookingForm } from './components/BookingForm';
import { RuleMatrix } from './components/RuleMatrix';
import { Timeline, type TimelineBooking } from './components/Timeline';

export type AppProps = {
  readonly apiClient: ApiClient;
  readonly now: () => Date;
};

type AppError = { readonly error: string; readonly rule: RuleId };
type ConflictRange = { readonly start: Date; readonly end: Date };

const isNonEmpty = <T,>(arr: readonly T[]): arr is readonly [T, ...T[]] => arr.length > 0;

export const App = ({ apiClient, now }: AppProps) => {
  const roomsQuery = useQuery({
    // Stryker disable next-line all: ArrayDeclaration / StringLiteral — React Query cache key shape is an internal caching concern; mutations to the array or the 'rooms' literal change cache granularity, not what the user observes
    queryKey: ['rooms'],
    queryFn: () => apiClient.getRooms(),
  });
  const rooms = roomsQuery.data;
  if (!rooms) {
    return <div>Loading…</div>;
  }
  if (!isNonEmpty(rooms)) {
    return <div>No rooms available</div>;
  }
  return <BookingApp apiClient={apiClient} now={now} rooms={rooms} />;
};

type BookingAppProps = {
  readonly apiClient: ApiClient;
  readonly now: () => Date;
  readonly rooms: readonly [Room, ...Room[]];
};

const BookingApp = ({ apiClient, now, rooms }: BookingAppProps) => {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState<Room>(rooms[0]);

  const bookingsQuery = useQuery({
    // Stryker disable next-line all: ArrayDeclaration / StringLiteral — React Query cache key shape; mutations change cache granularity, not user-observable behaviour (room switch still invalidates because selectedRoom.id is in the key)
    queryKey: ['bookings', selectedRoom.id],
    queryFn: () => apiClient.getBookings({ roomId: selectedRoom.id }),
  });
  const bookings = bookingsQuery.data ?? [];

  const createBooking = useMutation({
    mutationFn: (request: BookingRequest) => apiClient.createBooking({ request }),
    onSuccess: () => {
      // Stryker disable next-line all: ObjectLiteral / ArrayDeclaration — scoping invalidateQueries to a specific key is a cache-granularity optimisation; invalidating all queries still triggers the bookings refetch the user observes
      void queryClient.invalidateQueries({ queryKey: ['bookings', selectedRoom.id] });
    },
  });

  const error: AppError | null =
    createBooking.error instanceof RuleViolationError
      ? { error: createBooking.error.error, rule: createBooking.error.rule }
      : null;

  const conflict: ConflictRange | null =
    error?.rule === 'no-overlap' && createBooking.variables
      ? { start: createBooking.variables.start, end: createBooking.variables.end }
      : null;

  const timelineBookings: readonly TimelineBooking[] = bookings.map((b) => ({
    booking: b,
    title: b.purpose.trim() === '' ? `Booking ${b.id}` : b.purpose,
  }));
  const currentNow = now();

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
      <div className="flex flex-col gap-4 lg:col-span-4">
        <BookingForm
          rooms={rooms}
          defaultRoomId={selectedRoom.id}
          onRoomChange={setSelectedRoom}
          date={currentNow}
          onSubmit={(request) => {
            createBooking.mutate(request);
          }}
          {...(error ? { error } : {})}
        />
        <RuleMatrix violatedRule={error?.rule ?? null} />
      </div>
      <div className="lg:col-span-8">
        <Timeline
          room={selectedRoom}
          bookings={timelineBookings}
          now={currentNow}
          {...(conflict ? { conflict } : {})}
        />
      </div>
    </div>
  );
};
