import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from './Timeline';

const boardroom = {
  id: 'boardroom',
  name: 'The Boardroom',
  capacity: 12,
};

const bookings = [
  {
    booking: {
      id: 'b1',
      roomId: 'boardroom',
      start: new Date('2026-05-01T10:00:00Z'),
      end: new Date('2026-05-01T11:30:00Z'),
      attendees: 8,
      purpose: 'Quarterly Planning',
    },
    title: 'Quarterly Planning',
  },
  {
    booking: {
      id: 'b2',
      roomId: 'boardroom',
      start: new Date('2026-05-01T13:00:00Z'),
      end: new Date('2026-05-01T14:00:00Z'),
      attendees: 4,
      purpose: 'Architecture Review',
    },
    title: 'Architecture Review',
  },
];

const meta: Meta<typeof Timeline> = {
  component: Timeline,
  title: 'Features/Timeline',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[780px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Timeline>;

export const WithBookings: Story = {
  args: {
    room: boardroom,
    bookings,
    now: new Date('2026-05-01T09:30:00Z'),
  },
};

export const WithConflict: Story = {
  args: {
    room: boardroom,
    bookings: [{ ...bookings[0], title: 'Quarterly Planning' } as (typeof bookings)[number]],
    now: new Date('2026-05-01T09:30:00Z'),
    conflict: {
      start: new Date('2026-05-01T10:00:00Z'),
      end: new Date('2026-05-01T11:00:00Z'),
    },
  },
};

export const Empty: Story = {
  args: {
    room: boardroom,
    bookings: [],
    now: new Date('2026-05-01T09:30:00Z'),
  },
};
