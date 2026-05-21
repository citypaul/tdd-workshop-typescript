import type { Booking, Room } from '../../domain/types';
import { BookingBlock } from './BookingBlock';
import { ConflictOverlay } from './ConflictOverlay';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

export type TimelineBooking = {
  readonly booking: Booking;
  readonly title: string;
};

export type TimelineProps = {
  readonly room: Room;
  readonly bookings: readonly TimelineBooking[];
  readonly now: Date;
  readonly conflict?: { readonly start: Date; readonly end: Date };
};

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
] as const;

export const Timeline = ({ room, bookings, now, conflict }: TimelineProps) => (
  <section className="bg-surface relative flex min-h-[700px] flex-col overflow-hidden border-2 border-[#333]">
    <header className="bg-panel z-10 flex items-center justify-between border-b-2 border-[#333] p-5">
      <h2 className="font-display text-3xl font-bold uppercase tracking-tight">
        Timeline / {room.name}
      </h2>
    </header>
    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-6">
      <div className="timeline-grid">
        {HOURS.map((label, i) => (
          <div
            key={label}
            className="timeline-hour-label text-dim"
            // Stryker disable next-line all: ObjectLiteral / ArithmeticOperator — cosmetic hour-label grid-row placement derived from label index; visual positioning is a Storybook concern, the behavioural contract tested here is the labels' presence
            style={{ gridRow: i * 2 + 1 }}
          >
            {label}
          </div>
        ))}
        {bookings.map(({ booking, title }) => (
          <BookingBlock key={booking.id} booking={booking} title={title} />
        ))}
        <CurrentTimeIndicator time={now} />
        {conflict ? <ConflictOverlay start={conflict.start} end={conflict.end} /> : null}
      </div>
    </div>
  </section>
);
