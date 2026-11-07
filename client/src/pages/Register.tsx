import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Sparkles, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { Button, Card } from '../ui';

const VALUE_POINTS = [
  { icon: Sparkles, title: 'Khởi tạo 100 điểm', text: 'Tài khoản mới vào thẳng Hạng A — miễn đặt cọc.' },
  { icon: Users, title: 'Ghép kèo cùng bạn học', text: 'Mở phòng, chia sẻ mã mời và chốt sĩ số nhanh.' },
  { icon: BadgeCheck, title: 'Uy tín minh bạch', text: 'Check-in đúng giờ cộng điểm, bùng kèo trừ điểm.' },
];

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
    <div className="grid gap-6 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-10 lg:py-6">
      <div className="min-w-0 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Bắt đầu trong 1 phút</p>
          <h1 className="mt-1 text-2xl font-bold leading-8 sm:text-[28px] sm:leading-9">Tạo tài khoản SyncHub</h1>
          <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">
            Tài khoản mới khởi tạo với 100 điểm uy tín (Hạng A — miễn đặt cọc khi vào phòng ghép kèo).
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
              <label htmlFor="fullName" className="block text-xs font-semibold text-text-secondary">Họ và tên</label>
              <input
                id="fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="mt-1.5 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-text-secondary">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sinhvien@synchub.vn"
                  className="mt-1.5 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-text-secondary">Số điện thoại</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="mt-1.5 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-text-secondary">Mật khẩu (tối thiểu 6 ký tự)</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" iconStart={<UserPlus className="size-4" aria-hidden />}>
              Đăng ký
            </Button>
          </form>

          <p className="mt-4 border-t border-border-default pt-4 text-center text-xs text-text-secondary">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </Card>
      </div>

      <aside className="relative order-first min-h-[240px] overflow-hidden rounded-xl border border-border-default lg:order-last lg:min-h-full">
        <img src="/images/study-room.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <span aria-hidden className="absolute inset-0 bg-scrim" />
        <div className="relative flex h-full flex-col justify-between gap-6 p-5 text-text-inverted sm:p-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-bg-surface px-3 py-1 text-xs font-bold text-primary">
              Tham gia cộng đồng SyncHub
            </span>
            <p className="mt-3 max-w-xs text-lg font-semibold leading-7">
              Học nhóm, chơi thể thao, gọi đồ ăn — tất cả trong một phòng.
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

          <p className="text-[10px] text-text-inverted opacity-70">Ảnh: Libr · Wikimedia Commons (CC BY 3.0)</p>
        </div>
      </aside>
    </div>
  );
}
