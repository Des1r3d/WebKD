# SyncHub — Bản đồ codebase

SyncHub là ứng dụng web ghép kèo đặt sân hoặc phòng học, gọi món F&B theo nhóm và chia chi phí cho từng thành viên. Host giữ khung giờ, tạo phòng và mời bạn. Thành viên đặt món và nhận VietQR cá nhân. Hệ thống mô phỏng xác nhận thanh toán, giữ tiền trung gian và giải ngân sau điểm danh. Nhà cung cấp quản lý lịch hoặc thực đơn, còn Admin xử lý khiếu nại và theo dõi hoạt động.

[CONTEXT.md](CONTEXT.md) là đặc tả khóa của 12 bảng và 15 luật nghiệp vụ. [design.md](design.md) quy định hệ thiết kế Emerald Pulse. Khi sửa giao diện, giữ nguyên logic và tên trường dữ liệu. Bản đồ này dựa trên mã nguồn, schema, cấu hình và test trong repo. Bằng chứng kiểm chứng được lưu trong `docs/migration-baseline/`.

## Cách dùng làm context cho LLM

Đọc [AGENTS.md](AGENTS.md) và [CONTEXT.md](CONTEXT.md) trước khi thiết kế, sửa code hoặc viết test. Nếu nhiệm vụ liên quan giao diện, đọc thêm [design.md](design.md). Dùng bảng dưới đây để mở các file liên quan trực tiếp. Đối chiếu yêu cầu nghiệp vụ với hành vi hiện tại trong route, service và test trước khi thay đổi.

| Nhiệm vụ | Đọc tiếp |
| --- | --- |
| API, phân quyền hoặc dữ liệu trả về | Bắt đầu ở `server/src/app.js` để tìm prefix, rồi đọc router và controller tương ứng. Kiểm tra JWT và quyền sở hữu tài nguyên phía server. Đối chiếu nơi gọi trong `client/src/pages/` và kiểu dữ liệu trong `client/src/types.ts`. |
| Slot, phòng và cọc | Đọc `services/slotLock.js`, `services/lobby.js` và `utils/reputation.js` trong `server/src/`, rồi xem `bookslot.test.js`. Phân biệt vai trò JWT với quyền của người có `host_id` trong từng phòng. |
| Giỏ hàng, chat hoặc trạng thái phòng | Đọc `client/src/pages/Lobby.tsx`, `server/src/sockets/lobby.socket.js` và `server/src/controllers/lobby.controller.js`. Đối chiếu payload Socket.io và đường REST thêm món khi sửa giỏ hàng. `grouporder.test.js` kiểm tra đường REST. |
| Chia bill, tiền hoặc trạng thái thanh toán | Đọc `splitBill.js`, `escrow.js` và `dispute.js` trong `server/src/services/`. Kiểm tra phép làm tròn, ranh giới transaction, khóa duy nhất và trạng thái tương ứng trong schema. Tìm ca hồi quy trong `split-bill.test.js`, `escrow.test.js` và `dispute-admin.test.js`. |
| Giao diện | Tìm trang từ `client/src/router.tsx`, rồi kiểm tra layout, component trong `client/src/ui/` và token CSS trước khi sửa. |

Khi thấy hành vi hiện tại lệch đặc tả, nêu rõ đoạn mã và luật liên quan. Dùng mục «Điểm cần đối chiếu với đặc tả» để nhận diện những khác biệt đã biết.

## Kiến trúc và điểm vào

