import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label as an accessible button', async () => {
    const screen = await render(<Button onClick={() => undefined}>Execute Booking</Button>);

    await expect
      .element(screen.getByRole('button', { name: 'Execute Booking' }))
      .toBeInTheDocument();
  });

  it('invokes the onClick callback when the user clicks the button', async () => {
    const onClick = vi.fn();
    const screen = await render(<Button onClick={onClick}>Save</Button>);

    await screen.getByRole('button', { name: 'Save' }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled when the disabled prop is true', async () => {
    const screen = await render(
      <Button onClick={() => undefined} disabled>
        Save
      </Button>,
    );

    await expect.element(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('uses type="button" by default so it does not submit enclosing forms', async () => {
    const screen = await render(<Button onClick={() => undefined}>Save</Button>);

    await expect
      .element(screen.getByRole('button', { name: 'Save' }))
      .toHaveAttribute('type', 'button');
  });

  it('uses type="submit" when the caller opts in, so it can submit its enclosing form', async () => {
    const screen = await render(<Button type="submit">Save</Button>);

    await expect
      .element(screen.getByRole('button', { name: 'Save' }))
      .toHaveAttribute('type', 'submit');
  });
});
