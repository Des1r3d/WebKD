import { Crown } from 'lucide-react';
import { Badge } from './Badge';
import { cn } from './cn';

export const repGrade = (score: number) => (score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'FLAGGED') as 'A' | 'B' | 'C' | 'FLAGGED';

export function MemberAvatar({ name, src, host, score, className }: { name: string; src?: string; host?: boolean; score?: number; className?: string }) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {src ? (
        <img src={src} alt={name} className="size-10 rounded-full object-cover" />
      ) : (
        <span role="img" aria-label={name} className="inline-flex size-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      {host && (
        <span className="absolute -right-1 -top-2 rounded-full bg-accent-light p-0.5 text-accent" title="Host">
          <Crown className="size-3.5" aria-label="Host" />
        </span>
      )}
      {score !== undefined && <Badge kind={repGrade(score)} className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0 text-[10px]" />}
    </span>
  );
}
