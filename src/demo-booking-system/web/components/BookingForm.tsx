import { useState } from 'react';
import type { BookingRequest, Room, RuleId } from '../../domain/types';
import { Button } from './Button';
import { FormField } from './FormField';
import { RuleViolationBanner } from './RuleViolationBanner';

export type BookingFormProps = {
  readonly rooms: readonly Room[];
  readonly defaultRoomId: string;
  readonly date: Date;
  readonly onSubmit: (request: BookingRequest) => void;
  readonly onRoomChange?: (room: Room) => void;
  readonly error?: { readonly error: string; readonly rule: RuleId };
};

const combineDateAndTime = ({
  date,
  time,
}: {
  readonly date: Date;
  readonly time: string;
}): Date => {
  const [hh, mm] = time.split(':');
  const combined = new Date(date);
  combined.setUTCHours(Number(hh), Number(mm), 0, 0);
  return combined;
};

export const BookingForm = ({
  rooms,
  defaultRoomId,
  date,
  onSubmit,
  onRoomChange = () => undefined,
  error,
}: BookingFormProps) => {
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [attendees, setAttendees] = useState(4);
  const [purpose, setPurpose] = useState('');

  return (
    <form
      className="flex flex-col space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          roomId,
          start: combineDateAndTime({ date, time: startTime }),
          end: combineDateAndTime({ date, time: endTime }),
          attendees,
          purpose,
        });
      }}
    >
      {error ? <RuleViolationBanner error={error.error} rule={error.rule} /> : null}
      <FormField label="Room">
        <select
          id="room"
          value={roomId}
          required
          onChange={(e) => {
            // `<select>` only emits values from its `<option value={room.id}>` children, so `find` always resolves to a Room. The `!` encodes that invariant where TypeScript can't.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const next = rooms.find((r) => r.id === e.target.value)!;
            setRoomId(next.id);
            onRoomChange(next);
          }}
          className="w-full bg-transparent p-4 text-base text-white outline-none"
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} (capacity {room.capacity})
            </option>
          ))}
        </select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start time">
          <input
            id="start-time"
            type="time"
            value={startTime}
            required
            onChange={(e) => {
              setStartTime(e.target.value);
            }}
            className="w-full bg-transparent p-4 text-base tnum text-white outline-none [color-scheme:dark]"
          />
        </FormField>
        <FormField label="End time">
          <input
            id="end-time"
            type="time"
            value={endTime}
            required
            onChange={(e) => {
              setEndTime(e.target.value);
            }}
            className="w-full bg-transparent p-4 text-base tnum text-white outline-none [color-scheme:dark]"
          />
        </FormField>
      </div>
      <FormField label="Attendees">
        <input
          id="attendees"
          type="number"
          min={1}
          step={1}
          required
          value={attendees}
          onChange={(e) => {
            setAttendees(Number(e.target.value));
          }}
          className="w-full bg-transparent p-4 text-base tnum text-white outline-none"
        />
      </FormField>
      <FormField label="Purpose">
        <input
          id="purpose"
          type="text"
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value);
          }}
          className="w-full bg-transparent p-4 text-base text-white outline-none"
        />
      </FormField>
      <Button type="submit">Execute Booking</Button>
    </form>
  );
};
