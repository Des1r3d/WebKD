import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Copy, Check, QrCode } from 'lucide-react';
import { MoneyText } from './MoneyText';

export interface QRCardProps {
  type?: 'vietqr' | 'invite';
  qrUrl: string;
  title?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  amount?: number;
  transferContent?: string;
  inviteUrl?: string;
  className?: string;
}

export const QRCard: React.FC<QRCardProps> = ({
  type = 'vietqr',
  qrUrl,
  title,
  accountName,
  accountNumber,
  bankCode,
  amount,
  transferContent,
  inviteUrl,
  className,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-bg-surface border border-border-default rounded-xl p-5 shadow-sm flex flex-col items-center text-center max-w-sm mx-auto',
          className
        )
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        <QrCode className="w-3.5 h-3.5 text-primary" />
        {title || (type === 'vietqr' ? 'Thanh toán VietQR' : 'Quét QR vào phòng')}
      </div>

      {/* QR Display Container */}
      <div className="relative p-3 bg-white border border-border-default rounded-lg shadow-xs mb-4">
        {qrUrl && type === 'vietqr' && !imgError ? (
          <img
            src={qrUrl}
            alt="Mã QR"
            onError={() => setImgError(true)}
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
          />
        ) : (
          <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center bg-white p-2">
            <svg
              viewBox="0 0 29 29"
              className="w-full h-full text-slate-900"
              fill="currentColor"
              aria-label="Mã QR Mời Phòng"
            >
              {/* 3 Finder Patterns (7x7 corners) */}
              <path d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z" />
              <path d="M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z" />
              <path d="M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z" />
              {/* Alignment Pattern */}
              <path d="M20,20 h5 v5 h-5 z M21,21 v3 h3 v-3 z M22,22 h1 v1 h-1 z" />
              {/* Timing & Data Modules */}
              <path d="M8,0 h2 v2 h-2 z M12,0 h1 v3 h-1 z M15,1 h2 v2 h-2 z M19,0 h2 v1 h-2 z M6,8 h1 v1 h-1 z M6,10 h1 v1 h-1 z M6,12 h1 v1 h-1 z M6,14 h1 v1 h-1 z M6,16 h1 v1 h-1 z M6,18 h1 v1 h-1 z M8,6 h1 v1 h-1 z M10,6 h1 v1 h-1 z M12,6 h1 v1 h-1 z M14,6 h1 v1 h-1 z M16,6 h1 v1 h-1 z M18,6 h1 v1 h-1 z M9,8 h3 v2 h-3 z M14,8 h2 v3 h-2 z M18,8 h3 v2 h-3 z M8,12 h2 v3 h-2 z M12,11 h3 v3 h-3 z M16,12 h2 v2 h-2 z M20,10 h2 v3 h-2 z M24,9 h3 v2 h-3 z M2,9 h3 v2 h-3 z M0,13 h4 v2 h-4 z M3,17 h2 v3 h-2 z M9,16 h2 v3 h-2 z M13,16 h3 v2 h-3 z M17,15 h2 v3 h-2 z M23,14 h4 v2 h-4 z M26,17 h3 v2 h-3 z M9,21 h3 v2 h-3 z M13,20 h2 v4 h-2 z M17,22 h2 v2 h-2 z M9,25 h2 v3 h-2 z M13,26 h4 v2 h-4 z M19,26 h3 v3 h-3 z M26,23 h2 v4 h-2 z" />
            </svg>
            <span className="text-[10px] font-mono font-bold text-primary mt-1">
              SYNCHUB · {title?.split(': ').pop() || 'SYNC01'}
            </span>
          </div>
        )}
      </div>

      {/* VietQR Details */}
      {type === 'vietqr' && (
        <div className="w-full space-y-2 text-xs border-t border-border-default pt-3">
          {amount !== undefined && (
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Số tiền:</span>
              <MoneyText amount={amount} size="md" variant="primary" />
            </div>
          )}

          {bankCode && accountNumber && (
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Tài khoản:</span>
              <button
                onClick={() => copyToClipboard(accountNumber, 'acc')}
                className="inline-flex items-center gap-1 font-mono font-medium text-text-primary hover:text-primary transition-colors cursor-pointer"
              >
                <span>
                  {bankCode} · {accountNumber}
                </span>
                {copiedField === 'acc' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-text-muted" />
                )}
              </button>
            </div>
          )}

          {accountName && (
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Người thụ hưởng:</span>
              <span className="font-medium text-text-primary uppercase">{accountName}</span>
            </div>
          )}

          {transferContent && (
            <div className="flex justify-between items-center py-1">
              <span className="text-text-secondary">Nội dung:</span>
              <button
                onClick={() => copyToClipboard(transferContent, 'content')}
                className="inline-flex items-center gap-1 font-mono font-medium text-primary hover:underline cursor-pointer"
              >
                <span>{transferContent}</span>
                {copiedField === 'content' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-primary" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invite URL */}
      {type === 'invite' && inviteUrl && (
        <div className="w-full border-t border-border-default pt-3">
          <button
            onClick={() => copyToClipboard(inviteUrl, 'invite')}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-bg-subtle text-xs font-medium text-text-primary hover:bg-border-default transition-colors cursor-pointer"
          >
            {copiedField === 'invite' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã sao chép link mời!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-text-secondary" />
                <span>Sao chép link mời phòng</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
