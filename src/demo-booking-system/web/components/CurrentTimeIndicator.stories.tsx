import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';

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

const meta: Meta<typeof CurrentTimeIndicator> = {
  component: CurrentTimeIndicator,
  title: 'Features/CurrentTimeIndicator',
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

type Story = StoryObj<typeof CurrentTimeIndicator>;

export const AtHalfNine: Story = {
  args: { time: new Date('2026-05-01T09:30:00Z') },
};

export const AtTopOfTimeline: Story = {
  args: { time: new Date('2026-05-01T08:00:00Z') },
};

export const AtBottomOfTimeline: Story = {
  args: { time: new Date('2026-05-01T17:30:00Z') },
};
