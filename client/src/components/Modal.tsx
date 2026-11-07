import React, { useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Modal Card */}
      <div
        className={twMerge(
          clsx(
            'relative w-full bg-bg-surface border border-border-default rounded-xl shadow-lg z-10 overflow-hidden flex flex-col max-h-[90vh]',
            maxWidthClasses[maxWidth],
            className
          )
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border-default">
            <div>
              {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
              {description && (
                <p className="text-xs text-text-secondary mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto text-sm text-text-secondary">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-border-default bg-bg-app">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
