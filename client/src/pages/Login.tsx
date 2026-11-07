import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
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
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Đăng nhập SyncHub</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Đặt sân, lập phòng ghép kèo, gọi đồ FNB chung và chia bill tự động.
        </p>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-md border border-status-disputed/30 bg-bg-subtle p-3 text-xs font-medium text-status-disputed">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-text-secondary">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-text-secondary">Mật khẩu</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" iconStart={<LogIn className="size-4" aria-hidden />}>
            Đăng nhập
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-secondary">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </Card>

      {import.meta.env.DEV && (
        <Card className="space-y-2 bg-bg-subtle">
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
                className="rounded-md border border-border-default bg-bg-surface px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
