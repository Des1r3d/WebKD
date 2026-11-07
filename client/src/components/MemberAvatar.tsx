import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Crown } from 'lucide-react';

export interface MemberAvatarProps {
  name: string;
  imageUrl?: string;
  isHost?: boolean;
  reputationScore?: number;
  reputationTier?: 'A' | 'B' | 'C' | 'FLAGGED';
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({
  name,
  imageUrl,
  isHost = false,
  reputationScore,
  reputationTier,
  size = 'md',
  showBadge = true,
  className,
}) => {
  // Determine tier from score if not explicitly passed
  let resolvedTier = reputationTier;
  if (!resolvedTier && reputationScore !== undefined) {
    if (reputationScore >= 90) resolvedTier = 'A';
    else if (reputationScore >= 70) resolvedTier = 'B';
    else if (reputationScore >= 50) resolvedTier = 'C';
    else resolvedTier = 'FLAGGED';
  }

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const badgeSizeClasses = {
    sm: 'w-3.5 h-3.5 text-[9px]',
    md: 'w-4 h-4 text-[10px]',
    lg: 'w-5 h-5 text-xs',
  };

  const tierColors: Record<string, string> = {
    A: 'bg-emerald-600 text-white border-white',
    B: 'bg-amber-500 text-white border-white',
    C: 'bg-orange-500 text-white border-white',
    FLAGGED: 'bg-red-600 text-white border-white',
  };

  return (
    <div className={twMerge(clsx('relative inline-flex items-center justify-center', className))}>
      {/* Avatar Circle */}
      <div
        className={clsx(
          'relative rounded-full flex items-center justify-center font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 select-none overflow-hidden',
          sizeClasses[size]
        )}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials || '?'}</span>
        )}
      </div>

      {/* Host Crown Indicator */}
      {isHost && (
        <span
          title="Trưởng phòng (Host)"
          className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full shadow-sm border border-white flex items-center justify-center"
        >
          <Crown className="w-3 h-3 fill-current" />
        </span>
      )}

      {/* Reputation Tier Badge */}
      {showBadge && resolvedTier && !isHost && (
        <span
          title={`Hạng uy tín ${resolvedTier}${reputationScore !== undefined ? ` (${reputationScore} điểm)` : ''}`}
          className={clsx(
            'absolute -bottom-1 -right-1 rounded-full font-bold border flex items-center justify-center shadow-xs',
            badgeSizeClasses[size],
            tierColors[resolvedTier] || 'bg-slate-400 text-white'
          )}
        >
          {resolvedTier === 'FLAGGED' ? '!' : resolvedTier}
        </span>
      )}
    </div>
  );
};
