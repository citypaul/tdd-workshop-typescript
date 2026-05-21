import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

describe('CurrentTimeIndicator', () => {
  it('displays the given time as HH:MM', async () => {
    const screen = await render(<CurrentTimeIndicator time={new Date('2026-05-01T09:30:00Z')} />);

    await expect.element(screen.getByText('09:30')).toBeInTheDocument();
  });

  it('positions at 90 minutes from the 08:00 timeline start for 09:30', async () => {
    const screen = await render(<CurrentTimeIndicator time={new Date('2026-05-01T09:30:00Z')} />);

    await expect
      .element(screen.getByText('09:30'))
      .toHaveAttribute('data-minutes-from-start', '90');
  });

  it('positions at 15 minutes from the timeline start for 08:15 (between hours)', async () => {
    const screen = await render(<CurrentTimeIndicator time={new Date('2026-05-01T08:15:00Z')} />);

    await expect
      .element(screen.getByText('08:15'))
      .toHaveAttribute('data-minutes-from-start', '15');
  });

  it('positions at 0 minutes at 08:00 (top of the timeline)', async () => {
    const screen = await render(<CurrentTimeIndicator time={new Date('2026-05-01T08:00:00Z')} />);

    await expect.element(screen.getByText('08:00')).toHaveAttribute('data-minutes-from-start', '0');
  });

  it('positions at 570 minutes at 17:30 (last half-hour)', async () => {
    const screen = await render(<CurrentTimeIndicator time={new Date('2026-05-01T17:30:00Z')} />);

    await expect
      .element(screen.getByText('17:30'))
      .toHaveAttribute('data-minutes-from-start', '570');
  });

  it('exposes the top-percent so the visual position reflects the exact time', async () => {
    const screen = await render(<CurrentTimeIndicator time={new Date('2026-05-01T09:30:00Z')} />);

    // 90 minutes of the 10-hour (600-minute) timeline = 15%
    await expect.element(screen.getByText('09:30')).toHaveAttribute('data-top-percent', '15');
  });

  it('top-percent scales linearly — 17:30 sits at 95% of the way down', async () => {
    const screen = await render(<CurrentTimeIndicator time={new Date('2026-05-01T17:30:00Z')} />);

    await expect.element(screen.getByText('17:30')).toHaveAttribute('data-top-percent', '95');
  });
});
