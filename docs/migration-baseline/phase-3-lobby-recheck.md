# Kiểm chứng lại lobby giai đoạn 3

Ngày 14/11/2026. Đã sửa luồng realtime trong bản vanilla. Client đăng ký listener trước khi kết nối, tham gia lại room mỗi lần reconnect, đối chiếu trạng thái phòng qua REST, khử trùng lịch sử chat theo ID và dọn socket khi đổi trang. Cập nhật giỏ giữ bản nháp chat và trả focus về nút tương ứng. Mã server, schema, migration và socket payload giữ nguyên.

## Kết quả chạy

- `npm run build:vanilla --prefix client` và `node --check` cho `pages.js`/`app.js` đều đạt.
- `python -X utf8 -u scripts/verify_phase3_browser.py` đạt 11/11. Kiểm tra snapshot tại DOM sau khi client thực sự nhận packet, bao phủ cả polling trước khi nâng cấp WebSocket. Ca rời lobby dùng điều hướng SPA để kiểm tra socket đóng. [Log smoke](phase-3-lobby-smoke.json)
- `python -X utf8 -u scripts/verify_phase3_lobby.py` đạt với hai phiên Host/Member. Xác nhận snapshot bốn thành viên, tăng đúng một đơn vị và cập nhật cả hai phiên, giữ focus/nháp chat, reconnect nhận giỏ mới và không lặp tin, khóa giỏ tức thì ở Member và API trả `403 LOBBY_LOCKED`. [Log realtime](phase-3-lobby-realtime.txt)
- Hai frontend chạy qua Vite ở 5173 và 5180, dùng chung **một** Express cổng 5000 và một database demo mới trong cluster PostgreSQL 16.15 tạm. Xác minh database trống trước `npm run prisma:deploy --prefix server` và `npm run seed`. Playwright lấy mật khẩu fixture qua `SYNCHUB_SEED_PASSWORD` và lưu ảnh tại `SYNCHUB_LOBBY_ARTIFACTS`. Cluster được dừng sau lần chạy.

## Đối chiếu giao diện

Đã chỉnh lại header, giỏ, voucher, đề xuất, icon và cột thành viên của lobby. Chụp cùng Chrome, fixture `SYNC01` trước thao tác ghi, đồng hồ cố định, locale `vi-VN`, múi giờ `Asia/Ho_Chi_Minh` và reduced motion. Cả hai bản đều hiển thị countdown `44:38`, không tràn ngang và hiển thị thanh dưới đúng theo breakpoint. [Ảnh và số đo](screenshots/phase-3-lobby-recheck/)

| Viewport | Vị trí đầu giỏ, React / vanilla | Vị trí đầu khối thành viên, React / vanilla |
| --- | --- | --- |
| 390×844 | 362 / 363 px | 3468,50 / 3579,34 px |
| 768×1024 | 322 / 277 px | 2149,25 / 2282,56 px |
| 1440×900 | 234 / 233 px | 234 / 233 px |

Ở 768 px, tên sân và nút thao tác xuống dòng khác baseline. Chiều cao các khối giỏ và đề xuất làm lệch vị trí thành viên ở cả hai viewport dưới desktop. Header và khu QR cũng còn khác biệt. Các ảnh mới bao phủ lobby Host đang mở. Người dùng đã chấp nhận giao diện hiện tại với các sai khác đã ghi nhận và nghiệm thu giai đoạn 3. [Biên bản nghiệm thu](phase-3-results.md)
