import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { BookingForm } from './BookingForm';
import { makeRoom } from '@/test/factories';

describe('BookingForm', () => {
  const boardroom = makeRoom({ id: 'boardroom', name: 'The Boardroom', capacity: 12 });
  const warRoom = makeRoom({ id: 'war-room', name: 'The War Room', capacity: 8 });
  const onSubmitStub = () => undefined;

  it('renders the five form fields and the Execute Booking submit button', async () => {
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmitStub}
      />,
    );

    await expect.element(screen.getByLabelText('Room')).toBeInTheDocument();
    await expect.element(screen.getByLabelText('Start time')).toBeInTheDocument();
    await expect.element(screen.getByLabelText('End time')).toBeInTheDocument();
    await expect.element(screen.getByLabelText('Attendees')).toBeInTheDocument();
    await expect.element(screen.getByLabelText('Purpose')).toBeInTheDocument();
    await expect
      .element(screen.getByRole('button', { name: 'Execute Booking' }))
      .toBeInTheDocument();
  });

  it('pre-populates the start and end time inputs with workable defaults and leaves purpose blank', async () => {
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmitStub}
      />,
    );

    await expect.element(screen.getByLabelText('Start time')).toHaveValue('10:00');
    await expect.element(screen.getByLabelText('End time')).toHaveValue('11:00');
    await expect.element(screen.getByLabelText('Purpose')).toHaveValue('');
  });

  it('shows each room capacity in the room selector', async () => {
    const screen = await render(
      <BookingForm
        rooms={[boardroom, warRoom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmitStub}
      />,
    );

    await expect
      .element(screen.getByRole('option', { name: 'The Boardroom (capacity 12)' }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole('option', { name: 'The War Room (capacity 8)' }))
      .toBeInTheDocument();
  });

  it('emits a BookingRequest when the user submits with the filled fields', async () => {
    const onSubmit = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom, warRoom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Room'), 'war-room');
    await userEvent.fill(screen.getByLabelText('Start time'), '09:00');
    await userEvent.fill(screen.getByLabelText('End time'), '10:30');
    await userEvent.fill(screen.getByLabelText('Attendees'), '6');
    await userEvent.fill(screen.getByLabelText('Purpose'), 'Quarterly planning');
    await screen.getByRole('button', { name: 'Execute Booking' }).click();

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith({
      roomId: 'war-room',
      start: new Date('2026-05-01T09:00:00Z'),
      end: new Date('2026-05-01T10:30:00Z'),
      attendees: 6,
      purpose: 'Quarterly planning',
    });
  });

  it('allows a one-attendee booking to be submitted', async () => {
    const onSubmit = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.fill(screen.getByLabelText('Attendees'), '1');
    await screen.getByRole('button', { name: 'Execute Booking' }).click();

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 'boardroom',
        attendees: 1,
      }),
    );
  });

  it('does not submit when attendees is zero', async () => {
    const onSubmit = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.fill(screen.getByLabelText('Attendees'), '0');
    await screen.getByRole('button', { name: 'Execute Booking' }).click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when attendees is blank', async () => {
    const onSubmit = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.fill(screen.getByLabelText('Attendees'), '');
    await screen.getByRole('button', { name: 'Execute Booking' }).click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when attendees is fractional', async () => {
    const onSubmit = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.fill(screen.getByLabelText('Attendees'), '1.5');
    await screen.getByRole('button', { name: 'Execute Booking' }).click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when start time is blank', async () => {
    const onSubmit = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.fill(screen.getByLabelText('Start time'), '');
    await screen.getByRole('button', { name: 'Execute Booking' }).click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when end time is blank', async () => {
    const onSubmit = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmit}
      />,
    );

    await userEvent.fill(screen.getByLabelText('End time'), '');
    await screen.getByRole('button', { name: 'Execute Booking' }).click();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a RuleViolationBanner when an error prop is provided', async () => {
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmitStub}
        error={{ error: 'Conflicts with an existing booking', rule: 'no-overlap' }}
      />,
    );

    await expect.element(screen.getByRole('alert')).toBeInTheDocument();
    await expect
      .element(screen.getByText('Conflicts with an existing booking'))
      .toBeInTheDocument();
  });

  it('does not show a banner when no error is provided', async () => {
    const screen = await render(
      <BookingForm
        rooms={[boardroom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmitStub}
      />,
    );

    expect(screen.container.querySelector('[role="alert"]')).toBeNull();
  });

  it('calls onRoomChange with the new room id when the user picks a different room', async () => {
    const onRoomChange = vi.fn();
    const screen = await render(
      <BookingForm
        rooms={[boardroom, warRoom]}
        defaultRoomId="boardroom"
        date={new Date('2026-05-01T00:00:00Z')}
        onSubmit={onSubmitStub}
        onRoomChange={onRoomChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Room'), 'war-room');

    expect(onRoomChange).toHaveBeenCalledWith(warRoom);
  });
});
