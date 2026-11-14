const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const moneyFmt = new Intl.NumberFormat('vi-VN');
export const formatVnd = (amount) => `${amount < 0 ? '-' : ''}${moneyFmt.format(Math.abs(amount))} ₫`;
const gradeFor = (score) => score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'FLAGGED';

export const Button = ({ label, variant = 'primary', size = 'md', disabled = false, loading = false, icon = '', type = 'button', className = '', attrs = '' }) =>
  `<button type="${type}" class="btn btn-${variant} btn-${size} ${className}" ${disabled || loading ? 'disabled' : ''} ${loading ? 'aria-busy="true"' : ''} ${attrs}>${loading ? '<span class="spinner" aria-hidden="true"></span>' : icon}<span>${esc(label)}</span></button>`;
export const Card = (content, { interactive = false, className = '' } = {}) => `<div class="card ${interactive ? 'card-interactive' : ''} ${className}">${content}</div>`;
const badgeLabels = { AVAILABLE: ['Trống', 'available'], LOCKED: ['Đang giữ', 'locked'], BOOKED: ['Đã đặt', 'paid'], OPEN: ['Đang mở', 'open'], AWAITING_PAYMENT: ['Chờ thanh toán', 'awaiting'], PAID: ['Đã thanh toán', 'paid'], COMPLETED: ['Hoàn tất', 'completed'], CANCELLED: ['Đã hủy', 'cancelled'], DISPUTED: ['Khiếu nại', 'disputed'], A: ['Hạng A', 'rep-a'], B: ['Hạng B', 'rep-b'], C: ['Hạng C', 'rep-c'], FLAGGED: ['Cảnh báo', 'rep-flagged'] };
export const Badge = (kind) => { const [label, tone] = badgeLabels[kind] || [kind, '']; return `<span class="badge ${tone}">${esc(label)}</span>`; };
export const MoneyText = (amount, signed = false) => `<span class="money ${amount < 0 ? 'money-negative' : ''}">${amount > 0 && signed ? '+' : ''}${formatVnd(amount)}</span>`;
export const PageHeader = ({ title, description = '', actions = '' }) => `<header class="page-header"><div><h1>${esc(title)}</h1>${description ? `<p>${esc(description)}</p>` : ''}</div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`;
export const StatCard = ({ label, value, hint = '', tone = 'default', icon = '↗' }) => `<article class="stat-card"><div class="stat-top"><p>${esc(label)}</p><span class="stat-icon tone-${tone}" aria-hidden="true">${icon}</span></div><strong>${esc(value)}</strong>${hint ? `<small>${esc(hint)}</small>` : ''}</article>`;
export const EmptyState = ({ title, description, action = '' }) => `<section class="empty-state"><span class="empty-icon" aria-hidden="true">▤</span><strong>${esc(title)}</strong><p>${esc(description)}</p>${action}</section>`;
export const MemberAvatar = ({ name, score, host = false, src = '' }) => { const grade = score == null ? '' : gradeFor(score); return `<span class="avatar-wrap">${src ? `<img class="avatar" src="${esc(src)}" alt="${esc(name)}">` : `<span class="avatar" role="img" aria-label="${esc(name)}">${esc(name.trim().charAt(0).toUpperCase())}</span>`}${host ? '<span class="host-mark" title="Trưởng phòng" aria-label="Trưởng phòng">♛</span>' : ''}${grade ? `<span class="grade-mark grade-${grade.toLowerCase()}" title="${grade === 'FLAGGED' ? 'Cảnh báo uy tín' : `Hạng ${grade}`} · ${score}/100">${grade === 'FLAGGED' ? '!' : grade}</span>` : ''}</span>`; };
export const ChatBubble = ({ kind, text, name = '', time = '' }) => kind === 'system' ? `<p class="chat-system">${esc(text)}</p>` : `<div class="chat-row ${kind === 'me' ? 'chat-me' : ''}">${kind === 'other' && name ? MemberAvatar({ name }) : ''}<div class="chat-bubble ${kind === 'me' ? 'bubble-me' : ''}">${kind === 'other' && name ? `<strong>${esc(name)}</strong>` : ''}<p>${esc(text)}</p>${time ? `<small>${esc(time)}</small>` : ''}</div></div>`;
export const CartRow = ({ name, owner, unitPrice, qty, disabled = false }) => `<div class="cart-row"><span class="food-icon" aria-hidden="true">♨</span><div class="cart-info"><strong>${esc(name)}</strong><small>${esc(owner)}</small>${MoneyText(unitPrice)}</div><div class="qty-control"><button type="button" aria-label="Giảm ${esc(name)}" ${disabled ? 'disabled' : ''} data-qty="-">−</button><span aria-live="polite">${qty}</span><button type="button" aria-label="Tăng ${esc(name)}" ${disabled ? 'disabled' : ''} data-qty="+">+</button></div></div>`;
export const QRCard = ({ title, imageUrl, copyText, copyLabel = 'Sao chép', hint = '' }) => `<section class="qr-card"><h3>${esc(title)}</h3><img src="${esc(imageUrl)}" alt="Mã QR: ${esc(title)}" data-qr><p class="qr-fallback" hidden>Không tải được ảnh mã QR. Dùng liên kết bên dưới để mời hoặc thanh toán.</p>${hint ? `<p class="qr-hint">${esc(hint)}</p>` : ''}<button class="btn btn-outline btn-sm copy-btn" type="button" data-copy="${esc(copyText)}">${esc(copyLabel)}</button></section>`;

export const createCountdown = (until) => {
  const end = new Date(until).getTime();
  const node = document.createElement('span'); node.className = 'countdown'; node.setAttribute('role', 'timer');
  let timer;
  const tick = () => { const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000)); node.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; node.classList.toggle('countdown-warning', seconds < 180 && seconds >= 60); node.classList.toggle('countdown-critical', seconds < 60); if (seconds === 0) clearInterval(timer); };
  tick(); timer = setInterval(tick, 1000); return node;
};

export const createModal = ({ title, content, close }) => {
  const previous = document.activeElement;
  const backdrop = document.createElement('div'); backdrop.className = 'modal-backdrop'; backdrop.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1"><header><h2 id="modal-title">${esc(title)}</h2><button class="icon-button" type="button" aria-label="Đóng" data-close>×</button></header><div class="modal-content">${content}</div></section>`;
  const modal = backdrop.querySelector('.modal');
  const focusable = () => [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  const onKey = (event) => { if (event.key === 'Escape') { event.preventDefault(); destroy(); } if (event.key === 'Tab') { const items = focusable(); if (!items.length) { event.preventDefault(); modal.focus(); return; } const first = items[0], last = items.at(-1); if (!modal.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); } else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } };
  const destroy = () => { document.removeEventListener('keydown', onKey); backdrop.remove(); previous?.focus?.(); close?.(); };
  backdrop.addEventListener('click', (event) => { if (event.target === backdrop || event.target.closest('[data-close]')) destroy(); }); document.addEventListener('keydown', onKey); document.body.append(backdrop); (focusable()[0] || modal).focus(); return destroy;
};
