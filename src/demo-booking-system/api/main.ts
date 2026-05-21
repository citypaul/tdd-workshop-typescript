import { serve } from '@hono/node-server';
import { createApp } from './app';
import { makeHttpNotificationsClient } from './clients/notifications';
import { makeInMemoryStore } from './store';
import type { Room } from '../domain/types';

const rooms: readonly Room[] = [
  { id: 'boardroom', name: 'The Boardroom', capacity: 12 },
  { id: 'war-room', name: 'The War Room', capacity: 8 },
  { id: 'phone-booth', name: 'The Phone Booth', capacity: 2 },
];

const store = makeInMemoryStore({
  rooms,
  bookings: [],
  nextId: () => crypto.randomUUID(),
});

const notifications = makeHttpNotificationsClient({
  baseUrl: process.env['NOTIFICATIONS_URL'] ?? 'http://localhost:4001',
});

const app = createApp({
  store,
  now: () => new Date(),
  notifications,
});

const port = Number(process.env['PORT'] ?? 3000);

serve({ fetch: app.fetch, port }, ({ port: bound }) => {
  console.warn(`API listening on http://localhost:${String(bound)}`);
});
