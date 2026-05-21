const BUSINESS_OPEN_MINUTES = 8 * 60;
const BUSINESS_CLOSE_MINUTES = 18 * 60;

const minutesOfDayUtc = (date: Date): number => date.getUTCHours() * 60 + date.getUTCMinutes();

export type IsOutsideBusinessHoursInput = {
  readonly start: Date;
  readonly end: Date;
};

export const isOutsideBusinessHours = ({ start, end }: IsOutsideBusinessHoursInput): boolean => {
  const startMinutes = minutesOfDayUtc(start);
  const endMinutes = minutesOfDayUtc(end);
  return startMinutes < BUSINESS_OPEN_MINUTES || endMinutes > BUSINESS_CLOSE_MINUTES;
};
