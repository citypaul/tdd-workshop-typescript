/**
 * The timeline is a CSS grid with one row per half-hour from 08:00 to 18:00.
 * Row 1 = 08:00, row 2 = 08:30, …, row 20 = 17:30, row 21 = 18:00 (end edge).
 *
 * Components that need to pin themselves to the grid compute their row(s)
 * through this helper so everyone shares the same mapping.
 */
export const TIMELINE_START_HOUR = 8;
export const TIMELINE_END_HOUR = 18;
const TIMELINE_TOTAL_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;

export const gridRowForTime = ({ time }: { readonly time: Date }): number => {
  const hours = time.getUTCHours();
  const minutes = time.getUTCMinutes();
  return (hours - TIMELINE_START_HOUR) * 2 + Math.floor(minutes / 30) + 1;
};

export const minutesFromTimelineStart = ({ time }: { readonly time: Date }): number => {
  const hours = time.getUTCHours();
  const minutes = time.getUTCMinutes();
  return (hours - TIMELINE_START_HOUR) * 60 + minutes;
};

export const timelinePercentForTime = ({ time }: { readonly time: Date }): number =>
  (minutesFromTimelineStart({ time }) / TIMELINE_TOTAL_MINUTES) * 100;

export const formatHhMm = ({ time }: { readonly time: Date }): string => {
  const hh = String(time.getUTCHours()).padStart(2, '0');
  const mm = String(time.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
