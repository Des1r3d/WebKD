import type { ReactNode } from 'react';
import { cn } from './cn';

interface Props {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, back, className }: Props) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {back}
        <h1 className="text-2xl font-bold leading-8 text-text-primary sm:text-[28px] sm:leading-9">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </header>
  );
}
