import { Badge, Button, Card, EmptyState, formatVnd, PageHeader, StatCard, QRCard, ChatBubble, MemberAvatar, LobbyIcon, createCountdown } from './components.js';
import { io } from '/socket.io/socket.io.esm.min.js';

const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let activeController = null;
export const beginPage = () => { activeController?.abort(); activeController = new AbortController(); return () => activeController?.abort(); };
const api = async (url, options = {}) => { const token = localStorage.getItem('synchub.token'); const response = await fetch(url, { ...options, signal: options.signal || activeController?.signal, headers: { ...(options.body && !(options.body instanceof FormData) ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers }, body: options.body && !(options.body instanceof FormData) ? JSON.stringify(options.body) : options.body }); const data = await response.json().catch(() => ({})); if (!response.ok) throw Error(data.error?.message || data.error || data.message || response.statusText); return data; };
const dataOf = r => r?.data ?? r;
const page = (title, description, content, actions = '') => `<div class="business-page">${PageHeader({title,description,actions})}${content}</div>`;
const field = (label,name,type='text',attrs='') => `<label>${label}<input name="${name}" type="${type}" ${attrs}></label>`;
const alert = msg => `<p class="form-error" role="alert">${esc(msg)}</p>`;
const section = (title, body) => `<section class="business-card"><h2>${title}</h2>${body}</section>`;
const empty = (title, text) => EmptyState({title,description:text});
const imgFor = p => ({badminton:'/images/badminton.jpg',study_room:'/images/study-room.jpg',football:'/images/futsal.jpg',coffee:'/images/coffee.jpg',milk_tea:'/images/coffee.jpg',snack:'/images/coffee.jpg'}[p?.category] || '/images/badminton.jpg');
const date = d => d ? new Date(d).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}) : '—';

export async function renderBusiness(path, user) {
  try {
    if (path === '/' || path === '/discover') return await discover();
    if (path.startsWith('/venues/')) return await venue(path.split('/')[2], user);
    if (path.startsWith('/join/')) return await join(path.split('/')[2], user);
    if (path.startsWith('/lobby/')) return path.endsWith('/split') ? await split(path.split('/')[2], user) : await lobbyFull(path.split('/')[2], user);
    if (path === '/profile') return profile(user);
    if (path === '/wallet') return await wallet();
    if (path === '/disputes') return await disputes(user);
    if (path.startsWith('/provider')) return await provider(user);
    if (path.startsWith('/admin')) return await adminDashboard(user);
  } catch (e) { return page('Không thể tải dữ liệu', 'Máy chủ trả về lỗi khi tải trang.', `<div class="business-card" role="alert">${alert(e.message)}<button class="btn btn-outline btn-sm" data-reload>Thử lại</button></div>`); }
  return page('Không tìm thấy trang','Đường dẫn không tồn tại.',`<a data-link href="/">Về khám phá</a>`);
}

async function discover() {
  const params = new URLSearchParams(location.search); const type=params.get('type')||'ALL', category=params.get('category')||'ALL', radius=params.get('radius')||'3000', search=params.get('search')||'';
  const qs=new URLSearchParams(); if(type!=='ALL')qs.set('type',type); if(category!=='ALL')qs.set('category',category); qs.set('radius',radius); if(search)qs.set('search',search);
  const res=await api(`/api/providers?${qs}`); const providers=dataOf(res)||[];
  const categories=[['ALL','Tất cả danh mục'],['badminton','Cầu lông'],['study_room','Phòng học nhóm'],['football','Bóng đá'],['milk_tea','Trà sữa'],['coffee','Cà phê'],['snack','Ăn vặt']];
  const cards=providers.map(p=>`<article class="business-card provider-card" data-provider-lat="${Number(p.lat)}" data-provider-lng="${Number(p.lng)}" data-provider-name="${esc(p.name)}" data-provider-address="${esc(p.address)}" data-provider-id="${esc(p.id)}"><a href="/venues/${encodeURIComponent(p.id)}" data-link><img src="${imgFor(p)}" alt=""><span class="badge">${p.type==='VENUE'?'Sân / Phòng':'Quán F&B'} · ${esc(p.category)}</span></a><h3><a href="/venues/${encodeURIComponent(p.id)}" data-link>${esc(p.name)}</a></h3><p>${esc(p.address)}</p><small>${esc(p.open_hours||'')} · ${p.distance_m??'—'} m</small><div class="business-row"><b>${p.min_price!=null?`Giá từ ${formatVnd(p.min_price)}`:'Xem bảng giá'}</b><a class="btn btn-primary btn-sm" href="/venues/${encodeURIComponent(p.id)}" data-link>${p.type==='VENUE'?'Chọn giờ':'Xem menu'}</a></div></article>`).join('');
  const filters=`<form class="business-card filter-form" data-discover><div class="business-row">${['ALL','VENUE','FNB'].map(x=>`<label class="radio-pill"><input type="radio" name="type" value="${x}" ${type===x?'checked':''}>${x==='ALL'?'Tất cả':x==='VENUE'?'Sân & Phòng':'Quán F&B'}</label>`).join('')}<select name="category" aria-label="Danh mục">${categories.map(([v,l])=>`<option value="${v}" ${category===v?'selected':''}>${l}</option>`).join('')}</select><select name="radius" aria-label="Bán kính">${[1000,2000,3000,5000].map(x=>`<option value="${x}" ${Number(radius)===x?'selected':''}>≤ ${x/1000} km</option>`).join('')}</select><input name="search" type="search" value="${esc(search)}" placeholder="Tìm tên hoặc địa chỉ"><button class="btn btn-primary btn-sm">Tìm</button><button type="button" class="btn btn-outline btn-sm" data-reset-filters>Đặt lại</button></div></form>`;
  return page('Khám phá Làng Đại Học Thủ Đức','Chọn sân thể thao hoặc phòng học nhóm, khoá slot 10 phút và mở phòng ghép kèo cùng bạn bè.',`<form class="business-card join-code" data-join-code><label>Mã phòng<input name="code" placeholder="Nhập mã phòng (VD: SYNC01)" required></label><button class="btn btn-secondary">Vào phòng</button></form><div class="quick-picks">${[['badminton','Cầu lông'],['study_room','Phòng học nhóm'],['football','Bóng đá'],['coffee','Cà phê & nước uống']].map(([id,l])=>`<button class="quick-pick" data-pick="${id}"><img src="${imgFor({category:id})}" alt=""><b>${l}</b></button>`).join('')}</div>${filters}<div class="discover-grid"><section><h2>${providers.length} địa điểm trong bán kính ${Number(radius)/1000} km</h2>${providers.length?`<div class="provider-grid">${cards}</div>`:empty('Không tìm thấy địa điểm nào','Thử mở rộng bán kính hoặc đặt lại bộ lọc.')}</section><section class="business-card"><h2>Bản đồ địa điểm</h2><div id="provider-map" class="map-placeholder" aria-label="Bản đồ địa điểm"></div><small>Hiển thị ${providers.length} địa điểm · bán kính ${Number(radius)/1000} km</small></section></div>`, `<a class="btn btn-outline btn-sm" href="/join" data-link>Tham gia phòng</a>`);
}

