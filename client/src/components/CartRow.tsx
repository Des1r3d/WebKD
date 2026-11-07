import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { MoneyText } from './MoneyText';

export interface CartRowProps {
  id: string;
  name: string;
  userName: string;
  userAvatar?: string;
  price: number;
  qty: number;
  imageUrl?: string;
  isLocked?: boolean;
  canModify?: boolean;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onRemove?: () => void;
  className?: string;
}

export const CartRow: React.FC<CartRowProps> = ({
  name,
  userName,
  userAvatar,
  price,
  qty,
  imageUrl,
  isLocked = false,
  canModify = true,
  onIncrease,
  onDecrease,
  onRemove,
  className,
}) => {
  const isActionDisabled = isLocked || !canModify;

  return (
    <div
      className={twMerge(
        clsx(
          'flex items-center justify-between p-3 bg-bg-surface border border-border-default rounded-lg gap-3 transition-colors duration-150',
          isLocked && 'bg-bg-subtle/50 opacity-90',
          className
        )
      )}
    >
      {/* Item Image & Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-12 h-12 rounded-md object-cover border border-border-default flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-xs flex-shrink-0">
            F&B
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-text-primary truncate">{name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <MoneyText amount={price} size="sm" variant="default" />
            <span className="text-text-muted text-xs">·</span>
            <div className="flex items-center gap-1 text-[11px] text-text-secondary truncate">
              {userAvatar && (
                <img src={userAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
              )}
              <span className="truncate">{userName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Controls & Total */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <MoneyText amount={price * qty} size="sm" variant="primary" />
        </div>

        <div className="flex items-center border border-border-default rounded-md bg-bg-app overflow-hidden">
          {qty === 1 && onRemove ? (
            <button
              onClick={onRemove}
              disabled={isActionDisabled}
              aria-label="Xóa món"
              className="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onDecrease}
              disabled={isActionDisabled || qty <= 1}
              aria-label="Giảm số lượng"
              className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-border-default disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="px-2 font-mono text-xs font-semibold tnum text-text-primary min-w-[24px] text-center">
            {qty}
          </span>

          <button
            onClick={onIncrease}
            disabled={isActionDisabled}
            aria-label="Tăng số lượng"
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-border-default disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
