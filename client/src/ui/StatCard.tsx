import type { ReactNode } from 'react';
import { cn } from './cn';

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'danger';
  className?: string;
}

const TONE = {
  default: 'bg-primary-light text-primary',
  positive: 'bg-primary-light text-status-completed',
  warning: 'bg-accent-light text-accent',
  danger: 'bg-bg-subtle text-status-disputed',
};

export function StatCard({ label, value, icon, hint, tone = 'default', className }: Props) {
  return (
    <div className={cn('rounded-xl border border-border-default bg-bg-surface p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        {icon && <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', TONE[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-lg font-bold leading-7 text-text-primary">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-4 text-text-muted">{hint}</p>}
    </div>
  );
}
