import { formatHhMm, gridRowForTime } from './timeline-grid';

export type ConflictOverlayProps = {
  readonly start: Date;
  readonly end: Date;
};

export const ConflictOverlay = ({ start, end }: ConflictOverlayProps) => {
  const rowStart = gridRowForTime({ time: start });
  const rowEnd = gridRowForTime({ time: end });
  return (
    <div
      role="alert"
      aria-live="assertive"
      data-grid-row-start={rowStart}
      data-grid-row-end={rowEnd}
      className="conflict-overlay"
      // Stryker disable next-line all: ObjectLiteral / StringLiteral — inline style carries the dynamic grid-row span; cosmetic positioning covered by Storybook, the behavioural contract is the data-grid-row-* attributes asserted by the tests
      style={{ gridRow: `${String(rowStart)} / ${String(rowEnd)}` }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display flex items-center gap-3 text-2xl font-extrabold uppercase tracking-[0.15em] text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
          <svg
            aria-hidden="true"
            className="h-7 w-7 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Conflict Detected
        </p>
        <span className="bg-void flex items-baseline gap-2 whitespace-nowrap border-2 border-void px-3 py-1.5">
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.25em] text-dim">
            Requested
          </span>
          <span className="tnum text-base font-bold text-white">
            {formatHhMm({ time: start })} – {formatHhMm({ time: end })}
          </span>
        </span>
      </div>
    </div>
  );
};
