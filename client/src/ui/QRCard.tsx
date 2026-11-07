import { useState } from 'react';
import { Check, Copy, QrCode } from 'lucide-react';
import { Button } from './Button';

interface Props { imageUrl: string; title: string; copyText: string; copyLabel?: string; hint?: string }

export function QRCard({ imageUrl, title, copyText, copyLabel = 'Sao chép', hint }: Props) {
  const [done, setDone] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(copyText);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };
  return (
    <div className="w-full rounded-xl border border-border-default bg-bg-surface p-4 text-center shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3>
      {imgFailed ? (
        <div className="mx-auto flex aspect-square w-full max-w-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-bg-subtle px-4 text-text-secondary">
          <QrCode className="size-8 text-text-muted" aria-hidden />
          <p className="text-xs">Không tải được ảnh mã QR. Dùng liên kết bên dưới để mời hoặc thanh toán.</p>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={`Mã QR: ${title}`}
          onError={() => setImgFailed(true)}
          className="mx-auto aspect-square w-full max-w-[220px] rounded-lg border border-border-default bg-bg-surface object-contain"
        />
      )}
      {hint && <p className="mt-3 text-xs leading-5 text-text-secondary">{hint}</p>}
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={copy} iconStart={done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}>
        {done ? 'Đã sao chép' : copyLabel}
      </Button>
    </div>
  );
}
