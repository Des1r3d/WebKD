import { cn } from './cn';

const nf = new Intl.NumberFormat('vi-VN');

export const formatVnd = (n: number) => `${n < 0 ? '-' : ''}${nf.format(Math.abs(n))} ₫`;

export function MoneyText({ amount, signed, className }: { amount: number; signed?: boolean; className?: string }) {
  const s = signed && amount > 0 ? `+${formatVnd(amount)}` : formatVnd(amount);
  return (
    <span className={cn('whitespace-nowrap font-mono text-[15px] font-semibold leading-5 tabular-nums', amount < 0 && 'text-status-completed', className)} style={{ fontFeatureSettings: '"tnum"' }}>
      {s}
    </span>
  );
}
