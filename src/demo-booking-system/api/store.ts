import type { Booking, BookingRequest, Room } from '../domain/types';

/**
 * Repository port. The API depends on this interface, not on any particular
 * backing store, so a production build can wire a SQL / NoSQL / external
 * service adapter and tests can wire the in-memory fake below. Handlers
 * never import an adapter directly.
 *
 * saveBooking returns the persisted Booking (with id stamped by the
 * repository) — the same shape a real ORM exposes via `repo.save(entity)`.
 * Callers do not generate ids themselves.
 */
export type Store = {
  readonly listRooms: () => readonly Room[];
  readonly listBookingsForRoom: (input: { readonly roomId: string }) => readonly Booking[];
  readonly saveBooking: (input: { readonly request: BookingRequest }) => Booking;
};

export type MakeInMemoryStoreInput = {
  readonly rooms: readonly Room[];
  readonly bookings: readonly Booking[];
  /**
   * Id strategy. Production wires `() => crypto.randomUUID()` from
   * `src/demo-booking-system/api/main.ts`. Tests that need exact assertions on the generated
   * id pass `() => 'b1'` (or a stub that yields the sequence they expect);
   * most tests go through the `makeStore` test factory, which defaults to
   * `crypto.randomUUID()` so they don't have to think about it. Making
   * this required (no default inside the adapter) keeps the adapter honest
   * — callers have to state where ids come from — and avoids a mutant
   * surface on a default that production never uses.
   *
   * A real application would typically let the database generate the id;
   * this hook is the in-memory equivalent for test determinism.
   */
  readonly nextId: () => string;
};

/**
 * In-memory **fake** implementation of the `Store` port. "Fake" in the
 * xUnit-patterns sense (Meszaros): a simplified, working implementation
 * suitable for tests, not a mock or stub — it behaves like the real thing,
 * just without persistence.
 *
 * Why a fake instead of a mock of the port:
 *  - Behaviour stays realistic: writes are visible to subsequent reads,
 *    `listBookingsForRoom` filters correctly, ids are stamped on save.
 *  - Tests exercise the same HTTP flow as production — no test-only
 *    branches in the handler.
 *  - Mutation testing gets real signal: a mutant that breaks the
 *    handler's contract with the repository surfaces through the fake's
 *    behaviour, not through a spy.
 *
 * The single `let` is the documented mutation boundary for the project.
 * Writes produce a new array reference (`[...allBookings, booking]`) so
 * no booking is ever mutated in place — callers receive immutable views.
 */
export const makeInMemoryStore = ({ rooms, bookings, nextId }: MakeInMemoryStoreInput): Store => {
  let allBookings: readonly Booking[] = bookings;

  return {
    listRooms: () => rooms,
    listBookingsForRoom: ({ roomId }) => allBookings.filter((b) => b.roomId === roomId),
    saveBooking: ({ request }) => {
      const booking: Booking = { id: nextId(), ...request };
      allBookings = [...allBookings, booking];
      return booking;
    },
  };
};
