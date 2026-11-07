import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Clock } from 'lucide-react';

export interface CountdownProps {
  targetDate?: Date | string | number;
  initialSeconds?: number;
  onExpire?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const Countdown: React.FC<CountdownProps> = ({
  targetDate,
  initialSeconds,
  onExpire,
  label = 'Giữ slot',
  size = 'md',
  showIcon = true,
  className,
}) => {
  const calculateRemainingSeconds = (): number => {
    if (targetDate) {
      const diff = Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    if (initialSeconds !== undefined) {
      return Math.max(0, initialSeconds);
    }
    return 0;
  };

  const [timeLeft, setTimeLeft] = useState<number>(calculateRemainingSeconds);

  useEffect(() => {
    setTimeLeft(calculateRemainingSeconds());
  }, [targetDate, initialSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Severity color calculation
  const isDanger = timeLeft > 0 && timeLeft <= 60; // < 1 min
  const isWarning = timeLeft > 60 && timeLeft <= 180; // 1-3 min

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2 font-semibold',
  };

  const colorClasses = isDanger
    ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
    : isWarning
    ? 'bg-amber-50 text-amber-700 border border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border border-emerald-200';

  return (
    <div
      className={twMerge(
        clsx(
          'inline-flex items-center font-mono rounded-md font-medium select-none',
          sizeClasses[size],
          colorClasses,
          className
        )
      )}
      role="timer"
      aria-live="polite"
    >
      {showIcon && <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />}
      {label && <span className="font-sans font-normal text-text-secondary text-xs">{label}:</span>}
      <span className="tabular-nums tracking-wide font-semibold">{formattedTime}</span>
    </div>
  );
};
