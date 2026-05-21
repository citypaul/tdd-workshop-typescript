export type Room = {
  readonly id: string;
  readonly name: string;
  readonly capacity: number;
};

export type BookingRequest = {
  readonly roomId: string;
  readonly start: Date;
  readonly end: Date;
  readonly attendees: number;
  readonly purpose: string;
};

export type Booking = BookingRequest & {
  readonly id: string;
};

export type RuleId =
  | 'no-past'
  | 'positive-duration'
  | 'positive-attendees'
  | 'no-overlap'
  | 'capacity'
  | 'max-duration'
  | 'business-hours';

export type BookingResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string; readonly rule: RuleId };
