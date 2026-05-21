import type { Booking } from '../../domain/types';

export type NotificationsClient = {
  readonly bookingCreated: (input: { readonly booking: Booking }) => Promise<void>;
};

export type MakeHttpNotificationsClientInput = {
  readonly baseUrl: string;
};

export const makeHttpNotificationsClient = ({
  baseUrl,
}: MakeHttpNotificationsClientInput): NotificationsClient => ({
  bookingCreated: async ({ booking }) => {
    await fetch(`${baseUrl}/notifications/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking }),
    });
  },
});
