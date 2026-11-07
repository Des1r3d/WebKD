import { MemberAvatar } from './MemberAvatar';
import { cn } from './cn';

interface Props { kind: 'me' | 'other' | 'system'; text: string; name?: string; time?: string }

export function ChatBubble({ kind, text, name, time }: Props) {
  if (kind === 'system')
    return <p className="mx-auto my-2 w-fit rounded-full border border-border-default px-3 py-1 text-xs font-medium text-text-muted">{text}</p>;
  const me = kind === 'me';
  return (
    <div className={cn('my-1 flex items-end gap-2', me && 'flex-row-reverse')}>
      {!me && name && <MemberAvatar name={name} className="[&>*]:size-7" />}
      <div className={cn('max-w-[75%] rounded-lg px-3 py-2 text-sm', me ? 'bg-primary-light text-text-primary' : 'bg-bg-subtle text-text-primary')}>
        {!me && name && <p className="text-xs font-medium text-text-secondary">{name}</p>}
        <p className="break-words">{text}</p>
        {time && <p className="mt-0.5 text-right text-xs text-text-muted">{time}</p>}
      </div>
    </div>
  );
}
