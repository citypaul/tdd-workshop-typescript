const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

export type ExceedsMaxDurationInput = {
  readonly start: Date;
  readonly end: Date;
};

export const exceedsMaxDuration = ({ start, end }: ExceedsMaxDurationInput): boolean =>
  end.getTime() - start.getTime() > MAX_DURATION_MS;
