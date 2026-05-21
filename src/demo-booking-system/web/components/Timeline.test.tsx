import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { Timeline } from './Timeline';
import { makeBooking, makeRoom } from '@/test/factories';

describe('Timeline', () => {
  const boardroom = makeRoom({ id: 'boardroom', name: 'The Boardroom', capacity: 12 });
  const now = new Date('2026-05-01T09:30:00Z');

  it('renders an hour label for every hour from 08:00 to 18:00', async () => {
    const screen = await render(<Timeline room={boardroom} bookings={[]} now={now} />);

    for (const label of ['08:00', '10:00', '13:00', '17:00', '18:00']) {
      await expect.element(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders one BookingBlock per booking passed in', async () => {
    const quarterlyPlanning = {
      booking: makeBooking({
        id: 'b1',
        start: new Date('2026-05-01T10:00:00Z'),
        end: new Date('2026-05-01T11:30:00Z'),
        attendees: 8,
      }),
      title: 'Quarterly Planning',
    };
    const architectureReview = {
      booking: makeBooking({
        id: 'b2',
        start: new Date('2026-05-01T13:00:00Z'),
        end: new Date('2026-05-01T14:00:00Z'),
        attendees: 4,
      }),
      title: 'Architecture Review',
    };
    const screen = await render(
      <Timeline room={boardroom} bookings={[quarterlyPlanning, architectureReview]} now={now} />,
    );

    await expect.element(screen.getByText('Quarterly Planning')).toBeInTheDocument();
    await expect.element(screen.getByText('Architecture Review')).toBeInTheDocument();
  });

  it('hosts the CurrentTimeIndicator at the given now', async () => {
    const screen = await render(<Timeline room={boardroom} bookings={[]} now={now} />);

    await expect
      .element(screen.getByText('09:30'))
      .toHaveAttribute('data-minutes-from-start', '90');
  });

  it('hosts the ConflictOverlay when a conflict range is passed', async () => {
    const screen = await render(
      <Timeline
        room={boardroom}
        bookings={[]}
        now={now}
        conflict={{
          start: new Date('2026-05-01T10:00:00Z'),
          end: new Date('2026-05-01T11:00:00Z'),
        }}
      />,
    );

    await expect.element(screen.getByRole('alert')).toBeInTheDocument();
    await expect.element(screen.getByText(/conflict detected/i)).toBeInTheDocument();
  });

  it('does not render a ConflictOverlay when no conflict is passed', async () => {
    const screen = await render(<Timeline room={boardroom} bookings={[]} now={now} />);

    expect(screen.container.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows the room name in the header', async () => {
    const screen = await render(<Timeline room={boardroom} bookings={[]} now={now} />);

    await expect.element(screen.getByText('The Boardroom')).toBeInTheDocument();
  });
});