async function venue(id,user) { const p=dataOf(await api(`/api/providers/${encodeURIComponent(id)}`)); const slots=p.slots||[]; const menu=p.menu_items||[];
  const body=`<div class="venue-hero"><img src="${imgFor(p)}" alt=""><div><span class="badge">${esc(p.type)} · ${esc(p.category)}</span><h2>${esc(p.name)}</h2><p>${esc(p.address)}</p><p>${esc(p.open_hours||'')}</p></div></div>${p.type==='VENUE'?section('Khung giờ',slots.length?`<div class="slot-list">${slots.map(s=>`<article class="slot-item"><div><b>${date(s.start_at)}</b><small>${formatVnd(s.price)} · ${Badge(s.status)}</small>${s.locked_until?`<small>Giữ chỗ còn <span data-countdown-until="${esc(s.locked_until)}">--:--</span></small>`:''}</div>${s.status==='AVAILABLE'?`<button class="btn btn-primary btn-sm" data-lock-slot="${esc(s.id)}">Giữ slot 10 phút</button>`:s.status==='LOCKED'&&s.locked_by===user?.id?`<button class="btn btn-secondary btn-sm" data-create-lobby="${esc(s.id)}">Mở phòng ghép kèo</button><button class="btn btn-outline btn-sm" data-release-slot="${esc(s.id)}">Nhả slot</button>`:`<button class="btn btn-outline btn-sm" disabled>${s.status==='LOCKED'?'Đang có người giữ':'Đã đặt'}</button>`}</article>`).join('')}</div>`:empty('Chưa có khung giờ','Đối tác chưa mở slot đặt sân.')):section('Thực đơn',menu.length?menu.map(m=>`<div class="slot-item"><div><b>${esc(m.name)}</b><small>${formatVnd(m.price)} · ${m.is_available?'Đang bán':'Tạm hết'}</small></div></div>`).join(''):empty('Chưa có món','Thực đơn chưa được cập nhật.'))}<p data-action-message role="status"></p>`;
  return page(esc(p.name),'Thông tin địa điểm, lịch slot và tình trạng còn chỗ.',body,'<a class="btn btn-outline btn-sm" href="/" data-link>← Khám phá</a>'); }

async function join(code,user) { if(!user)return page(`Bạn được mời vào phòng ${esc(code)}`,'Đăng nhập để kiểm tra điểm uy tín, tiền cọc và xác nhận tham gia.',`<div class="business-card invite-card"><p>Phòng mời: <b>#${esc(code)}</b></p><a class="btn btn-primary" href="/login" data-link data-login-from="/join/${esc(code)}">Đăng nhập để tiếp tục</a><a class="btn btn-outline" href="/" data-link>Về trang khám phá</a></div>`); const info=dataOf(await api(`/api/lobbies/${encodeURIComponent(code)}`)); const l=info.lobby||info; const provider=info.slot?.provider||l.slot?.provider; const members=info.members||[]; const est=Math.floor((info.slot?.price||120000)/4); const score=user?.reputation_score??100; const deposit=score>=90?0:score>=70?Math.round(est*.3):score>=50?est:0;
 return page(`Lời mời phòng #${esc(code)}`,'Kiểm tra sân, thời gian và mức cọc trước khi tham gia.',`<div class="split-grid"><div>${section('Thông tin buổi chơi',`<h3>${esc(provider?.name||'SyncHub')}</h3><p>${esc(provider?.address||'')}</p><p>Trạng thái: ${Badge(l.status||'OPEN')} · Thành viên: ${members.length}</p><p>Hạn tham gia: ${date(l.deadline_at)}</p>`)}${section('Uy tín & cọc',`<p>Điểm uy tín: <b>${score}/100</b> · Hạng ${score>=90?'A':score>=70?'B':score>=50?'C':'FLAGGED'}</p><p>Tiền cọc dự kiến: <b>${formatVnd(deposit)}</b></p>${score<50?alert('Điểm uy tín dưới 50, tài khoản không thể tham gia phòng.'):''}<button class="btn btn-primary" data-join-lobby="${esc(code)}" ${score<50?'disabled':''}>Xác nhận tham gia</button><p data-action-message role="status"></p>`)}</div><aside>${section('Thành viên',members.length?members.map(m=>`<p>${esc(m.full_name)} · ${m.status}</p>`).join(''):empty('Chưa có thành viên','Bạn có thể là người đầu tiên tham gia.'))}</aside></div>`); }

