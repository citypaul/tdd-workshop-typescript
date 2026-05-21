import type { Meta, StoryObj } from '@storybook/react-vite';
import { RuleViolationBanner } from './RuleViolationBanner';

const meta: Meta<typeof RuleViolationBanner> = {
  component: RuleViolationBanner,
  title: 'Features/RuleViolationBanner',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[420px] bg-surface p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RuleViolationBanner>;

export const NoOverlap: Story = {
  args: {
    error: 'Conflicts with an existing booking',
    rule: 'no-overlap',
  },
};

export const Capacity: Story = {
  args: {
    error: 'Exceeds room capacity of 12',
    rule: 'capacity',
  },
};

export const BusinessHours: Story = {
  args: {
    error: 'Bookings must be within business hours (8am–6pm)',
    rule: 'business-hours',
  },
};