| Lớp | Bắt đầu ở đâu |
| --- | --- |
| Client | [client/src/main.tsx](client/src/main.tsx) khởi động React. [client/src/router.tsx](client/src/router.tsx) khai báo các trang công khai, khu Host/Member và portal Provider/Admin. Các trang nằm trong `client/src/pages/`, còn `RoleGuard` kiểm tra vai trò để điều hướng trên client. |
| Giao tiếp | [client/src/lib/api.ts](client/src/lib/api.ts) gọi REST và thêm JWT Bearer từ local storage. [client/src/lib/socket.ts](client/src/lib/socket.ts) tải Socket.io client khi cần và gửi token qua handshake. |
| Server | [server/src/app.js](server/src/app.js) gắn router Express, phục vụ `/uploads` và khai báo `GET /api/health`. Luồng REST đi từ `routes/` qua middleware xác thực/phân quyền, rồi đến `controllers/` và `services/` hoặc Prisma. [server/src/index.js](server/src/index.js) khởi động HTTP, Socket.io và tác vụ quét slot hết hạn mỗi 60 giây. |
| Dữ liệu | [server/prisma/schema.prisma](server/prisma/schema.prisma) khai báo 12 model ánh xạ sang PostgreSQL 16. Migration nằm trong `server/prisma/migrations/`. [server/prisma/seed.js](server/prisma/seed.js) tạo dữ liệu demo và fixture kiểm thử. |
| Giao diện | `client/src/styles/tokens.css` và `client/tailwind.config.js` chứa token thiết kế. `client/src/ui/` chứa component dùng chung, có thể xem qua `/styleguide`. Discover dùng Leaflet để hiển thị bản đồ. |

Các bảng đã khóa gồm `users`, `providers`, `slots`, `menu_items`, `group_lobbies`, `lobby_members`, `cart_items`, `vouchers`, `split_bills`, `escrow_transactions`, `disputes` và `audit_logs`. Tiền lưu bằng số nguyên VND. Quy ước nghiệp vụ là lưu thời gian theo UTC và hiển thị theo `Asia/Ho_Chi_Minh`.

## Theo dấu các luồng chính

1. **Đăng nhập và tìm sân.** `auth.controller.js` xử lý đăng ký, đăng nhập và hồ sơ tại `/api/auth`. `middlewares/auth.js` xác thực JWT và kiểm tra vai trò phía server. `Discover.tsx` và `Venue.tsx` đọc danh sách, chi tiết sân hoặc quán qua `/api/providers`.
2. **Giữ slot và tạo phòng.** `Venue.tsx` gọi `POST /api/slots/:id/lock`. `services/slotLock.js` dùng một cập nhật có điều kiện để giữ slot trống hoặc đã hết hạn trong 10 phút. Yêu cầu thua tranh chấp nhận `409 SLOT_TAKEN`. Host tạo phòng qua `POST /api/lobbies`. `services/lobby.js` xử lý mã mời và tham gia phòng, dùng hạng uy tín để tính cọc 0%, 30% hoặc 100% phần sân dự kiến. Điểm dưới 50 bị chặn tham gia.
3. **Đặt món và chốt giỏ.** `Lobby.tsx` đọc trạng thái phòng, gợi ý quán và áp voucher qua REST. `server/src/sockets/lobby.socket.js` xử lý giỏ hàng và chat trong room `lobby:{lobbyId}`. Tin nhắn nằm trong bộ nhớ tiến trình. Các thao tác sửa giỏ yêu cầu phòng còn `OPEN`. Khi chốt qua `POST /api/lobbies/:id/lock`, server phát `lobby:locked`. Server cũng có `POST /api/lobbies/:id/cart` để thêm món qua REST.
4. **Chia bill và xác nhận thanh toán.** `POST /api/lobbies/:id/split` gọi `services/splitBill.js` để chia tiền sân, cộng tiền món từng người, phân bổ điều chỉnh F&B theo tiền món và làm tròn Largest Remainder. Tổng trước khấu trừ cọc phải khớp tổng hóa đơn. Kết quả được lưu trong `split_bills` cùng URL VietQR. `Split.tsx` gọi `POST /api/payments/webhook-mock` để mô phỏng thanh toán. `services/escrow.js` ghi giao dịch `HOLD`. Khi tất cả bill đã trả, phòng chuyển `PAID` và slot thành `BOOKED`.
5. **Điểm danh, giải ngân và khiếu nại.** `POST /api/lobbies/:id/checkin` đi qua `services/escrow.js` để xử lý điểm danh, cập nhật uy tín và tách giải ngân cho sân và quán. Khóa `release:{lobby_id}:{provider_id}` có ràng buộc duy nhất. `POST /api/disputes` nhận URL hoặc ảnh bằng chứng. `services/dispute.js` xử lý đóng băng khoản tiền liên quan và phân xử qua `PATCH /api/admin/disputes/:id`, kèm bản ghi audit. Portal Provider và Admin dùng các route thống kê và quản lý tương ứng.

