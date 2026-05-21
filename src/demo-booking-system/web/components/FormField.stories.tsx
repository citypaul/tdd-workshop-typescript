import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';

const meta: Meta<typeof FormField> = {
  component: FormField,
  title: 'Atoms/FormField',
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof FormField>;

export const WithTextInput: Story = {
  args: {
    label: 'Room',
    children: (
      <input
        id="room"
        className="w-full bg-transparent p-4 text-base text-white outline-none"
        defaultValue="The Boardroom"
      />
    ),
  },
};

export const WithNumberInput: Story = {
  args: {
    label: 'Attendees',
    children: (
      <input
        id="attendees"
        type="number"
        min={1}
        defaultValue={4}
        className="w-full bg-transparent p-4 text-base tnum text-white outline-none"
      />
    ),
  },
};
