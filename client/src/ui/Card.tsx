import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export function Card({ interactive, className, ...r }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn('rounded-xl border border-border-default bg-bg-surface p-4 shadow-sm', interactive && 'transition-shadow hover:shadow-md', className)}
      {...r}
    />
  );
}
