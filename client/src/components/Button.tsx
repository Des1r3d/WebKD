import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-md cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 transition-colors duration-150';

    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-12 font-semibold',
    };

    const variantClasses = {
      primary: 'bg-primary text-text-inverted hover:bg-primary-hover active:bg-primary-dark shadow-sm',
      secondary: 'bg-bg-subtle text-text-primary hover:bg-border-default active:bg-border-strong',
      outline: 'border border-border-strong bg-transparent text-text-primary hover:bg-bg-subtle',
      danger: 'bg-status-disputed text-text-inverted hover:bg-red-700 active:bg-red-800',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-subtle',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
