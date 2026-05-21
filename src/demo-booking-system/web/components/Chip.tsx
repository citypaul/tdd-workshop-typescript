import type { ReactNode } from 'react';

export type ChipTone = 'default' | 'alert';

export type ChipProps = {
  readonly children: ReactNode;
  readonly tone?: ChipTone;
};

const toneClasses: Record<ChipTone, string> = {
  default: 'border-[#333] text-white bg-void',
  alert: 'border-alert text-alert bg-alert/15',
};

export const Chip = ({ children, tone = 'default' }: ChipProps) => (
  <span
    data-tone={tone}
    // Stryker disable next-line StringLiteral: purely cosmetic Tailwind classes — visual concern covered by Storybook, not a behavioural contract worth a test
    className={`inline-block border-2 px-3 py-1 text-sm font-semibold uppercase tracking-widest tnum ${toneClasses[tone]}`}
  >
    {children}
  </span>
);
