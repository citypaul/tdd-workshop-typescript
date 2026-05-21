export type HasNonPositiveAttendeesInput = {
  readonly attendees: number;
};

export const hasNonPositiveAttendees = ({ attendees }: HasNonPositiveAttendeesInput): boolean =>
  attendees <= 0;