async function lobbyFull(code,user) {
  const detail=dataOf(await api(`/api/lobbies/${encodeURIComponent(code)}`)); const l=detail.lobby||detail; const slot=detail.slot||{}; const members=detail.members||[]; const items=detail.cart_items||[]; const rec=dataOf(await api(`/api/recommend?lobbyId=${encodeURIComponent(l.id)}`).catch(()=>({data:[]})))||[]; const host=user?.id===l.host_id; const isMember=members.some(m=>m.user_id===user?.id&&m.status!=='LEFT'); const provider=slot.provider||{}; const inviteUrl=`${location.origin}/join/${encodeURIComponent(code)}`; const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteUrl)}`;
  const picks=rec.slice(0,5).map((x,i)=>`<article class="recommendation"><div class="recommendation-head"><span class="rank">#${i+1}</span><strong>${esc(x.name)}</strong></div><p>${esc(x.address)}</p><small>Điểm ${x.score} · Cách sân ${x.distance_m} m · ${x.is_open?'Đang mở cửa':'Đóng cửa trong giờ chơi'}</small><div class="recommendation-tags">${(x.reasons||[]).map(r=>`<span>${esc(r)}</span>`).join('')}</div>${x.voucher_code?`<button class="btn btn-secondary btn-sm" data-apply-voucher-code="${esc(x.voucher_code)}">Áp mã ${esc(x.voucher_code)}</button>`:''}<div class="menu-picks">${(x.popular_items||[]).map(m=>`<div class="menu-pick"><div><b>${esc(m.name)}</b><small>${m.order_count} lượt đặt</small></div><div class="menu-pick-actions"><strong>${formatVnd(m.price)}</strong><button class="btn btn-primary btn-sm" data-cart-add="${esc(m.id)}" ${l.status!=='OPEN'?'disabled':''}>+ Thêm</button></div></div>`).join('')}</div></article>`).join('');
  const cartSubtotal = items.reduce((total, item) => total + item.qty * item.unit_price_snapshot, 0);
  const locked = l.status !== 'OPEN';
  const cartSection = `<section class="business-card lobby-cart" data-lobby-cart data-status="${esc(l.status)}">
    <div class="lobby-cart-heading"><h2>Giỏ hàng GroupOrder</h2><div class="lobby-cart-totals">
      <span>Tổng đồ uống: <b data-cart-subtotal>${formatVnd(cartSubtotal)}</b></span>
      <span>Ship: <b>${formatVnd(l.ship_fee || 0)}</b></span><span>Món: <b data-cart-count>${items.length}</b></span>
    </div></div>
    <div class="lobby-lock-notice" data-lobby-lock-notice ${locked ? '' : 'hidden'}>${l.status === 'CANCELLED' ? 'Phòng đã hủy. Đơn F&B đã hủy và các khoản đang giữ đã được hoàn.' : 'Phòng đã khóa giỏ hàng (BR-INT-04) — không thể thêm hoặc sửa món.'}</div>
    <div data-cart-rows>${renderLobbyCart(items, members, locked)}</div>
    <form data-voucher-form class="lobby-voucher" ${l.status === 'CANCELLED' ? 'hidden' : ''}>${LobbyIcon('Tag')}<input name="code" aria-label="Mã voucher" placeholder="Mã voucher (VD: SYNCHUBCROSS15, FNBLANGDH20K)" required><button class="btn btn-secondary btn-sm">Áp dụng</button></form>
  </section>`;
  const cancelAction = user?.role === 'HOST' && host && ['OPEN', 'LOCKED', 'AWAITING_PAYMENT', 'PAID'].includes(l.status)
    ? `<button class="btn btn-outline btn-sm" data-cancel-lobby="${esc(l.id)}">Hủy phòng</button>`
    : '';
  const actions=`${cancelAction}${!isMember&&l.status==='OPEN'?`<a class="btn btn-primary btn-sm" href="/join/${encodeURIComponent(code)}" data-link>Tham gia phòng</a>`:''}${isMember&&!host&&l.status==='OPEN'?`<button class="btn btn-outline btn-sm" data-leave-lobby="${esc(l.id)}">Rời phòng</button>`:''}${host&&l.status==='OPEN'?`<button class="btn btn-outline btn-sm" data-lock-lobby="${esc(l.id)}">${LobbyIcon('Lock')}Khóa giỏ hàng (BR-INT-04)</button><button class="btn btn-primary btn-sm" data-lock-and-split="${esc(l.id)}" data-code="${esc(code)}">${LobbyIcon('Calculator')}Chốt &amp; Chia Bill</button>`:''}${host&&['LOCKED','AWAITING_PAYMENT'].includes(l.status)?`<a class="btn btn-primary btn-sm" href="/lobby/${encodeURIComponent(code)}/split" data-link>Xem bảng chia bill</a>`:''}`;
  const summary = `<div class="lobby-summary"><div><b>MÃ PHÒNG: ${esc(code)}</b><span>Khung giờ: ${date(slot.start_at)}</span><span>Giá sân: <strong>${formatVnd(slot.price || 0)}</strong></span></div><div><small>Hạn chốt kèo</small><span data-countdown-until="${esc(l.deadline_at)}"></span><span data-lobby-status>${Badge(l.status)}</span>${detail.voucher ? `<span class="badge lobby-voucher-badge">Voucher ${esc(detail.voucher.code)}</span>` : ''}</div></div>`;
  const body = `<div class="lobby-grid">
    <div class="lobby-main">${cartSection}
      <section class="lobby-recommendations"><div class="lobby-section-heading"><h2>${LobbyIcon('Sparkles')} Gợi ý quán F&B</h2><small>Rule-based scoring · WBS-4.2</small></div>${picks || '<p class="business-card">Không có quán gợi ý trong bán kính 3 km.</p>'}</section>
      <p data-action-message role="status"></p>
    </div>
    <aside class="lobby-aside">
      <section class="business-card"><div class="lobby-section-heading"><h2>${LobbyIcon('Users')} Thành viên</h2><span data-member-count>${members.length}</span></div><div data-member-rows data-host-id="${esc(l.host_id)}">${renderLobbyMembers(members,l.host_id)}</div></section>
      ${section(`Mời bạn vào phòng #${esc(code)}`,QRCard({title:'Mã QR lời mời',imageUrl:qrUrl,copyText:inviteUrl,copyLabel:'Sao chép link mời',hint:'Bạn bè quét mã để xem thông tin phòng.'}))}
      ${section('Trò chuyện trong phòng',`<div class="chat-messages lobby-chat" data-chat-messages>${ChatBubble({kind:'system',text:'Bắt đầu thảo luận chọn nước & chốt kèo'})}</div><form data-chat-form class="chat-form"><input name="text" aria-label="Tin nhắn" required maxlength="500" placeholder="Nhắn cho cả nhóm…"><button class="btn btn-primary btn-sm">Gửi</button></form>`)}
    </aside></div>`;
  return `<div class="business-page lobby-page"><header class="page-header"><div><h1>${esc(provider.name || `Phòng #${code}`)}</h1>${summary}</div><div class="page-actions" data-lobby-actions>${actions}</div></header>${body}</div>`;
}

function renderLobbyMembers(members, hostId) {
  return members.map(m=>`<div class="member-row">${MemberAvatar({name:m.full_name,score:m.reputation_score,host:m.user_id===hostId})}<div class="member-meta"><b>${esc(m.full_name)}${m.user_id===hostId?' (Host)':''}</b><small>Uy tín ${m.reputation_score}/100 · ${esc(m.status)}</small></div><div class="member-deposit"><small>Đã cọc</small><b>${formatVnd(m.deposit_paid||0)}</b></div></div>`).join('');
}

function renderLobbyCart(items, members, locked) {
  if (!items.length) return '<div class="lobby-cart-empty">Chưa có món nào trong giỏ. Chọn món từ các quán gợi ý bên dưới.</div>';
  return items.map(i=>`<div class="cart-item"><span class="food-icon" aria-hidden="true">${LobbyIcon('UtensilsCrossed')}</span><div><b>${esc(i.name)}</b><small>${esc(members.find(m=>m.user_id===i.user_id)?.full_name||'Thành viên')}</small><strong>${formatVnd(i.unit_price_snapshot)}</strong></div><div class="cart-controls"><button type="button" data-cart-qty="-1" data-cart-id="${esc(i.id)}" aria-label="Giảm ${esc(i.name)}" ${locked?'disabled':''}>${LobbyIcon('Minus')}</button><span>${i.qty}</span><button type="button" data-cart-qty="1" data-cart-id="${esc(i.id)}" aria-label="Tăng ${esc(i.name)}" ${locked?'disabled':''}>${LobbyIcon('Plus')}</button></div></div>`).join('');
}

async function split(code,user) { const r=dataOf(await api(`/api/lobbies/${encodeURIComponent(code)}`)); const l=r.lobby||r; let bills=dataOf(await api(`/api/lobbies/${encodeURIComponent(l.id)}/bills`).catch(()=>({data:[]})))||[]; if(!bills.length&&l.status==='LOCKED'&&user?.id===l.host_id){const s=dataOf(await api(`/api/lobbies/${encodeURIComponent(l.id)}/split`,{method:'POST'})); bills=s.bills||[];}
 const mine=bills.find(b=>b.user_id===user?.id); const rows=bills.map(b=>`<tr><td>${esc(b.full_name||b.user?.full_name||b.user_id)}</td><td>${formatVnd(b.slot_share)}</td><td>${formatVnd(b.food_amount)}</td><td>${formatVnd(b.ship_share-b.discount_share)}</td><td><b>${formatVnd(b.total)}</b></td><td>${Badge(b.status)} ${l.status!=='CANCELLED'&&b.status==='PENDING'?`<button class="btn btn-outline btn-sm" data-pay-bill="${esc(b.id)}">Giả lập thanh toán</button>`:''}</td></tr>`).join('');
 const qr=l.status==='CANCELLED'?'<p>Phòng đã hủy.</p>':mine?QRCard({title:'VietQR thanh toán',imageUrl:mine.vietqr_url,copyText:`SYNCHUB ${code} ${mine.user_id}`,copyLabel:'Sao chép nội dung CK',hint:`Số tiền: ${formatVnd(mine.total)}`}):`<p>Chưa có hóa đơn VietQR.</p>`;
 return page(`Chia bill #${esc(code)}`,'Chia tiền theo dữ liệu máy chủ; mỗi thành viên thanh toán phần của mình.',`${bills.length?section('Hóa đơn thành viên',`<div class="table-scroll"><table><thead><tr><th>Thành viên</th><th>Sân</th><th>Món</th><th>Ship/Voucher</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table></div>`):section('Hóa đơn',empty('Chưa có hóa đơn','Host cần chốt phòng để tạo bill.'))}<div class="split-grid">${section('Hóa đơn của bạn',qr)}${user?.id===l.host_id&&l.status!=='CANCELLED'?section('Điểm danh & giải ngân',`${(r.members||[]).map(m=>`<label>${esc(m.full_name)}<select data-attendance="${esc(m.user_id)}"><option value="CHECKED_IN">Có mặt (+2)</option><option value="NO_SHOW">Bùng kèo (-15, mất cọc)</option></select></label>`).join('')}<button class="btn btn-primary" data-release="${esc(l.id)}">Xác nhận check-in & giải ngân</button>`):''}</div><p data-action-message role="status"></p>`); }

