import { Crown } from 'lucide-react';
import { cn } from './cn';

export const repGrade = (score: number) => (score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'FLAGGED') as 'A' | 'B' | 'C' | 'FLAGGED';

const GRADE_STYLE: Record<string, string> = {
  A: 'bg-primary text-text-inverted',
  B: 'bg-accent text-text-inverted',
  C: 'bg-status-cancelled text-text-inverted',
  FLAGGED: 'bg-status-disputed text-text-inverted',
};

const GRADE_LABEL: Record<string, string> = { A: 'Hạng A', B: 'Hạng B', C: 'Hạng C', FLAGGED: 'Cảnh báo uy tín' };

export function MemberAvatar({ name, src, host, score, className }: { name: string; src?: string; host?: boolean; score?: number; className?: string }) {
  const grade = score === undefined ? null : repGrade(score);
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img src={src} alt={name} className="size-10 rounded-full object-cover" />
      ) : (
        <span role="img" aria-label={name} className="inline-flex size-10 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      {host && (
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-bg-surface bg-accent text-text-inverted" title="Trưởng phòng">
          <Crown className="size-3" aria-label="Trưởng phòng" />
        </span>
      )}
      {grade && (
        <span
          title={`${GRADE_LABEL[grade]} · ${score}/100`}
          className={cn('absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full border-2 border-bg-surface text-[9px] font-bold leading-none', GRADE_STYLE[grade])}
        >
          {grade === 'FLAGGED' ? '!' : grade}
        </span>
      )}
    </span>
  );
}
