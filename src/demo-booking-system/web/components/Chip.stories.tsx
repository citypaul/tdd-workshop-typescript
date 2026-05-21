import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  component: Chip,
  title: 'Atoms/Chip',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: {
    children: 'V_1.0.0',
  },
};

export const Alert: Story = {
  args: {
    children: '1/7 FAIL',
    tone: 'alert',
  },
};

export const Attendees: Story = {
  args: {
    children: '4 Attendees',
  },
};