Bản vanilla dùng `client/vanilla/index.html`, `app.js` (router/auth), `pages.js` (trang nghiệp vụ), `components.js`, `styles.css` và `phase3.css`. Trạng thái nghiệm thu được ghi trong [MIGRATION_PLAN.md](MIGRATION_PLAN.md).

## Điểm cần đối chiếu với đặc tả

| Hạng mục | Đặc tả và hiện trạng |
| --- | --- |
| Hủy phòng | `CONTEXT.md` có luồng hủy liên đới. `server/src/routes/lobby.routes.js` hiện chưa đăng ký `POST /api/lobbies/:id/cancel`. |
| Khóa hoàn tiền | BR-ESC-03 dùng mẫu `refund:{lobby_id}:{split_bill_id}`. Service phân xử khiếu nại hiện tạo khóa `refund:{lobby_id}:{dispute_id}`. |
| Giới hạn lịch sử chat | `CONTEXT.md` quy định 50 tin nhắn/phòng. Socket server hiện giữ 100 tin nhắn gần nhất. |

## Chạy cục bộ và kiểm thử

Từ thư mục gốc, khởi động PostgreSQL, chờ container sẵn sàng rồi chạy các lệnh còn lại.

```sh
docker compose up -d postgres
npm run setup
npm run seed
npm run dev
```

`npm run setup` cài dependencies cho hai ứng dụng, tạo `server/.env` từ mẫu nếu chưa có, sinh Prisma Client và áp dụng migration. Kiểm tra `DATABASE_URL` trước khi chạy. Server đọc `PORT` (mặc định 5000), `JWT_SECRET`, `JWT_EXPIRES_IN` và cấu hình VietQR qua `VIETQR_BANK`, `VIETQR_ACCOUNT`, `VIETQR_NAME`. Bản React chạy ở cổng 5173. Chạy `npm run dev:vanilla` với Express đang hoạt động để xem bản đối chiếu `client/vanilla/` (mặc định cổng 5174). Dùng `npm run start --prefix server` để chạy Express khi triển khai API. Khi `VITE_API_URL` để trống, Vite proxy `/api` và `/socket.io` đến `localhost:5000`. Dùng `GET /api/health` để kiểm tra tiến trình Express.

`npm run build` build bản React. `npm test` dùng Node test runner và Supertest, chạy từng file JavaScript tuần tự với `TEST_DATABASE_URL`. Dùng PostgreSQL riêng cho phát triển hoặc kiểm thử vì `npm run seed` và các suite tích hợp gọi seed sẽ xóa dữ liệu rồi nạp lại fixture. Các ca dưới đây được xác định bằng cách đọc test.

| Luật | Test hiện có và kỳ vọng |
| --- | --- |
| BR-SLT-01/02 | [bookslot.test.js](server/tests/bookslot.test.js) gửi 20 yêu cầu khóa cùng slot. Đúng 1 yêu cầu nhận `200`, 19 yêu cầu nhận `409 SLOT_TAKEN`. |
| BR-INT-02 | [split-bill.test.js](server/tests/split-bill.test.js) kiểm tra ca 4 người với tổng 215.000 VND, các ca biên làm tròn Largest Remainder, ưu tiên Host khi bằng nhau và khấu trừ cọc. [grouporder.test.js](server/tests/grouporder.test.js) kiểm tra ca chuẩn qua API. |
| BR-ESC-03 | [escrow.test.js](server/tests/escrow.test.js) gọi check-in và giải ngân hai lần. Lần hai nhận `409 IDEMPOTENCY_DUPLICATE_RELEASE` và cơ sở dữ liệu chỉ có một giao dịch cho khóa được kiểm tra. |
