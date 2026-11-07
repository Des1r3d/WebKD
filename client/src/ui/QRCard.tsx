import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './Button';

interface Props { imageUrl: string; title: string; copyText: string; copyLabel?: string; hint?: string }

export function QRCard({ imageUrl, title, copyText, copyLabel = 'Sao chép', hint }: Props) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(copyText);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  return (
    <div className="mx-auto w-full max-w-xs rounded-xl border border-border-default bg-bg-surface p-4 text-center shadow-md">
      <h3 className="mb-3 text-base font-semibold">{title}</h3>
      <img src={imageUrl} alt={`Mã QR: ${title}`} className="mx-auto aspect-square w-full rounded-lg border border-border-default object-contain" />
      {hint && <p className="mt-3 text-sm text-text-secondary">{hint}</p>}
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={copy} iconStart={done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}>
        {done ? 'Đã sao chép' : copyLabel}
      </Button>
    </div>
  );
}
