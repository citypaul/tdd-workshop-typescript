import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Atoms/Button',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Execute Booking',
    onClick: () => undefined,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Execute Booking',
    onClick: () => undefined,
    disabled: true,
  },
};
