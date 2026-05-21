import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { RuleMatrix } from './RuleMatrix';

describe('RuleMatrix', () => {
  it('renders a row for each of the seven domain rules with a human-readable label', async () => {
    const screen = await render(<RuleMatrix violatedRule={null} />);

    await expect.element(screen.getByText('No past bookings')).toBeInTheDocument();
    await expect.element(screen.getByText('Positive duration required')).toBeInTheDocument();
    await expect.element(screen.getByText('Positive attendee count')).toBeInTheDocument();
    await expect.element(screen.getByText('No overlapping bookings')).toBeInTheDocument();
    await expect.element(screen.getByText('Attendees ≤ capacity')).toBeInTheDocument();
    await expect.element(screen.getByText('Max duration 8 hours')).toBeInTheDocument();
    await expect.element(screen.getByText('Within 8am – 6pm')).toBeInTheDocument();
  });

  it('marks every row as passing when no rule is violated', async () => {
    const screen = await render(<RuleMatrix violatedRule={null} />);

    await expect
      .element(screen.getByText('No past bookings'))
      .toHaveAttribute('data-state', 'pass');
    await expect
      .element(screen.getByText('No overlapping bookings'))
      .toHaveAttribute('data-state', 'pass');
    await expect
      .element(screen.getByText('Positive attendee count'))
      .toHaveAttribute('data-state', 'pass');
    await expect
      .element(screen.getByText('Attendees ≤ capacity'))
      .toHaveAttribute('data-state', 'pass');
  });

  it('marks only the violated rule as failing', async () => {
    const screen = await render(<RuleMatrix violatedRule="no-overlap" />);

    await expect
      .element(screen.getByText('No overlapping bookings'))
      .toHaveAttribute('data-state', 'fail');
    await expect
      .element(screen.getByText('No past bookings'))
      .toHaveAttribute('data-state', 'pass');
    await expect
      .element(screen.getByText('Positive attendee count'))
      .toHaveAttribute('data-state', 'pass');
    await expect
      .element(screen.getByText('Attendees ≤ capacity'))
      .toHaveAttribute('data-state', 'pass');
    await expect
      .element(screen.getByText('Max duration 8 hours'))
      .toHaveAttribute('data-state', 'pass');
  });

  it('surfaces the correct rule for each RuleId', async () => {
    const screen = await render(<RuleMatrix violatedRule="capacity" />);

    await expect
      .element(screen.getByText('Attendees ≤ capacity'))
      .toHaveAttribute('data-state', 'fail');
    await expect
      .element(screen.getByText('No overlapping bookings'))
      .toHaveAttribute('data-state', 'pass');
  });

  it('surfaces the positive-attendees rule', async () => {
    const screen = await render(<RuleMatrix violatedRule="positive-attendees" />);

    await expect
      .element(screen.getByText('Positive attendee count'))
      .toHaveAttribute('data-state', 'fail');
    await expect
      .element(screen.getByText('Attendees ≤ capacity'))
      .toHaveAttribute('data-state', 'pass');
  });

  it('reports the fail count in the header chip', async () => {
    const screen = await render(<RuleMatrix violatedRule="no-overlap" />);

    await expect.element(screen.getByText('1/7 Fail')).toBeInTheDocument();
  });

  it('reports zero fails when no rule is violated', async () => {
    const screen = await render(<RuleMatrix violatedRule={null} />);

    await expect.element(screen.getByText('0/7 Pass')).toBeInTheDocument();
  });

  it('uses the alert chip tone on the header when a rule is violated', async () => {
    const screen = await render(<RuleMatrix violatedRule="no-overlap" />);

    await expect.element(screen.getByText('1/7 Fail')).toHaveAttribute('data-tone', 'alert');
  });

  it('uses the default chip tone on the header when no rule is violated', async () => {
    const screen = await render(<RuleMatrix violatedRule={null} />);

    await expect.element(screen.getByText('0/7 Pass')).toHaveAttribute('data-tone', 'default');
  });

  it('shows a FAIL chip on the violated row and nowhere else', async () => {
    const screen = await render(<RuleMatrix violatedRule="no-overlap" />);

    await expect.element(screen.getByText('Fail', { exact: true })).toBeInTheDocument();
  });

  it('numbers each row with a two-digit zero-padded ordinal', async () => {
    const screen = await render(<RuleMatrix violatedRule={null} />);

    await expect.element(screen.getByText('01')).toBeInTheDocument();
    await expect.element(screen.getByText('07')).toBeInTheDocument();
  });
});
