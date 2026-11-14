import { Badge, Button, Card, CartRow, ChatBubble, createCountdown, createModal, EmptyState, formatVnd, MemberAvatar, MoneyText, LobbyIcon, PageHeader, QRCard, StatCard } from './components.js';
import { beginPage, mountBusiness, renderBusiness } from './pages.js';

const KEY = 'synchub.token';
const roles = { HOST: 'Trưởng phòng', MEMBER: 'Thành viên', PROVIDER: 'Đối tác', ADMIN: 'Quản trị viên' };
const homeFor = (role) => role === 'PROVIDER' ? '/provider' : role === 'ADMIN' ? '/admin' : '/';
const store = {
  token: () => localStorage.getItem(KEY),
  setToken: (token) => localStorage.setItem(KEY, token),
  clear: () => localStorage.removeItem(KEY),
  user: null,
};
const app = document.querySelector('#app');
let cleanups = [];
let renderEpoch = 0;
const cleanup = () => { cleanups.forEach((fn) => fn()); cleanups = []; };
const navigate = (to, { replace = false, state = {} } = {}) => { history[replace ? 'replaceState' : 'pushState'](state, '', to); render(); window.scrollTo(0, 0); };
const link = (to, label, active = false) => `<a href="${to}" data-link class="nav-link ${active ? 'active' : ''}"><span class="nav-dot" aria-hidden="true"></span>${label}</a>`;
const lobbyNavIcons = {'/': 'Compass', '/wallet': 'Wallet', '/disputes': 'ShieldAlert', '/profile': 'UserRound'};
const routeLabel = (path) => path.startsWith('/login') ? 'Đăng nhập' : path.startsWith('/register') ? 'Đăng ký' : path.startsWith('/venues') ? 'Chi tiết sân' : path.startsWith('/lobby') ? 'Phòng ghép kèo' : path.startsWith('/join') ? 'Lời mời phòng' : path.startsWith('/wallet') ? 'Ví & Escrow' : path.startsWith('/disputes') ? 'Khiếu nại' : path.startsWith('/profile') ? 'Hồ sơ' : path.startsWith('/provider') ? 'Portal đối tác' : path.startsWith('/admin') ? 'Quản trị' : path === '/styleguide' ? 'Styleguide' : 'Khám phá';
const qrDemo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21"><rect width="21" height="21" fill="white"/><path fill="#0f172a" d="M0 0h7v7H0zM14 0h7v7h-7zM0 14h7v7H0zM9 2h2v2H9zM9 6h2v3H9zM8 11h3v2H8zM13 9h2v2h-2zM17 9h4v2h-4zM12 13h3v2h-3zM9 16h2v5H9zM13 17h2v4h-2zM17 14h4v2h-4zM17 18h4v3h-4z"/><path fill="white" d="M2 2h3v3H2zM16 2h3v3h-3zM2 16h3v3H2z"/></svg>')}`;

