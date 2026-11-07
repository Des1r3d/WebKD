import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant =
  | 'primary'
  | 'accent'
  | 'neutral'
  | 'outline'
  | 'available'
  | 'open'
  | 'locked'
  | 'awaiting'
  | 'paid'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'rep-a'
  | 'rep-b'
  | 'rep-c'
  | 'rep-flagged';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-sm',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md',
  };

  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-primary-light text-primary border border-emerald-200',
    accent: 'bg-accent-light text-accent border border-amber-200',
    neutral: 'bg-bg-subtle text-text-secondary border border-border-default',
    outline: 'border border-border-strong text-text-primary bg-transparent',

    // Business states
    available: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    open: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    locked: 'bg-amber-50 text-amber-700 border border-amber-200',
    awaiting: 'bg-blue-50 text-blue-700 border border-blue-200',
    paid: 'bg-teal-50 text-teal-700 border border-teal-200',
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    cancelled: 'bg-slate-100 text-slate-600 border border-slate-200',
    disputed: 'bg-red-50 text-red-700 border border-red-200',

    // Reputation
    'rep-a': 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold',
    'rep-b': 'bg-amber-50 text-amber-700 border border-amber-300 font-semibold',
    'rep-c': 'bg-orange-50 text-orange-700 border border-orange-300 font-semibold',
    'rep-flagged': 'bg-red-50 text-red-700 border border-red-300 font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center justify-center whitespace-nowrap',
          sizeClasses[size],
          variantClasses[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
