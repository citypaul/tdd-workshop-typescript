import type { ReactNode } from 'react';

export type ButtonType = 'button' | 'submit';

export type ButtonProps = {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly type?: ButtonType;
};

export const Button = ({ children, onClick, disabled = false, type = 'button' }: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="brutal-button bg-void text-neon font-display font-bold text-2xl py-5 px-8 uppercase tracking-[0.15em] hover:bg-neon hover:text-void active:bg-neon active:text-void"
  >
    {children}
  </button>
);
