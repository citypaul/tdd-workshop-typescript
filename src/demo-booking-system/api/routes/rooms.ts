import type { Hono } from 'hono';
import type { Store } from '../store';

export type RegisterRoomsRoutesInput = {
  readonly api: Hono;
  readonly store: Store;
};

export const registerRoomsRoutes = ({ api, store }: RegisterRoomsRoutesInput): void => {
  api.get('/rooms', (c) => c.json(store.listRooms()));
};
