import type { RuleId } from '../../domain/types';
import { Chip } from './Chip';

export type RuleMatrixProps = {
  readonly violatedRule: RuleId | null;
};

type RuleRow = { readonly id: RuleId; readonly label: string };

const RULES: readonly RuleRow[] = [
  { id: 'no-past', label: 'No past bookings' },
  { id: 'positive-duration', label: 'Positive duration required' },
  { id: 'positive-attendees', label: 'Positive attendee count' },
  { id: 'no-overlap', label: 'No overlapping bookings' },
  { id: 'capacity', label: 'Attendees ≤ capacity' },
  { id: 'max-duration', label: 'Max duration 8 hours' },
  { id: 'business-hours', label: 'Within 8am – 6pm' },
];

const padNumber = (value: number): string => String(value).padStart(2, '0');

export const RuleMatrix = ({ violatedRule }: RuleMatrixProps) => {
  const failed = violatedRule !== null;
  const headerLabel = failed
    ? `${String(1)}/${String(RULES.length)} Fail`
    : `${String(0)}/${String(RULES.length)} Pass`;

  return (
    <section className="bg-surface flex flex-col border-2 border-[#333]">
      <header className="bg-panel flex items-center justify-between border-b-2 border-[#333] p-4">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight">Rule Matrix</h2>
        <Chip tone={failed ? 'alert' : 'default'}>{headerLabel}</Chip>
      </header>
      <ul className="space-y-3 p-5 text-base font-medium">
        {RULES.map((rule, index) => {
          const state = rule.id === violatedRule ? 'fail' : 'pass';
          return (
            <li key={rule.id} className="rule-matrix__row">
              <span className="rule-matrix__dot" aria-hidden="true" />
              <span className="rule-matrix__number">{padNumber(index + 1)}</span>
              <span data-state={state} className="rule-matrix__label">
                {rule.label}
              </span>
              {state === 'fail' ? <span className="rule-matrix__fail-chip">Fail</span> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
