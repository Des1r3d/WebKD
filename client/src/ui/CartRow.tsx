import { Minus, Plus } from 'lucide-react';
import { MoneyText } from './MoneyText';

interface Props {
  name: string; owner: string; unitPrice: number; qty: number; imageUrl?: string;
  disabled?: boolean; onInc?: () => void; onDec?: () => void;
}

export function CartRow({ name, owner, unitPrice, qty, imageUrl, disabled, onInc, onDec }: Props) {
  const b = 'rounded-md border border-border-strong p-1.5 text-text-primary hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <div className="flex items-center gap-3 py-2">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-12 rounded-md object-cover" />
      ) : (
        <span aria-hidden className="size-12 rounded-md bg-accent-light" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{name}</p>
        <p className="truncate text-xs font-medium text-text-secondary">{owner}</p>
        <MoneyText amount={unitPrice} />
      </div>
      <div className="flex items-center gap-2">
        <button className={b} disabled={disabled} onClick={onDec} aria-label={`Giảm ${name}`}><Minus className="size-4" aria-hidden /></button>
        <span className="w-6 text-center font-mono tabular-nums" aria-live="polite">{qty}</span>
        <button className={b} disabled={disabled} onClick={onInc} aria-label={`Tăng ${name}`}><Plus className="size-4" aria-hidden /></button>
      </div>
    </div>
  );
}
