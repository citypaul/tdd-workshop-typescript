import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { FormField } from './FormField';

describe('FormField', () => {
  it('renders the label text', async () => {
    const screen = await render(
      <FormField label="Attendees">
        <input id="attendees" />
      </FormField>,
    );

    await expect.element(screen.getByText('Attendees')).toBeInTheDocument();
  });

  it('focuses the wrapped input when the user clicks the label', async () => {
    const screen = await render(
      <FormField label="Attendees">
        <input id="attendees" />
      </FormField>,
    );

    await userEvent.click(screen.getByText('Attendees'));

    await expect.element(screen.getByLabelText('Attendees')).toHaveFocus();
  });
});
