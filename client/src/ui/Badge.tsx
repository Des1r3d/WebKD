import { cn } from './cn';

const T = {
  AVAILABLE: ['Trống', 'available'], LOCKED: ['Đang giữ', 'locked'], BOOKED: ['Đã đặt', 'paid'],
  OPEN: ['Đang mở', 'open'], AWAITING_PAYMENT: ['Chờ thanh toán', 'awaiting'], PAID: ['Đã thanh toán', 'paid'],
  COMPLETED: ['Hoàn tất', 'completed'], CANCELLED: ['Đã hủy', 'cancelled'], DISPUTED: ['Khiếu nại', 'disputed'],
  A: ['Hạng A', 'a'], B: ['Hạng B', 'b'], C: ['Hạng C', 'c'], FLAGGED: ['Cảnh báo', 'flagged'],
} as const;
// Literal classes so Tailwind can see them.
const C: Record<string, string> = {
  available: 'text-status-available', open: 'text-status-open', locked: 'text-status-locked', awaiting: 'text-status-awaiting',
  paid: 'text-status-paid', completed: 'text-status-completed', cancelled: 'text-status-cancelled', disputed: 'text-status-disputed',
  a: 'text-rep-a', b: 'text-rep-b', c: 'text-rep-c', flagged: 'text-rep-flagged',
};

export type BadgeKind = keyof typeof T;

export function Badge({ kind, className }: { kind: BadgeKind; className?: string }) {
  const [label, tone] = T[kind];
  return (
    <span className={cn('inline-flex items-center rounded-full border border-border-default bg-bg-surface px-2 py-0.5 text-xs font-medium', C[tone], className)}>
      {label}
    </span>
  );
}
