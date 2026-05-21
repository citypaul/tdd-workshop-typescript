import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { BookingBlock } from './BookingBlock';
import { ConflictOverlay } from './ConflictOverlay';

const HOURS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
] as const;

const TimelineFrame = ({ children }: { readonly children: ReactNode }) => (
  <div className="bg-surface w-[720px] border-2 border-[#333] p-6">
    <div className="timeline-grid">
      {HOURS.map((label, i) => (
        <div key={label} className="timeline-hour-label text-dim" style={{ gridRow: i * 2 + 1 }}>
          {label}
        </div>
      ))}
      {children}
    </div>
  </div>
);

const meta: Meta<typeof ConflictOverlay> = {
  component: ConflictOverlay,
  title: 'Features/ConflictOverlay',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TimelineFrame>
        <Story />
      </TimelineFrame>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ConflictOverlay>;

const existingBooking = {
  id: 'b1',
  roomId: 'boardroom',
  start: new Date('2026-05-01T10:00:00Z'),
  end: new Date('2026-05-01T11:30:00Z'),
  attendees: 8,
  purpose: 'Quarterly Planning',
};

export const OnItsOwn: Story = {
  args: {
    start: new Date('2026-05-01T10:00:00Z'),
    end: new Date('2026-05-01T11:00:00Z'),
  },
};

export const OnTopOfExistingBooking: Story = {
  render: (args) => (
    <>
      <BookingBlock booking={existingBooking} title="Quarterly Planning" collided />
      <ConflictOverlay {...args} />
    </>
  ),
  args: {
    start: new Date('2026-05-01T10:00:00Z'),
    end: new Date('2026-05-01T11:00:00Z'),
  },
};
