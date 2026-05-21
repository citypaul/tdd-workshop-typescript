import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { RuleViolationBanner } from './RuleViolationBanner';

describe('RuleViolationBanner', () => {
  it('displays the rule error message inside an alert region', async () => {
    const screen = await render(
      <RuleViolationBanner error="Conflicts with an existing booking" rule="no-overlap" />,
    );

    await expect.element(screen.getByRole('alert')).toBeInTheDocument();
    await expect
      .element(screen.getByText('Conflicts with an existing booking'))
      .toBeInTheDocument();
  });

  it('exposes the rule id via data-rule so visual variants can key off it', async () => {
    const screen = await render(
      <RuleViolationBanner error="Conflicts with an existing booking" rule="no-overlap" />,
    );

    await expect.element(screen.getByRole('alert')).toHaveAttribute('data-rule', 'no-overlap');
  });

  it('uses the rule id for other rules as well', async () => {
    const screen = await render(
      <RuleViolationBanner error="Bookings cannot exceed 8 hours" rule="max-duration" />,
    );

    await expect.element(screen.getByRole('alert')).toHaveAttribute('data-rule', 'max-duration');
  });
});
