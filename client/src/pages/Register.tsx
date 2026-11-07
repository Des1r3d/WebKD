import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Card } from '../ui';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      nav('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold">Tạo tài khoản SyncHub</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tài khoản mới khởi tạo với 100 điểm uy tín (Hạng A — miễn đặt cọc).
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
            <label htmlFor="fullName" className="block text-xs font-semibold text-text-secondary">Họ và tên</label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-text-secondary">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sinhvien@synchub.vn"
              className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-text-secondary">Số điện thoại</label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-text-secondary">Mật khẩu (tối thiểu 6 ký tự)</label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full" iconStart={<UserPlus className="size-4" aria-hidden />}>
            Đăng ký
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-secondary">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
}
