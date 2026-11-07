import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MoneyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  showSign?: boolean;
  variant?: 'default' | 'positive' | 'negative' | 'discount' | 'primary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  symbol?: string;
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  amount,
  showSign = false,
  variant = 'default',
  size = 'md',
  symbol = '₫',
  className,
  ...props
}) => {
  // Format Vietnamese number: 120000 -> 120.000
  const absAmount = Math.abs(Math.round(amount));
  const formattedNumber = new Intl.NumberFormat('vi-VN').format(absAmount);

  let sign = '';
  if (amount > 0 && showSign) sign = '+';
  else if (amount < 0) sign = '-';

  const sizeClasses = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-semibold',
    lg: 'text-base font-bold',
    xl: 'text-xl font-bold tracking-tight',
  };

  const variantClasses = {
    default: 'text-text-primary',
    primary: 'text-primary font-bold',
    positive: 'text-emerald-600 font-semibold',
    negative: 'text-red-600 font-semibold',
    discount: 'text-amber-600 font-semibold',
  };

  // Auto detect negative if default variant
  let resolvedVariant = variant;
  if (variant === 'default' && amount < 0) {
    resolvedVariant = 'negative';
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-baseline font-mono tnum whitespace-nowrap',
          sizeClasses[size],
          variantClasses[resolvedVariant],
          className
        )
      )}
      {...props}
    >
      <span>{sign}</span>
      <span>{formattedNumber}</span>
      <span className="ml-0.5 text-[0.85em] font-sans font-normal opacity-80">{symbol}</span>
    </span>
  );
};
