import { formatHhMm, minutesFromTimelineStart, timelinePercentForTime } from './timeline-grid';

export type CurrentTimeIndicatorProps = {
  readonly time: Date;
};

export const CurrentTimeIndicator = ({ time }: CurrentTimeIndicatorProps) => {
  const minutesFromStart = minutesFromTimelineStart({ time });
  const topPercent = timelinePercentForTime({ time });
  return (
    // Stryker disable next-line all: ObjectLiteral / StringLiteral — inline style mirrors the `data-top-percent` contract with a CSS unit; the arithmetic is asserted on the attribute, the style string just renders it
    <div className="timeline-current-time" style={{ top: `${String(topPercent)}%` }}>
      <span
        data-minutes-from-start={minutesFromStart}
        data-top-percent={topPercent}
        className="timeline-current-time__label"
      >
        {formatHhMm({ time })}
      </span>
      <span aria-hidden="true" className="timeline-current-time__line" />
      <span aria-hidden="true" className="timeline-current-time__dot" />
    </div>
  );
};
