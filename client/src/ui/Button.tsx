import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

const V = {
  primary: 'bg-primary text-text-inverted hover:bg-primary-hover',
  secondary: 'bg-primary-light text-primary hover:bg-bg-subtle',
  outline: 'border border-border-strong bg-bg-surface text-text-primary hover:bg-bg-subtle',
  danger: 'bg-status-disputed text-text-inverted hover:opacity-90',
  ghost: 'text-text-secondary hover:bg-bg-subtle',
};
const S = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof V;
  size?: keyof typeof S;
  loading?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, iconStart, iconEnd, disabled, className, children, type = 'button', ...r }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn('inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50', V[variant], S[size], className)}
      {...r}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : iconStart}
      {children}
      {!loading && iconEnd}
    </button>
  );
}
