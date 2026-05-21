import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { ConflictOverlay } from './ConflictOverlay';

describe('ConflictOverlay', () => {
  const tenToEleven = {
    start: new Date('2026-05-01T10:00:00Z'),
    end: new Date('2026-05-01T11:00:00Z'),
  };

  it('announces the conflict with role=alert and the CONFLICT DETECTED headline', async () => {
    const screen = await render(<ConflictOverlay {...tenToEleven} />);

    await expect.element(screen.getByRole('alert')).toBeInTheDocument();
    await expect.element(screen.getByText(/conflict detected/i)).toBeInTheDocument();
  });

  it('displays the attempted time range', async () => {
    const screen = await render(<ConflictOverlay {...tenToEleven} />);

    await expect.element(screen.getByText('10:00 – 11:00')).toBeInTheDocument();
  });

  it('positions on the half-hour grid from start to end', async () => {
    const screen = await render(<ConflictOverlay {...tenToEleven} />);

    const alert = screen.getByRole('alert');
    await expect.element(alert).toHaveAttribute('data-grid-row-start', '5');
    await expect.element(alert).toHaveAttribute('data-grid-row-end', '7');
  });
});