function profile(user) { const score=user?.reputation_score??0, grade=score>=90?'A':score>=70?'B':score>=50?'C':'FLAGGED'; return page('Hồ sơ & hạng uy tín','Điểm uy tín quyết định mức đặt cọc khi vào phòng ghép kèo.',`<div class="split-grid">${section(esc(user?.full_name),`<p>${esc(user?.email)} · ${esc(user?.phone)}</p><p>${esc(user?.role)} · ${Badge(user?.status||'ACTIVE')}</p><p>Điểm uy tín: <b>${score}/100</b> · ${Badge(grade)}</p><progress max="100" value="${score}"></progress>`)}${section('Quyền lợi theo hạng',`<p>A · 90–100: Miễn cọc</p><p>B · 70–89: Cọc 30% sân</p><p>C · 50–69: Cọc 100% sân</p><p>FLAGGED · dưới 50: Chặn tham gia</p><p>Check-in +2 · NO_SHOW -15</p>`)}</div>`); }

async function wallet() { const ls=dataOf(await api('/api/lobbies'))||[]; const tx=ls.flatMap(l=>(l.escrow_transactions||[]).map(t=>({...t,code:l.invite_code}))); const sums=['HELD','RELEASED','FROZEN','REFUNDED'].map(s=>StatCard({label:s,value:formatVnd(tx.filter(x=>x.status===s).reduce((n,x)=>n+x.amount,0))})).join(''); return page('Ví & sổ cái Escrow','Theo dõi dòng tiền tạm giữ, giải ngân, đóng băng và hoàn tiền.',`<div class="stat-grid">${sums}</div>${section('Phòng ghép kèo của bạn',ls.length?ls.map(l=>`<div class="slot-item"><b>#${esc(l.invite_code)} · ${esc(l.slot?.provider?.name)}</b><span>${Badge(l.status)}</span><a href="/lobby/${esc(l.invite_code)}/split" data-link>Chia bill</a></div>`).join(''):empty('Bạn chưa tham gia phòng nào','Khám phá địa điểm để bắt đầu.'))}${section('Lịch sử giao dịch',tx.length?`<div class="table-scroll"><table><thead><tr><th>Phòng</th><th>Loại</th><th>Key</th><th>Số tiền</th><th>Phí</th><th>Thực nhận</th><th>Trạng thái</th></tr></thead><tbody>${tx.map(t=>`<tr><td>#${esc(t.code)}</td><td>${esc(t.type)}</td><td>${esc(t.idempotency_key)}</td><td>${formatVnd(t.amount)}</td><td>${formatVnd(t.platform_fee)}</td><td>${formatVnd(t.net_amount)}</td><td>${esc(t.status)}</td></tr>`).join('')}</tbody></table></div>`:empty('Chưa phát sinh giao dịch','Giao dịch sẽ xuất hiện khi phòng bắt đầu giữ tiền.'))}`); }

async function disputes(user) { const [dr,lr]=await Promise.all([api('/api/disputes'),api('/api/lobbies').catch(()=>({data:[]}))]); const ds=dataOf(dr)||[], ls=dataOf(lr)||[]; return page('Khiếu nại dịch vụ & hoàn tiền','Gửi bằng chứng và theo dõi trạng thái xử lý khiếu nại.',`${section('Gửi khiếu nại mới',`<form data-dispute-form class="form-grid"><label>Phòng<select name="lobbyId" required>${ls.map(l=>`<option value="${esc(l.id)}">#${esc(l.invite_code)} — ${esc(l.slot?.provider?.name)}</option>`).join('')}</select></label>${field('Provider ID bị khiếu nại','targetProviderId','text','required')}${field('Số tiền yêu cầu hoàn (VND)','refundAmount','number','min="0" value="25000" required')}<label>Lý do<textarea name="reason" required rows="3"></textarea></label>${field('Link ảnh bằng chứng','evidenceUrl','url')}<label>Tải ảnh bằng chứng (tối đa 5 ảnh)<input name="evidence" type="file" accept="image/*" multiple></label><button class="btn btn-primary">Gửi khiếu nại</button><p data-action-message role="status"></p></form>`)}${section('Khiếu nại của bạn',ds.length?ds.map(d=>`<article class="business-card"><b>${esc(d.target_provider_name)}</b> · ${Badge(d.status)}<p>${esc(d.reason)}</p><small>Phòng #${esc(d.lobby_invite_code||d.lobby_id)} · yêu cầu ${formatVnd(d.refund_amount)}</small>${(d.evidence_urls||[]).map(x=>`<p><a href="${esc(x)}" target="_blank" rel="noopener">Xem bằng chứng</a></p>`).join('')}</article>`).join(''):empty('Chưa có khiếu nại nào','Khi có sự cố, gửi khiếu nại kèm liên kết bằng chứng.'))}`); }

async function provider(user) { const ps=dataOf(await api('/api/providers?radius=10000'))||[]; const own=ps.filter(p=>p.owner_id===user?.id); const p=own[0]||ps.find(x=>x.type==='VENUE'); if(!p)return page('Portal đối tác','Quản lý lịch slot và menu.',empty('Không tìm thấy địa điểm đối tác','Tài khoản chưa gắn với provider.')); const stats=dataOf(await api(`/api/providers/${p.id}/stats`).catch(()=>({data:{}})))||{}; return page('Portal đối tác',`${esc(p.name)} · Quản lý slot, menu và doanh thu.`, `<div class="stat-grid">${[['Tổng slot',stats.slots_total],['Slot còn trống',stats.slots_available],['Doanh thu gộp',formatVnd(stats.gross_revenue||0)],['Thực nhận',formatVnd(stats.net_revenue||0)]].map(([label,value])=>StatCard({label,value:String(value??0)})).join('')}</div>${section('Thêm slot',`<form data-provider-slot class="form-grid"><input type="hidden" name="providerId" value="${esc(p.id)}">${field('Bắt đầu','start_at','datetime-local','required')}${field('Kết thúc','end_at','datetime-local','required')}${field('Giá (VND)','price','number','min="0" required')}<button class="btn btn-primary">Tạo slot</button></form>`)}${section('Khung giờ',stats.provider?.slots?.length?stats.provider.slots.map(s=>`<div class="slot-item"><b>${date(s.start_at)}–${date(s.end_at)}</b><span>${formatVnd(s.price)} · ${Badge(s.status)}</span></div>`).join(''):empty('Chưa có slot','Tạo slot mới bằng biểu mẫu phía trên.'))}${section('Thêm món',`<form data-provider-menu class="form-grid"><input type="hidden" name="providerId" value="${esc(p.id)}">${field('Tên món','name','text','required')}${field('Giá (VND)','price','number','min="0" required')}<button class="btn btn-primary">Thêm món</button></form>`)}${section('Thực đơn',stats.provider?.menu_items?.length?stats.provider.menu_items.map(m=>`<div class="slot-item"><span>${esc(m.name)} · ${formatVnd(m.price)} · ${m.order_count} lượt</span><button class="btn btn-outline btn-sm" data-toggle-menu="${esc(m.id)}" data-provider-id="${esc(p.id)}" data-available="${m.is_available}">${m.is_available?'Tạm ngưng':'Mở bán'}</button></div>`).join(''):empty('Chưa có món','Thêm món để khách đặt trong lobby.'))}${section('Địa điểm',own.length?own.map(x=>`<div class="slot-item"><b>${esc(x.name)}</b><span>${esc(x.address)}</span></div>`).join(''):empty('Provider theo tài khoản','Hiển thị provider khả dụng nếu tài khoản không có liên kết owner.'))}<p data-action-message role="status"></p>`); }

async function adminDashboard() { const [sr,dr]=await Promise.all([api('/api/admin/stats'),api('/api/disputes')]); const s=dataOf(sr)||{}, ds=dataOf(dr)||[]; const maxDaily=Math.max(1,...(s.daily_stats||[]).map(x=>x.gmv||0)); const cards=[['GMV đã giải ngân',formatVnd(s.gmv_total||0)],['Tổng hoa hồng',formatVnd(s.platform_fee_total||0)],['Sân (8%)',formatVnd(s.venue_fee_total||0)],['FNB (12%)',formatVnd(s.fnb_fee_total||0)],['Người dùng',s.users_total],['Phòng',s.lobbies_total],['Escrow HELD',formatVnd(s.held_escrow_amount||0)],['Escrow FROZEN',formatVnd(s.frozen_escrow_amount||0)]]; return page('Admin Dashboard','Số liệu hệ thống, phân xử khiếu nại, danh sách FLAGGED và audit log.',`<div class="stat-grid">${cards.map(([label,value])=>StatCard({label,value:String(value??0)})).join('')}</div>${section('GMV theo ngày trong tuần',`<div class="admin-chart" role="img" aria-label="Biểu đồ GMV theo ngày">${(s.daily_stats||[]).map(d=>`<div><small>${Math.round((d.gmv||0)/1000)}k</small><i style="height:${d.gmv?Math.max(8,Math.round(d.gmv/maxDaily*100)):2}%" title="${formatVnd(d.gmv||0)}"></i><b>${esc(d.day)}</b></div>`).join('')}</div>`)}${section('Người dùng cần chú ý',(s.flagged_users||[]).length?s.flagged_users.map(u=>`<div class="slot-item"><span>${esc(u.full_name)} · ${esc(u.email)} · ${u.reputation_score} điểm · ${Badge(u.status)}</span><button class="btn btn-outline btn-sm" data-restore-user="${esc(u.id)}">Khôi phục 60đ</button></div>`).join(''):empty('Không có người dùng FLAGGED','Danh sách trạng thái cần chú ý đang trống.'))}${section('Phân xử khiếu nại',ds.length?ds.map(d=>`<article class="slot-item"><div><b>${esc(d.target_provider_name)}</b> ${Badge(d.status)}<p>${esc(d.reason)} · ${formatVnd(d.refund_amount)}</p></div>${d.status==='OPEN'?`<button class="btn btn-primary btn-sm" data-resolve="${esc(d.id)}" data-amount="${Number(d.refund_amount)||0}">Duyệt hoàn tiền</button><button class="btn btn-outline btn-sm" data-reject="${esc(d.id)}">Từ chối</button>`:''}</article>`).join(''):empty('Chưa có khiếu nại','Yêu cầu mới sẽ xuất hiện tại đây.'))}${section('Nhật ký kiểm toán',s.recent_audit_logs?.length?`<div class="table-scroll"><table><thead><tr><th>Thời gian</th><th>Hành động</th><th>Thực thể</th><th>Actor</th><th>After</th></tr></thead><tbody>${s.recent_audit_logs.map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.action)}</td><td>${esc(x.entity)} (${esc(x.entity_id)})</td><td>${esc(x.actor_id||'system')}</td><td>${esc(JSON.stringify(x.after))}</td></tr>`).join('')}</tbody></table></div>`:empty('Chưa có audit log','Thao tác quản trị được ghi nhận tự động.'))}`); }

async function admin(user) { const [sr,dr]=await Promise.all([api('/api/admin/stats'),api('/api/disputes')]); const s=dataOf(sr)||{}, ds=dataOf(dr)||[]; return page('Admin Dashboard','Thống kê hệ thống, danh sách FLAGGED, phân xử khiếu nại và audit log.',`<div class="stat-grid">${Object.entries(s).filter(([,v])=>typeof v==='number').map(([k,v])=>StatCard({label:k.replaceAll('_',' '),value:String(v)})).join('')}</div>${section('Người dùng cần chú ý',(s.flagged_users||s.flaggedUsers||[]).length?(s.flagged_users||s.flaggedUsers).map(u=>`<div class="slot-item"><span>${esc(u.full_name)} · ${esc(u.email)} · ${u.reputation_score} điểm</span><button class="btn btn-outline btn-sm" data-restore-user="${esc(u.id)}">Khôi phục 60đ</button></div>`).join(''):empty('Không có người dùng FLAGGED','Danh sách trạng thái cần chú ý đang trống.'))}${section('Phân xử khiếu nại',ds.length?ds.map(d=>`<article class="slot-item"><div><b>${esc(d.target_provider_name)}</b> ${Badge(d.status)}<p>${esc(d.reason)} · ${formatVnd(d.refund_amount)}</p></div>${d.status==='OPEN'?`<button class="btn btn-primary btn-sm" data-resolve="${esc(d.id)}" data-amount="${Number(d.refund_amount)||0}">Duyệt</button><button class="btn btn-outline btn-sm" data-reject="${esc(d.id)}">Từ chối</button>`:''}</article>`).join(''):empty('Chưa có khiếu nại','Yêu cầu mới sẽ xuất hiện tại đây.'))}${section('Nhật ký kiểm toán',s.recent_audit_logs?.length?`<div class="table-scroll"><table><thead><tr><th>Thời gian</th><th>Hành động</th><th>Thực thể</th><th>Actor</th><th>After</th></tr></thead><tbody>${s.recent_audit_logs.map(x=>`<tr><td>${date(x.created_at)}</td><td>${esc(x.action)}</td><td>${esc(x.entity)} (${esc(x.entity_id)})</td><td>${esc(x.actor_id||'system')}</td><td>${esc(JSON.stringify(x.after))}</td></tr>`).join('')}</tbody></table></div>`:empty('Chưa có audit log','Thao tác quản trị được ghi nhận tự động.'))}`); }

function mountLobbySocket(root, code, user, navigate, status) {
  const cart = root.querySelector('[data-lobby-cart]');
  const rows = root.querySelector('[data-cart-rows]');
  const memberRows = root.querySelector('[data-member-rows]');
  const chat = root.querySelector('[data-chat-messages]');
  const lifetime = new AbortController();
  const seenMessages = new Set();
  let members = [];
  let cartSnapshot;
  let connection = 0;
  let ready = false;
  let synchronized = false;
  const identity = { lobbyId: code, userId: user?.id };
  const socket = io({ autoConnect: false, auth: { token: localStorage.getItem('synchub.token') } });

  const updateControls = () => {
    const disabled = !ready || cart.dataset.status !== 'OPEN';
    root.querySelectorAll('[data-cart-add], [data-cart-qty]').forEach(button => { button.disabled = disabled; });
  };
  const finishSync = () => {
    ready = synchronized && Boolean(cartSnapshot);
    updateControls();
  };
  const renderCart = () => {
    if (!cartSnapshot) return;
    const focused = rows.contains(document.activeElement) ? document.activeElement.dataset : null;
    const { items, subtotal } = cartSnapshot;
    rows.innerHTML = renderLobbyCart(items, members, !ready || cart.dataset.status !== 'OPEN');
    root.querySelector('[data-cart-subtotal]').textContent = formatVnd(subtotal);
    root.querySelector('[data-cart-count]').textContent = items.length;
    if (focused) {
      const replacement = [...rows.querySelectorAll('[data-cart-qty]')].find(button =>
        button.dataset.cartId === focused.cartId && button.dataset.cartQty === focused.cartQty);
      replacement?.focus({ preventScroll: true });
    }
  };
  const setStatus = next => {
    if (next === 'OPEN' || next === cart.dataset.status || cart.dataset.status === 'CANCELLED') return;
    cart.dataset.status = next;
    root.querySelector('[data-lobby-status]').innerHTML = Badge(next);
    root.querySelector('[data-lobby-lock-notice]').hidden = false;
    const actions = root.querySelector('[data-lobby-actions]');
    const canSplit = actions.querySelector('[data-lock-and-split]');
    const cancel = actions.querySelector('[data-cancel-lobby]');
    actions.innerHTML = canSplit && ['LOCKED', 'AWAITING_PAYMENT'].includes(next)
      ? `<a class="btn btn-primary btn-sm" href="/lobby/${encodeURIComponent(code)}/split" data-link>Xem bảng chia bill</a>`
      : '';
    if (cancel && ['LOCKED', 'AWAITING_PAYMENT', 'PAID'].includes(next)) actions.prepend(cancel);
    if (next === 'CANCELLED') {
      root.querySelector('[data-lobby-lock-notice]').textContent = 'Phòng đã hủy. Đơn F&B đã hủy và các khoản đang giữ đã được hoàn.';
      root.querySelector('[data-voucher-form]').hidden = true;
      cartSnapshot = { items: [], subtotal: 0 };
      renderCart();
    }
    updateControls();
  };

  socket.on('connect', async () => {
    const current = ++connection;
    socket.emit('lobby:join', identity);
    try {
      const detail = dataOf(await api(`/api/lobbies/${encodeURIComponent(code)}`, { signal: lifetime.signal }));
      if (current !== connection || lifetime.signal.aborted) return;
      setStatus((detail.lobby || detail).status);
      synchronized = true;
      finishSync();
    } catch (error) {
      if (!lifetime.signal.aborted) status(`Không thể đồng bộ trạng thái phòng: ${error.message}`);
    }
  });
  socket.on('disconnect', () => {
    connection++;
    ready = false;
    synchronized = false;
    cartSnapshot = undefined;
    updateControls();
  });
  socket.on('lobby:members', snapshot => {
    members = snapshot.members;
    memberRows.innerHTML = renderLobbyMembers(members, memberRows.dataset.hostId);
    memberRows.dataset.receivedSnapshot = 'true';
    root.querySelector('[data-member-count]').textContent = members.length;
    renderCart();
  });
  socket.on('cart:updated', snapshot => {
    if (cart.dataset.status === 'CANCELLED') return;
    cartSnapshot = snapshot;
    renderCart();
    finishSync();
  });
  socket.on('lobby:locked', () => setStatus('LOCKED'));
  socket.on('bill:ready', () => {
    if (cart.dataset.status !== 'CANCELLED') navigate(`/lobby/${encodeURIComponent(code)}/split`);
  });
  socket.on('notify', message => {
    status(message.message);
    if (message.type === 'INFO' && message.message === 'Phòng đã hủy.') setStatus('CANCELLED');
  });
  socket.on('chat:message', message => {
    if (seenMessages.has(message.id)) return;
    seenMessages.add(message.id);
    chat.querySelector('.chat-system')?.remove();
    chat.insertAdjacentHTML('beforeend', ChatBubble({
      kind: message.userId === user?.id ? 'me' : 'other',
      name: message.fullName,
      text: message.text,
      time: new Date(message.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }));
    chat.scrollTop = chat.scrollHeight;
  });

  root.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-add], [data-cart-qty]');
    if (!button || button.disabled || !ready || cart.dataset.status !== 'OPEN') return;
    if (button.dataset.cartAdd) {
      socket.emit('cart:add', { ...identity, menuItemId: button.dataset.cartAdd, qty: 1 });
      return;
    }
    const item = cartSnapshot?.items.find(entry => entry.id === button.dataset.cartId);
    if (!item) return;
    const qty = item.qty + Number(button.dataset.cartQty);
    socket.emit(qty <= 0 ? 'cart:remove' : 'cart:update', { ...identity, cartItemId: item.id, ...(qty > 0 && { qty }) });
  }, { signal: lifetime.signal });
  const form = root.querySelector('[data-chat-form]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = new FormData(form).get('text').trim();
    if (!text || !socket.connected) return;
    socket.emit('chat:send', { ...identity, text });
    form.reset();
  }, { signal: lifetime.signal });

  updateControls();
  socket.connect();
  return () => {
    lifetime.abort();
    socket.removeAllListeners();
    socket.disconnect();
  };
}

export function mountBusiness(path,user,navigate) {
  const cleanups=[]; const on=(selector,event,fn)=>document.querySelectorAll(selector).forEach(el=>el.addEventListener(event,fn)); const status=msg=>{const n=document.querySelector('[data-action-message]');if(n)n.textContent=msg;};
  const call=async(url,method='POST',body)=>api(url,{method,body}).then(()=>{status('Đã cập nhật thành công.');setTimeout(()=>location.reload(),350);}).catch(e=>status(`Lỗi: ${e.message}`));
  on('[data-discover]','submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),q=new URLSearchParams();for(const [k,v] of f)if(v&&!(k==='type'&&v==='ALL')&&!(k==='category'&&v==='ALL'))q.set(k,v);navigate(`/?${q}`);});
  on('[data-reset-filters]','click',()=>navigate('/'));
  on('[data-pick]','click',e=>{const id=e.currentTarget.dataset.pick;const type=['coffee','milk_tea','snack'].includes(id)?'FNB':'VENUE';navigate(`/?category=${id}&type=${type}&radius=3000`);});
  on('[data-join-code]','submit',e=>{e.preventDefault();navigate(`/join/${encodeURIComponent(new FormData(e.currentTarget).get('code').trim().toUpperCase())}`);});
  on('[data-login-from]','click',e=>{e.preventDefault();navigate('/login',{state:{from:e.currentTarget.dataset.loginFrom}});});
  on('[data-lock-slot]','click',e=>call(`/api/slots/${e.currentTarget.dataset.lockSlot}/lock`));
  on('[data-release-slot]','click',e=>call(`/api/slots/${e.currentTarget.dataset.releaseSlot}/release`));
  on('[data-create-lobby]','click',async e=>{try{const r=dataOf(await api('/api/lobbies',{method:'POST',body:{slotId:e.currentTarget.dataset.createLobby}}));navigate(`/lobby/${r.lobby.invite_code}`);}catch(x){status(`Không thể mở phòng: ${x.message}`);}});
  on('[data-join-lobby]','click',async e=>{try{await api(`/api/lobbies/${e.currentTarget.dataset.joinLobby}/join`,{method:'POST'});navigate(`/lobby/${e.currentTarget.dataset.joinLobby}`);}catch(x){status(`Không thể tham gia: ${x.message}`);}});
  on('[data-cancel-lobby]', 'click', async event => {
    const button = event.currentTarget;
    if (!window.confirm('Hủy phòng và hoàn các khoản đang giữ?')) return;
    button.disabled = true;
    try {
      await api(`/api/lobbies/${button.dataset.cancelLobby}/cancel`, { method: 'POST' });
      navigate(path, { replace: true });
    } catch (error) {
      button.disabled = false;
      status(`Không thể hủy phòng: ${error.message}`);
    }
  });
  on('[data-lock-lobby]', 'click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await api(`/api/lobbies/${button.dataset.lockLobby}/lock`, { method: 'POST' });
    } catch (error) {
      status(`Không thể khóa giỏ hàng: ${error.message}`);
      button.disabled = false;
    }
  });
  on('[data-lock-and-split]','click',async e=>{const b=e.currentTarget;b.disabled=true;try{await api(`/api/lobbies/${b.dataset.lockAndSplit}/lock`,{method:'POST'});await api(`/api/lobbies/${b.dataset.lockAndSplit}/split`,{method:'POST'});navigate(`/lobby/${b.dataset.code}/split`);}catch(x){status(`Không thể chốt phòng: ${x.message}`);b.disabled=false;}});
  on('[data-create-split]','click',async e=>{try{await api(`/api/lobbies/${e.currentTarget.dataset.createSplit}/split`,{method:'POST'});navigate(`/lobby/${e.currentTarget.dataset.code}/split`);}catch(x){status(`Không thể tạo bill: ${x.message}`);}});
  on('[data-leave-lobby]','click',async e=>{try{await api(`/api/lobbies/${e.currentTarget.dataset.leaveLobby}/leave`,{method:'POST'});navigate('/');}catch(x){status(`Không thể rời phòng: ${x.message}`);}});
  on('[data-voucher-form]','submit',async e=>{e.preventDefault();const code=new FormData(e.currentTarget).get('code')?.trim();const lobbyId=location.pathname.split('/')[2];try{const result=dataOf(await api('/api/vouchers/validate',{method:'POST',body:{code,lobbyId}}));status(`Đã áp dụng voucher${result?.discountAmount!=null?` · giảm ${formatVnd(result.discountAmount)}`:''}.`);setTimeout(()=>location.reload(),300);}catch(x){status(`Voucher lỗi: ${x.message}`);}});
  on('[data-apply-voucher-code]','click',async e=>{const code=e.currentTarget.dataset.applyVoucherCode,lobbyId=location.pathname.split('/')[2];try{const result=dataOf(await api('/api/vouchers/validate',{method:'POST',body:{code,lobbyId}}));status(`Đã áp dụng ${code}${result?.discountAmount!=null?` · giảm ${formatVnd(result.discountAmount)}`:''}.`);setTimeout(()=>location.reload(),300);}catch(x){status(`Voucher lỗi: ${x.message}`);}});
  on('[data-pay-bill]','click',e=>call('/api/payments/webhook-mock','POST',{splitBillId:e.currentTarget.dataset.payBill}));
  on('[data-release]','click',()=>{const members=[...document.querySelectorAll('[data-attendance]')].map(x=>({userId:x.dataset.attendance,status:x.value}));call(`/api/lobbies/${document.querySelector('[data-release]').dataset.release}/checkin`,'POST',{members});});
  on('[data-copy]','click',async e=>{try{await navigator.clipboard.writeText(e.currentTarget.dataset.copy);status('Đã sao chép liên kết.');}catch{status('Không thể sao chép trên thiết bị này.');}});
  on('[data-dispute-form]','submit',async e=>{e.preventDefault();const formData=new FormData(e.currentTarget);const url=formData.get('evidenceUrl');formData.delete('evidenceUrl');if(url)formData.append('evidenceUrls',url);try{await api('/api/disputes',{method:'POST',body:formData});status('Đã gửi khiếu nại.');setTimeout(()=>location.reload(),350);}catch(x){status(`Lỗi: ${x.message}`);}});
  on('[data-provider-slot]','submit',async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));call(`/api/providers/${f.providerId}/slots`,'POST',{startAt:new Date(f.start_at).toISOString(),endAt:new Date(f.end_at).toISOString(),price:Number(f.price)});});
  on('[data-provider-menu]','submit',async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));call(`/api/providers/${f.providerId}/menu`,'POST',{name:f.name,price:Number(f.price)});});
  on('[data-toggle-menu]','click',e=>call(`/api/providers/${e.currentTarget.dataset.providerId}/menu/${e.currentTarget.dataset.toggleMenu}`,'PATCH',{isAvailable:e.currentTarget.dataset.available!=='true'}));
  on('[data-restore-user]','click',e=>call(`/api/admin/users/${e.currentTarget.dataset.restoreUser}/status`,'PATCH',{status:'ACTIVE',reputationScore:60}));
  on('[data-resolve]','click',e=>call(`/api/admin/disputes/${e.currentTarget.dataset.resolve}`,'PATCH',{status:'RESOLVED',refundAmount:Number(e.currentTarget.dataset.amount)}));
  on('[data-reject]','click',e=>call(`/api/admin/disputes/${e.currentTarget.dataset.reject}`,'PATCH',{status:'REJECTED',refundAmount:0}));
  const lobby = document.querySelector('.lobby-page');
  if (lobby) cleanups.push(mountLobbySocket(lobby, decodeURIComponent(path.split('/')[2]), user, navigate, status));
  if (path.startsWith('/lobby/') && path.endsWith('/split')) {
    const socket = io({ autoConnect: false, auth: { token: localStorage.getItem('synchub.token') } });
    socket.on('connect', () => socket.emit('lobby:join', { lobbyId: decodeURIComponent(path.split('/')[2]), userId: user?.id }));
    socket.on('payment:confirmed', () => location.reload());
    socket.on('notify', message => {
      if (message.type === 'INFO' && message.message === 'Phòng đã hủy.') navigate(path, { replace: true });
    });
    socket.connect();
    cleanups.push(() => { socket.removeAllListeners(); socket.disconnect(); });
  }
  let disposed=false;
  document.querySelectorAll('[data-countdown-until]').forEach(el=>{const timer=createCountdown(el.dataset.countdownUntil);el.replaceWith(timer);cleanups.push(()=>timer.destroy?.());});
  if(path==='/'||path==='/discover') import('/assets/leaflet/leaflet-src.esm.js').then(L=>{const el=document.querySelector('#provider-map');if(disposed||!el)return;const map=L.map(el).setView([10.8752,106.8007],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors'}).addTo(map);const layer=L.layerGroup().addTo(map);document.querySelectorAll('[data-provider-lat]').forEach(card=>{const marker=L.circleMarker([Number(card.dataset.providerLat),Number(card.dataset.providerLng)],{radius:8,fillColor:'#059669',color:'#fff',weight:2,fillOpacity:.95}).addTo(layer);const popup=document.createElement('div');const strong=document.createElement('strong');strong.textContent=card.dataset.providerName;const address=document.createElement('p');address.textContent=card.dataset.providerAddress;const a=document.createElement('a');a.href=`/venues/${encodeURIComponent(card.dataset.providerId)}`;a.dataset.link='';a.textContent='Xem chi tiết →';popup.append(strong,address,a);marker.bindPopup(popup);});cleanups.push(()=>map.remove());}).catch(()=>{});
  cleanups.push(()=>{disposed=true;});
  return ()=>cleanups.forEach(fn=>fn());
}
