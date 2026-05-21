export type HasNonPositiveDurationInput = {
  readonly start: Date;
  readonly end: Date;
};

export const hasNonPositiveDuration = ({ start, end }: HasNonPositiveDurationInput): boolean =>
  end <= start;
