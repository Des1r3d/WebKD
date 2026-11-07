import { useEffect, useState } from 'react';
import { cn } from './cn';

export function Countdown({ until, onExpire, className }: { until: string | number | Date; onExpire?: () => void; className?: string }) {
  const end = new Date(until).getTime();
  const [left, setLeft] = useState(() => Math.max(0, end - Date.now()));
  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, end - Date.now());
      setLeft(l);
      if (l === 0) { clearInterval(t); onExpire?.(); }
    }, 1000);
    return () => clearInterval(t);
  }, [end, onExpire]);
  const s = Math.ceil(left / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return (
    <span
      role="timer"
      className={cn('font-mono font-semibold tabular-nums', s < 60 ? 'animate-pulse text-status-disputed' : s < 180 ? 'text-status-locked' : 'text-text-primary', className)}
    >
      {mm}:{ss}
    </span>
  );
}
