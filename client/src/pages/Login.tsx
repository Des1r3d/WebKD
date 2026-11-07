import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, ReceiptText, ShieldCheck, Timer } from 'lucide-react';
import { homeFor, useAuth } from '../lib/auth';
import { Button, Card } from '../ui';

const SEED_ACCOUNTS = [
  { label: 'Host Hạng A (98đ)', email: 'dat.dt@synchub.vn' },
  { label: 'Member Hạng B (82đ, cọc 30%)', email: 'minh.b@synchub.vn' },
  { label: 'Member Hạng C (64đ, cọc 100%)', email: 'linh.c@synchub.vn' },
  { label: 'Member FLAGGED (42đ, bị chặn)', email: 'hung.flag@synchub.vn' },
  { label: 'Provider (Chủ sân)', email: 'thang.venue@synchub.vn' },
  { label: 'Admin hệ thống', email: 'admin@synchub.vn' },
];

const VALUE_POINTS = [
  { icon: Timer, title: 'Khoá slot 10 phút', text: 'Giữ chỗ tức thì, hết hạn tự nhả cho người khác.' },
  { icon: ReceiptText, title: 'Chia bill tự động', text: 'Largest Remainder — không lệch một đồng nào.' },
  { icon: ShieldCheck, title: 'Escrow bảo vệ cọc', text: 'Tiền chỉ giải ngân khi buổi chơi hoàn tất.' },
];

export default function Login() {
  const { login, role } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('dat.dt@synchub.vn');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      const from = (loc.state as { from?: string } | null)?.from;
      nav(from || homeFor(role), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10 lg:py-6">
      <div className="min-w-0 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Chào mừng trở lại</p>
          <h1 className="mt-1 text-2xl font-bold leading-8 sm:text-[28px] sm:leading-9">Đăng nhập SyncHub</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">
            Đặt sân, lập phòng ghép kèo, gọi đồ FNB chung và chia bill tự động cùng nhóm của bạn.
          </p>
        </div>

        <Card className="p-5 sm:p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-md border border-status-disputed bg-bg-subtle p-3 text-xs font-medium text-status-disputed">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-text-secondary">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary">Mật khẩu</label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" iconStart={<LogIn className="size-4" aria-hidden />}>
              Đăng nhập
            </Button>
          </form>

          <p className="mt-4 border-t border-border-default pt-4 text-center text-xs text-text-secondary">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </Card>

        {import.meta.env.DEV && (
          <Card className="space-y-2.5 bg-bg-subtle">
            <p className="text-xs font-semibold text-text-secondary">
              Tài khoản seed kiểm thử (điền vào form, vẫn xác thực qua /api/auth/login):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SEED_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Password123!');
                  }}
                  className="rounded-md border border-border-default bg-bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      <aside className="relative order-first min-h-[240px] overflow-hidden rounded-xl border border-border-default lg:order-last lg:min-h-full">
        <img src="/images/badminton.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <span aria-hidden className="absolute inset-0 bg-scrim" />
        <div className="relative flex h-full flex-col justify-between gap-6 p-5 text-text-inverted sm:p-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-bg-surface px-3 py-1 text-xs font-bold text-primary">
              SyncHub · Làng Đại Học Thủ Đức
            </span>
            <p className="mt-3 max-w-xs text-lg font-semibold leading-7">
              Một buổi chơi trọn vẹn — từ giữ sân đến chia tiền.
            </p>
          </div>

          <ul className="space-y-3">
            {VALUE_POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-2.5">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-bg-surface text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{title}</span>
                  <span className="block text-[11px] leading-4 text-text-inverted opacity-80">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="text-[10px] text-text-inverted opacity-70">Ảnh: Itsn4kul10 · Wikimedia Commons (CC BY-SA 4.0)</p>
        </div>
      </aside>
    </div>
  );
}
