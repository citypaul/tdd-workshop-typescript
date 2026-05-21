export type IsInPastInput = {
  readonly start: Date;
  readonly now: Date;
};

export const isInPast = ({ start, now }: IsInPastInput): boolean => start < now;
