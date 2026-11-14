# Giai đoạn 3 — Chuyển trang nghiệp vụ sang vanilla

Ngày cập nhật 14/11/2026. Trạng thái **đã nghiệm thu giai đoạn 3 theo xác nhận của người dùng**. Người dùng chấp nhận giao diện vanilla hiện tại, gồm các sai khác trực quan đã ghi nhận. Lần chạy backend gần nhất đạt 65/65 trên PostgreSQL riêng. Lần chạy browser mới đạt 11/11 và xác nhận realtime hai phiên. [Log backend](phase-4-test-results.txt) · [Kiểm chứng lobby](phase-3-lobby-recheck.md)

## Thay đổi

- Giữ nguyên frontend React và các lệnh `dev` / `build` hiện có. Bổ sung `npm run dev:vanilla` và `npm run build:vanilla` ở root; lệnh tương ứng cũng có trong `client`.
- Router History API dùng auth store, layouts và DOM components của Giai đoạn 2; giữ `synchub.token`, redirect `from`, deep link, wildcard và role guard. `/styleguide` vẫn là trang tham chiếu component.
- Chuyển các route trong bảng Giai đoạn 3: Login/Register/Profile; Discover `/` và `/discover`; Venue `/venues/:id`; Join `/join/:code` và redirect `/join`; Lobby `/lobby/:code`; Split `/lobby/:code/split`; Wallet; Disputes; Provider portal `/provider/*`; Admin dashboard `/admin/*`.
- Trang khám phá nạp provider thật, bộ lọc và bản đồ Leaflet. Venue nạp chi tiết/slot/menu và thao tác giữ slot. Join/Lobby đọc API, thành viên, cart và recommendation; hỗ trợ join, rời phòng, khóa/chốt phòng, voucher, cart, QR mời và chat socket. Split đọc bill, hiển thị QR, payment/check-in/release theo API hiện có. Wallet, disputes, provider và admin nạp dữ liệu API và gửi thao tác theo các REST contract hiện hữu.
- API/chat text được escape hoặc đưa vào DOM qua `textContent`; mỗi trang dọn fetch đang chạy, timer/countdown, Leaflet map và socket/listener khi unmount.

## Build và kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| `node --check client/vanilla/app.js`, `pages.js`, `components.js` | Pass |
| `npm run build:vanilla --prefix client` | Pass; bundle HTML/CSS/JS vanilla và Leaflet được tạo. |
| `npm run build --prefix client` | Pass; `tsc -b` và build React hiện tại thành công. |
| Playwright browser smoke | 10/11 kiểm tra pass: login redirect/`from`, Back/Forward, deep-link reload, guard HOST/MEMBER/PROVIDER/ADMIN, modal Escape/focus return, register validation và socket cleanup. `lobby:members` không được nhận trong phiên Socket.IO, dù `cart:updated` được nhận. |
| Ảnh và đo viewport | 87 ảnh (29 tình huống × 390×844, 768×1024, 1440×900); không có tràn ngang, font không tải, lỗi request tài nguyên, ảnh chưa tải hoặc lỗi JavaScript trong lần chụp cuối. |
| Các response API lỗi trong ảnh | 404 cho provider không tồn tại và 401 cho đăng nhập sai; đây là hai trạng thái lỗi chủ đích của capture. |
| Bộ test backend | Chưa chạy: môi trường không có `TEST_DATABASE_URL`. Không dùng database demo/dev hoặc fallback `DATABASE_URL`. Vì vậy Giai đoạn 3 chưa tái xác nhận BR-SLT-01/02, BR-INT-02, BR-ESC-03. |

Log smoke/build và dữ liệu đo ảnh: [phase-3-test-results.txt](phase-3-test-results.txt), [capture-results.json](screenshots/phase-3/capture-results.json). Script Playwright: [capture_phase3_scenarios.py](../../scripts/capture_phase3_scenarios.py), [verify_phase3_browser.py](../../scripts/verify_phase3_browser.py). Ảnh lưu trong [screenshots/phase-3](screenshots/phase-3/).

## Route và bằng chứng ảnh

Đã chụp các route/role: login, register, discover, venue, join redirect/invite, profile, lobby host/member/locked, split, wallet, disputes, provider/provider wildcard, admin/admin wildcard, styleguide và wildcard redirect. Các trạng thái bổ sung gồm empty, API error, loading, split completed/error, modal-open, button-hover, keyboard-focus và login-error. Mỗi trường hợp có ảnh ở cả ba viewport.

So sánh ảnh phase-3 với React baseline cho thấy còn sai khác bố cục ở các trang nghiệp vụ, đáng chú ý là lobby mobile: khu vực recommendations/giỏ, vị trí nav cố định và trạng thái hạn chốt không trùng ảnh tham chiếu. Countdown của fixture hiện về `00:00` vì thời hạn API đã qua; không thay dữ liệu fixture bằng dữ liệu giả. Xem ví dụ [lobby vanilla 390×844](screenshots/phase-3/lobby-host-390x844.png) và [lobby baseline 390](screenshots/390/lobby-host.png). Đây chưa phải đối chiếu pixel hoàn tất cho toàn bộ route.

## Căn cứ nghiệm thu

1. Đã xác minh cả snapshot thành viên và giỏ trong hai phiên, đồng bộ giỏ/chat, reconnect và khóa giỏ. Smoke mới kiểm tra snapshot mà ứng dụng nhận được qua Socket.io, bao gồm trường hợp transport ban đầu là polling.
2. Đã đối chiếu lại 65 test và ba ca bắt buộc trên database test riêng trong [lần kiểm tra điều kiện giai đoạn 4](phase-4-results.md).
3. Người dùng chấp nhận bản giao diện hiện tại dựa trên bộ ảnh giai đoạn 3 và lượt đối chiếu lobby mới. Lượt đối chiếu mới bao phủ lobby Host đang mở ở ba viewport. Các sai khác và giới hạn của phép đo được lưu trong [biên bản đối chiếu lobby](phase-3-lobby-recheck.md).

Không thay backend, schema Prisma 12 bảng, business rules, seed, migration hoặc xử lý các sai lệch đã được baseline dành cho Giai đoạn 5.
