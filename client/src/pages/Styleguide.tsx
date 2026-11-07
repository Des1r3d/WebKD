import { useState } from 'react';
import { Calendar, Plus, Wallet } from 'lucide-react';
import { Badge, Button, Card, ChatBubble, CartRow, Countdown, EmptyState, MemberAvatar, Modal, MoneyText, PageHeader, QRCard, StatCard, type BadgeKind } from '../ui';

const QR_DEMO = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h3v3H0zM7 0h3v3H7zM0 7h3v3H0zM4 4h2v2H4z"/></svg>')}`;
const badges: BadgeKind[] = ['AVAILABLE', 'LOCKED', 'BOOKED', 'OPEN', 'AWAITING_PAYMENT', 'PAID', 'COMPLETED', 'A', 'B', 'C', 'FLAGGED'];
const colors = ['primary', 'primary-hover', 'primary-light', 'accent', 'accent-light', 'bg-app', 'bg-surface', 'bg-subtle', 'border-default', 'border-strong', 'text-primary', 'text-secondary', 'text-muted'];
const solid: Record<string, string> = {
  primary: 'bg-primary', 'primary-hover': 'bg-primary-hover', 'primary-light': 'bg-primary-light', accent: 'bg-accent', 'accent-light': 'bg-accent-light',
  'bg-app': 'bg-bg-app', 'bg-surface': 'bg-bg-surface', 'bg-subtle': 'bg-bg-subtle', 'border-default': 'bg-border-default', 'border-strong': 'bg-border-strong',
  'text-primary': 'bg-text-primary', 'text-secondary': 'bg-text-secondary', 'text-muted': 'bg-text-muted',
};

const S = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <section className="space-y-3"><h2 className="text-xl font-semibold">{t}</h2>{children}</section>
);

export default function Styleguide() {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [until10] = useState(() => Date.now() + 10 * 60_000);
  const [until2] = useState(() => Date.now() + 150_000);
  const [until45] = useState(() => Date.now() + 45_000);
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <h1 className="text-[32px] font-bold leading-10">Styleguide</h1>
      <S t="Tokens">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(0,7rem))] gap-2">
          {colors.map((c) => (
            <div key={c} className="text-xs"><div className={`h-10 rounded-md border border-border-default ${solid[c]}`} />{c}</div>
          ))}
        </div>
      </S>
      <S t="Button">
        <div className="flex flex-wrap items-center gap-2">
          {(['primary', 'secondary', 'outline', 'danger', 'ghost'] as const).map((v) => <Button key={v} variant={v}>{v}</Button>)}
          <Button size="sm">sm</Button><Button size="lg" iconStart={<Plus className="size-4" aria-hidden />}>lg</Button>
          <Button loading>Loading</Button><Button disabled>Disabled</Button>
        </div>
      </S>
      <S t="PageHeader">
        <PageHeader title="Tiêu đề trang" description="Mô tả phụ cho bối cảnh trang" actions={<Button size="sm">Hành động</Button>} />
      </S>
      <S t="StatCard">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Tổng số dư ví" value="250.000 ₫" icon={<Wallet className="size-5" />} tone="warning" />
          <StatCard label="Kèo sắp tới" value={3} icon={<Calendar className="size-5" />} tone="default" />
        </div>
      </S>
      <S t="EmptyState">
        <EmptyState title="Không có dữ liệu" description="Thử làm mới hoặc thay đổi bộ lọc tìm kiếm." />
      </S>
      <S t="Card"><div className="grid gap-3 sm:grid-cols-2"><Card>Card</Card><Card interactive>Interactive</Card></div></S>
      <S t="Badge"><div className="flex flex-wrap gap-2">{badges.map((b) => <Badge key={b} kind={b} />)}</div></S>
      <S t="Modal"><Button onClick={() => setOpen(true)}>Open</Button><Modal open={open} onClose={() => setOpen(false)} title="Modal"><p className="text-sm text-text-secondary">ESC hoặc click ngoài để đóng.</p></Modal></S>
      <S t="Countdown"><div className="flex gap-4 text-xl"><Countdown until={until10} /><Countdown until={until2} /><Countdown until={until45} /></div></S>
      <S t="MemberAvatar"><div className="flex gap-6 pb-3"><MemberAvatar name="An" host score={95} /><MemberAvatar name="Bình" score={75} /><MemberAvatar name="Chi" score={55} /><MemberAvatar name="Dũng" score={20} /></div></S>
      <S t="MoneyText"><div className="flex flex-col items-end"><MoneyText amount={120000} /><MoneyText amount={-15000} /><MoneyText amount={215000} signed /></div></S>
      <S t="CartRow"><Card><CartRow name="Trà sữa" owner="An" unitPrice={35000} qty={qty} onInc={() => setQty(qty + 1)} onDec={() => setQty(Math.max(0, qty - 1))} /><CartRow name="Cà phê" owner="Bình" unitPrice={29000} qty={2} disabled /></Card></S>
      <S t="ChatBubble"><Card><ChatBubble kind="system" text="Phòng đã được mở" /><ChatBubble kind="other" name="An" text="Mấy giờ đá?" time="19:00" /><ChatBubble kind="me" text="7 giờ nhé" time="19:01" /></Card></S>
      <S t="QRCard"><QRCard title="Thanh toán VietQR" imageUrl={QR_DEMO} copyText="0123456789" copyLabel="Sao chép STK" hint="Quét mã để thanh toán phần của bạn." /></S>
    </div>
  );
}

