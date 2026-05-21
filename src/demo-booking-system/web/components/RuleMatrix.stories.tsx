import type { Meta, StoryObj } from '@storybook/react-vite';
import { RuleMatrix } from './RuleMatrix';

const meta: Meta<typeof RuleMatrix> = {
  component: RuleMatrix,
  title: 'Features/RuleMatrix',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RuleMatrix>;

export const AllPassing: Story = {
  args: { violatedRule: null },
};

export const NoOverlapViolated: Story = {
  args: { violatedRule: 'no-overlap' },
};

export const CapacityViolated: Story = {
  args: { violatedRule: 'capacity' },
};
