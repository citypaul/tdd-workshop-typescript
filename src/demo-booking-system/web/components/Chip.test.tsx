import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders its label', async () => {
    const screen = await render(<Chip>1/7 FAIL</Chip>);

    await expect.element(screen.getByText('1/7 FAIL')).toBeInTheDocument();
  });

  it('exposes data-tone="default" when no tone prop is passed', async () => {
    const screen = await render(<Chip>V_1.0.0</Chip>);

    await expect.element(screen.getByText('V_1.0.0')).toHaveAttribute('data-tone', 'default');
  });

  it('exposes data-tone="alert" when tone="alert"', async () => {
    const screen = await render(<Chip tone="alert">1/7 FAIL</Chip>);

    await expect.element(screen.getByText('1/7 FAIL')).toHaveAttribute('data-tone', 'alert');
  });
});
