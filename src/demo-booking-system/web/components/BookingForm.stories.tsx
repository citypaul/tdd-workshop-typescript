import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookingForm } from './BookingForm';

const rooms = [
  { id: 'boardroom', name: 'The Boardroom', capacity: 12 },
  { id: 'war-room', name: 'The War Room', capacity: 8 },
  { id: 'phone-booth', name: 'The Phone Booth', capacity: 2 },
];

const meta: Meta<typeof BookingForm> = {
  component: BookingForm,
  title: 'Features/BookingForm',
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

type Story = StoryObj<typeof BookingForm>;

export const Default: Story = {
  args: {
    rooms,
    defaultRoomId: 'boardroom',
    date: new Date('2026-05-01T00:00:00Z'),
    onSubmit: () => undefined,
  },
};

export const WithError: Story = {
  args: {
    rooms,
    defaultRoomId: 'boardroom',
    date: new Date('2026-05-01T00:00:00Z'),
    onSubmit: () => undefined,
    error: { error: 'Conflicts with an existing booking', rule: 'no-overlap' },
  },
};
