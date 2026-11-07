import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-bg-surface px-6 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-bg-subtle text-text-muted" aria-hidden>
        {icon ?? <Inbox className="size-5" />}
      </span>
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-xs leading-5 text-text-secondary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
