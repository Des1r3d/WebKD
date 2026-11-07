import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby={id}
        className="w-full max-w-md rounded-xl bg-bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id={id} className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Đóng" className="rounded-md p-1 text-text-secondary hover:bg-bg-subtle">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