async function hydrateAuth() {
  if (!store.token()) return;
  try { const result = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${store.token()}` } }); if (!result.ok) throw Error('unauthorized'); const body = await result.json(); store.user = body.user || body; }
  catch { store.clear(); store.user = null; }
}

function shell(content, layout) {
  const user = store.user;
  const nav = layout === 'admin' ? [['/admin', 'Quản trị']] : layout === 'provider' ? [['/provider', 'Portal đối tác']] : user ? [['/', 'Khám phá'], ['/wallet', 'Ví & Escrow'], ['/disputes', 'Khiếu nại'], ['/profile', 'Hồ sơ']] : [['/', 'Khám phá']];
  const path = location.pathname;
  const navHtml = nav.map(([to, label]) => link(to, label, to === '/' ? path === '/' || path === '/discover' : path === to || path.startsWith(`${to}/`))).join('');
  const account = user ? `<div class="user-panel">${MemberAvatar({ name: user.full_name || 'SyncHub', score: user.reputation_score ?? 100 })}<div><strong>${escapeHtml(user.full_name || 'SyncHub')}</strong><small>${roles[user.role] || ''} · Hạng ${user.reputation_score >= 90 ? 'A' : user.reputation_score >= 70 ? 'B' : user.reputation_score >= 50 ? 'C' : '!'}</small></div></div>` : `<div class="auth-actions">${link('/login', 'Đăng nhập')}${link('/register', 'Đăng ký')}</div>`;
  const extra = user && ['HOST', 'MEMBER'].includes(user.role) ? '' : '';
  const authTop = user ? `<span class="top-avatar">${escapeHtml((user.full_name || 'S').charAt(0))}</span>` : `<a class="btn btn-primary btn-sm auth-top-link" href="${path==='/register'?'/register':'/login'}" data-link>${path==='/register'?'Đăng ký':'Đăng nhập'}</a>`;
  return `<div class="app-shell layout-${layout}"><aside class="sidebar"><a class="brand" href="/" data-link><span class="brand-mark">S</span><span><strong>SyncHub</strong><small>Đặt sân & gọi đồ nhóm</small></span></a><p class="nav-caption">Điều hướng</p><nav aria-label="Điều hướng chính">${navHtml}${extra}</nav>${user ? `<button class="logout-link" type="button" data-logout>↪ Đăng xuất</button>` : ''}<div class="sidebar-bottom">${account}<span class="sidebar-foot">SyncHub · Làng Đại Học Thủ Đức</span></div></aside><div class="shell-main"><header class="topbar"><button class="icon-button mobile-menu" type="button" aria-label="Mở điều hướng" data-menu>☰</button><div class="breadcrumbs"><a href="/" data-link>SyncHub</a><span>/</span><span>${routeLabel(path)}</span></div><time class="today">${new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' }).format(new Date())}</time>${authTop}</header><main id="main-content" tabindex="-1">${content}</main><nav class="bottom-nav" aria-label="Điều hướng di động">${nav.slice(0, 4).map(([to, label]) => (path.startsWith('/lobby/') && lobbyNavIcons[to] ? `<a href="${to}" data-link class="nav-link">${LobbyIcon(lobbyNavIcons[to])}${label}</a>` : link(to, label, path === to))).join('')}</nav></div></div>`;
}
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function styleguide() {
  const colors = ['primary', 'primary-hover', 'primary-light', 'accent', 'accent-light', 'bg-app', 'bg-surface', 'bg-subtle', 'border-default', 'border-strong', 'text-primary', 'text-secondary', 'text-muted'];
  const swatches = colors.map((name) => `<div class="swatch"><span class="swatch-color swatch-${name}"></span>${name}</div>`).join('');
  const buttons = ['primary', 'secondary', 'outline', 'danger', 'ghost'].map((variant) => Button({ label: variant, variant })).join('');
  const main = `<div class="styleguide-page">${PageHeader({ title: 'Styleguide', description: 'Thành phần giao diện SyncHub · Emerald Pulse' })}<section class="demo-section"><h2>Tokens</h2><div class="swatches">${swatches}</div><div class="type-demo"><span>Plus Jakarta Sans · Aa 123</span><span class="money">JetBrains Mono · 123.456 ₫</span></div></section><section class="demo-section"><h2>Button</h2><div class="demo-row">${buttons}${Button({ label: 'sm', size: 'sm' })}${Button({ label: 'lg', size: 'lg' })}${Button({ label: 'Loading', loading: true })}${Button({ label: 'Disabled', disabled: true })}</div></section><section class="demo-section"><h2>PageHeader</h2>${Card(PageHeader({ title: 'Tiêu đề trang', description: 'Mô tả phụ cho bối cảnh trang', actions: Button({ label: 'Hành động', size: 'sm' }) }))}</section><section class="demo-section"><h2>StatCard</h2><div class="demo-grid">${StatCard({ label: 'Tổng số dư ví', value: '250.000 ₫', tone: 'warning', icon: '₫' })}${StatCard({ label: 'Kèo sắp tới', value: '3', tone: 'positive', icon: '◷' })}</div></section><section class="demo-section"><h2>EmptyState</h2>${EmptyState({ title: 'Không có dữ liệu', description: 'Thử làm mới hoặc thay đổi bộ lọc tìm kiếm.' })}</section><section class="demo-section"><h2>Card</h2><div class="demo-grid">${Card('Card')}${Card('Interactive', { interactive: true })}</div></section><section class="demo-section"><h2>Badge</h2><div class="demo-row">${['AVAILABLE', 'LOCKED', 'BOOKED', 'OPEN', 'AWAITING_PAYMENT', 'PAID', 'COMPLETED', 'A', 'B', 'C', 'FLAGGED'].map(Badge).join('')}</div></section><section class="demo-section"><h2>Modal</h2><button class="btn btn-primary btn-md" data-open-modal>Open</button></section><section class="demo-section"><h2>Countdown</h2><div class="demo-row countdown-examples" data-countdowns></div></section><section class="demo-section"><h2>MemberAvatar</h2><div class="demo-row avatar-examples">${MemberAvatar({ name: 'An', host: true, score: 95 })}${MemberAvatar({ name: 'Bình', score: 75 })}${MemberAvatar({ name: 'Chi', score: 55 })}${MemberAvatar({ name: 'Dũng', score: 20 })}</div></section><section class="demo-section"><h2>MoneyText</h2><div class="money-examples">${MoneyText(120000)}${MoneyText(-15000)}${MoneyText(215000, true)}</div></section><section class="demo-section"><h2>CartRow</h2>${Card(CartRow({ name: 'Trà sữa', owner: 'An', unitPrice: 35000, qty: 1 }) + CartRow({ name: 'Cà phê', owner: 'Bình', unitPrice: 29000, qty: 2, disabled: true }))}</section><section class="demo-section"><h2>ChatBubble</h2>${Card(ChatBubble({ kind: 'system', text: 'Phòng đã được mở' }) + ChatBubble({ kind: 'other', name: 'An', text: 'Mấy giờ đá?', time: '19:00' }) + ChatBubble({ kind: 'me', text: '7 giờ nhé', time: '19:01' }))}</section><section class="demo-section"><h2>QRCard</h2>${QRCard({ title: 'Thanh toán VietQR', imageUrl: qrDemo, copyText: '0123456789', copyLabel: 'Sao chép STK', hint: 'Quét mã để thanh toán phần của bạn.' })}</section></div>`;
  return shell(main, 'public');
}

function shellPreview(layout) {
  const title = layout === 'member' ? 'Member layout' : layout === 'provider' ? 'Provider layout' : layout === 'admin' ? 'Admin layout' : 'Public layout';
  const body = `<div class="preview-page">${PageHeader({ title, description: 'Khung layout Giai đoạn 2 · Nội dung nghiệp vụ được chuyển ở Giai đoạn 3' })}<div class="demo-grid">${StatCard({ label: 'Shell', value: layout, hint: 'Navigation và vùng nội dung', icon: '⌂' })}${StatCard({ label: 'Viewport', value: `${innerWidth} × ${innerHeight}`, hint: 'Responsive theo baseline', tone: 'positive', icon: '□' })}</div>${Card(`<h2>Deep link: ${escapeHtml(location.pathname)}</h2><p class="text-secondary">URL này được router History API xử lý và có thể tải lại trực tiếp.</p><div class="demo-row">${link('/', 'Public')}${link('/wallet', 'Member')}${link('/provider', 'Provider')}${link('/admin', 'Admin')}</div>`)}</div>`;
  return shell(body, layout);
}

function authPage(register = false) {
  const title = register ? 'Tạo tài khoản SyncHub' : 'Đăng nhập SyncHub';
  const seedUsers = [['Host Hạng A (98đ)','dat.dt@synchub.vn'],['Member Hạng B (82đ, cọc 30%)','minh.b@synchub.vn'],['Member Hạng C (64đ, cọc 100%)','linh.c@synchub.vn'],['Member FLAGGED (42đ, bị chặn)','hung.flag@synchub.vn'],['Provider (Chủ sân)','thang.venue@synchub.vn'],['Admin hệ thống','admin@synchub.vn']];
  const heroImage = register ? '/images/study-room.jpg' : '/images/badminton.jpg';
  const points = register ? [['Khởi tạo 100 điểm','Tài khoản mới vào thẳng Hạng A — miễn đặt cọc.'],['Ghép kèo cùng bạn học','Mở phòng, chia sẻ mã mời và chốt sĩ số nhanh.'],['Uy tín minh bạch','Check-in đúng giờ cộng điểm, bùng kèo trừ điểm.']] : [['Khoá slot 10 phút','Giữ chỗ tức thì, hết hạn tự nhả cho người khác.'],['Chia bill tự động','Largest Remainder — không lệch một đồng nào.'],['Escrow bảo vệ cọc','Tiền chỉ giải ngân khi buổi chơi hoàn tất.']];
  const hero = `<aside class="auth-cover" style="--auth-cover:url('${heroImage}')"><span class="auth-brand-pill">${register?'Tham gia cộng đồng SyncHub':'SyncHub · Làng Đại Học Thủ Đức'}</span><p class="auth-cover-lead">${register?'Học nhóm, chơi thể thao, gọi đồ ăn — tất cả trong một phòng.':'Một buổi chơi trọn vẹn — từ giữ sân đến chia tiền.'}</p><ul>${points.map(([label,desc],i)=>`<li><span aria-hidden="true">${['◷','▤','✓'][i]}</span><div><b>${label}</b><small>${desc}</small></div></li>`).join('')}</ul><small class="auth-credit">Ảnh: ${register?'Libr · Wikimedia Commons (CC BY 3.0)':'Itsn4kul10 · Wikimedia Commons (CC BY-SA 4.0)'}</small></aside>`;
  const seedPanel = !register ? `<div class="seed-accounts"><p>Tài khoản seed kiểm thử (điền vào form, vẫn xác thực qua /api/auth/login):</p>${seedUsers.map(([label,email])=>`<button type="button" data-seed-email="${email}">${label}</button>`).join('')}</div>` : '';
  const form = `<section class="auth-page">${hero}<div class="auth-column"><div class="auth-copy"><span class="eyebrow">${register ? 'BẮT ĐẦU TRONG 1 PHÚT' : 'CHÀO MỪNG TRỞ LẠI'}</span><h1>${title}</h1><p>${register?'Tài khoản mới khởi tạo với 100 điểm uy tín (Hạng A — miễn đặt cọc khi vào phòng ghép kèo).':'Đặt sân, lập phòng ghép kèo, gọi đồ FNB chung và chia bill tự động cùng nhóm của bạn.'}</p></div><form class="auth-form card" data-auth-form data-register="${register}"><label>Email<input name="email" type="email" autocomplete="email" value="${register?'':'dat.dt@synchub.vn'}" required></label>${register ? '<label>Họ và tên<input name="full_name" autocomplete="name" required></label><label>Số điện thoại<input name="phone" autocomplete="tel" required></label>' : ''}<label>${register?'Mật khẩu (tối thiểu 6 ký tự)':'Mật khẩu'}<input name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" value="${register?'':'Password123!'}" required ${register?'minlength="6"':''}></label><p class="form-error" role="alert" hidden></p><button class="btn btn-primary btn-md btn-block" type="submit">${register ? 'Đăng ký' : 'Đăng nhập'}</button><p class="auth-switch">${register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} <a href="${register ? '/login' : '/register'}" data-link>${register ? 'Đăng nhập' : 'Đăng ký ngay'}</a></p></form>${seedPanel}</div></section>`;
  return shell(form, 'public');
}

function layoutFor(path) { if (path.startsWith('/provider')) return 'provider'; if (path.startsWith('/admin')) return 'admin'; if (/^\/(wallet|disputes|profile|lobby)(\/|$)/.test(path)) return 'member'; return 'public'; }
async function render() {
  const thisRender = ++renderEpoch;
  cleanup();
  let path = location.pathname;
  if (path === '/join' || path === '/join/') { navigate('/', { replace: true }); return; }
  if (path !== '/' && !['/styleguide', '/login', '/register', '/discover', '/wallet', '/disputes', '/profile'].includes(path) && !/^\/(venues|join|lobby|provider|admin)(\/|$)/.test(path)) { navigate('/', { replace: true }); return; }
  const guarded = /^\/(wallet|disputes|profile|lobby|provider|admin)(\/|$)/.test(path);
  if (guarded && !store.user && store.token()) { await hydrateAuth(); path = location.pathname; }
  if (guarded && !store.user) { history.replaceState({ from: path }, '', `/login`); path = '/login'; }
  const layout = layoutFor(path);
  if (path.startsWith('/provider') && store.user?.role && store.user.role !== 'PROVIDER') { navigate(homeFor(store.user.role), { replace: true }); return; }
  if (path.startsWith('/admin') && store.user?.role && store.user.role !== 'ADMIN') { navigate(homeFor(store.user.role), { replace: true }); return; }
  const memberOnly = /^\/(wallet|disputes|profile|lobby)(\/|$)/.test(path);
  if (memberOnly && store.user && !['HOST', 'MEMBER'].includes(store.user.role)) { navigate(homeFor(store.user.role), { replace: true }); return; }
  if (path === '/styleguide') app.innerHTML = styleguide();
  else if (path === '/login' || path === '/register') app.innerHTML = authPage(path === '/register');
  else {
    cleanups.push(beginPage());
    app.innerHTML = shell('<p role="status" class="business-card">Đang tải dữ liệu…</p>', layout);
    const content = await renderBusiness(path, store.user);
    if (thisRender !== renderEpoch) return;
    app.innerHTML = shell(content, layout);
    cleanups.push(mountBusiness(path, store.user, navigate));
  }
  bindInteractions();
}

function bindInteractions() {
  document.querySelectorAll('[data-link]').forEach((anchor) => anchor.addEventListener('click', (event) => { if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); navigate(anchor.getAttribute('href')); }));
  document.querySelector('[data-open-modal]')?.addEventListener('click', () => createModal({ title: 'Modal', content: '<p class="text-secondary">ESC, click vào nền hoặc nút đóng để thoát. Tab và Shift+Tab giữ focus bên trong hộp thoại.</p><button class="btn btn-outline btn-md" type="button">Nút trong modal</button>' }));
  document.querySelectorAll('[data-qr]').forEach((image) => image.addEventListener('error', () => { image.hidden = true; image.nextElementSibling.hidden = false; }));
  document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = 'Đã sao chép'; setTimeout(() => { button.textContent = button.dataset.copy === '0123456789' ? 'Sao chép STK' : 'Sao chép'; }, 2000); } catch { button.textContent = 'Không thể sao chép'; } }));
  const countdowns = document.querySelector('[data-countdowns]'); if (countdowns) { [600, 150, 45].forEach((seconds) => countdowns.append(createCountdown(Date.now() + seconds * 1000))); }
  document.querySelectorAll('[data-qty]').forEach((button) => button.addEventListener('click', () => { const value = button.parentElement.querySelector('span'); value.textContent = Math.max(0, Number(value.textContent) + (button.dataset.qty === '+' ? 1 : -1)); }));
  document.querySelector('[data-logout]')?.addEventListener('click', () => { store.clear(); store.user = null; navigate('/'); });
  document.querySelector('[data-menu]')?.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('sidebar-open'));
  document.querySelectorAll('[data-seed-email]').forEach((button) => button.addEventListener('click', () => { const form = document.querySelector('[data-auth-form]'); form.elements.email.value = button.dataset.seedEmail; form.elements.password.value = 'Password123!'; }));
  document.querySelector('[data-auth-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget, error = form.querySelector('.form-error'), data = Object.fromEntries(new FormData(form)); error.hidden = true;
    try { const response = await fetch(`/api/auth/${form.dataset.register === 'true' ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || result.error || 'Không thể xác thực'); store.setToken(result.token); store.user = result.user; const next = history.state?.from || homeFor(store.user.role); navigate(next, { replace: true }); }
    catch (cause) { error.textContent = cause.message; error.hidden = false; }
  });
}

window.addEventListener('popstate', render);
await hydrateAuth();
await render();
