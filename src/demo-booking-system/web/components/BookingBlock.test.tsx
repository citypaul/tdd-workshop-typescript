import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { BookingBlock } from './BookingBlock';
import { makeBooking } from '@/test/factories';

describe('BookingBlock', () => {
  const quarterlyPlanning = makeBooking({
    id: 'b1',
    start: new Date('2026-05-01T10:00:00Z'),
    end: new Date('2026-05-01T11:30:00Z'),
    attendees: 8,
  });

  it('renders the title, time range, and attendee count', async () => {
    const screen = await render(
      <BookingBlock booking={quarterlyPlanning} title="Quarterly Planning" />,
    );

    await expect.element(screen.getByText('Quarterly Planning')).toBeInTheDocument();
    await expect.element(screen.getByText('10:00 – 11:30')).toBeInTheDocument();
    await expect.element(screen.getByText('8 attendees')).toBeInTheDocument();
  });

  it('positions on the half-hour grid from start to end', async () => {
    const screen = await render(
      <BookingBlock booking={quarterlyPlanning} title="Quarterly Planning" />,
    );

    const block = screen.getByText('Quarterly Planning');
    await expect.element(block).toHaveAttribute('data-grid-row-start', '5');
    await expect.element(block).toHaveAttribute('data-grid-row-end', '8');
  });

  it('exposes data-collided="false" by default', async () => {
    const screen = await render(
      <BookingBlock booking={quarterlyPlanning} title="Quarterly Planning" />,
    );

    await expect
      .element(screen.getByText('Quarterly Planning'))
      .toHaveAttribute('data-collided', 'false');
  });

  it('exposes data-collided="true" when the collided prop is set', async () => {
    const screen = await render(
      <BookingBlock booking={quarterlyPlanning} title="Quarterly Planning" collided />,
    );

    await expect
      .element(screen.getByText('Quarterly Planning'))
      .toHaveAttribute('data-collided', 'true');
  });
});
