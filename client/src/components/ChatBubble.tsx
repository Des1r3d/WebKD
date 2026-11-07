import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MemberAvatar } from './MemberAvatar';

export interface ChatBubbleProps {
  id?: string;
  content: string;
  senderName: string;
  senderAvatar?: string;
  timestamp?: string | Date;
  isMine?: boolean;
  isSystem?: boolean;
  className?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  senderName,
  senderAvatar,
  timestamp,
  isMine = false,
  isSystem = false,
  className,
}) => {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // System Message (Announcements, slot locked, bill ready)
  if (isSystem) {
    return (
      <div className={twMerge(clsx('flex justify-center my-2 text-center', className))}>
        <div className="bg-bg-subtle text-text-secondary text-[11px] px-3 py-1 rounded-full border border-border-default max-w-xs sm:max-w-md">
          <span>{content}</span>
          {formattedTime && <span className="ml-1.5 opacity-60">· {formattedTime}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        clsx(
          'flex items-end gap-2 my-2 group',
          isMine ? 'justify-end' : 'justify-start',
          className
        )
      )}
    >
      {/* Sender Avatar (Only for teammate messages) */}
      {!isMine && (
        <MemberAvatar
          name={senderName}
          imageUrl={senderAvatar}
          size="sm"
          showBadge={false}
          className="flex-shrink-0 mb-0.5"
        />
      )}

      {/* Bubble Container */}
      <div className={clsx('flex flex-col max-w-[78%] sm:max-w-[70%]', isMine ? 'items-end' : 'items-start')}>
        {!isMine && (
          <span className="text-[11px] text-text-secondary mb-1 ml-1 font-medium">
            {senderName}
          </span>
        )}

        <div
          className={clsx(
            'px-3.5 py-2 rounded-xl text-xs sm:text-sm break-words shadow-xs leading-relaxed',
            isMine
              ? 'bg-primary text-text-inverted rounded-br-xs'
              : 'bg-bg-surface text-text-primary border border-border-default rounded-bl-xs'
          )}
        >
          {content}
        </div>

        {formattedTime && (
          <span className="text-[10px] text-text-muted mt-1 px-1">
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
};
