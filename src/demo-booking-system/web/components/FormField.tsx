import type { ReactNode } from 'react';

export type FormFieldProps = {
  readonly label: string;
  readonly children: ReactNode;
};

export const FormField = ({ label, children }: FormFieldProps) => (
  <label className="flex flex-col gap-2">
    <span className="text-sm font-semibold text-dim uppercase tracking-[0.25em]">{label}</span>
    <span className="block border-2 border-[#333] focus-within:border-neon">{children}</span>
  </label>
);
