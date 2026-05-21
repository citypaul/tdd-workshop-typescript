import type { Booking } from '../../domain/types';
import { Chip } from './Chip';
import { formatHhMm, gridRowForTime } from './timeline-grid';

export type BookingBlockProps = {
  readonly booking: Booking;
  readonly title: string;
  readonly collided?: boolean;
};

export const BookingBlock = ({ booking, title, collided = false }: BookingBlockProps) => {
  const rowStart = gridRowForTime({ time: booking.start });
  const rowEnd = gridRowForTime({ time: booking.end });
  return (
    // Stryker disable next-line all: ObjectLiteral / StringLiteral — inline style carries the dynamic grid-row span; cosmetic positioning covered by Storybook, the behavioural contract is the data-grid-row-* attributes on the title
    <div className="booking-block" style={{ gridRow: `${String(rowStart)} / ${String(rowEnd)}` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            data-grid-row-start={rowStart}
            data-grid-row-end={rowEnd}
            data-collided={collided}
            className="booking-block__title"
          >
            {title}
          </p>
          <p className="booking-block__time">
            {formatHhMm({ time: booking.start })} – {formatHhMm({ time: booking.end })}
          </p>
        </div>
        <Chip>{String(booking.attendees)} attendees</Chip>
      </div>
    </div>
  );
};
