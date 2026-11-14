# Nghiệm thu Giai đoạn 4 trên Express

Ngày 14/11/2026. Nhánh `codex/migrate-vanilla-js` sạch trước khi triển khai tại `fe4192a`. Mốc giao diện trước thay đổi là vanilla từ commit đó. [Nghiệm thu Giai đoạn 3](../phase-3-results.md) · [Kiểm tra điều kiện bắt đầu](../phase-4-results.md)

## Cài và chạy

Đã chạy `npm ci --prefix server` từ cây cài trống với Node 24.22.1, rồi `npm run prisma:generate` để sinh Prisma Client 5.22.0. Cây dependency đã cài có Leaflet 1.9.4 và Socket.io 4.8.4, không có Vite hoặc các dependency frontend/test runner cũ. [Cây dependency](dependencies.txt)

Trước migration và seed, đã xác minh đích PostgreSQL 16.15 tại loopback cổng 55434. Hai schema public trống thuộc `synchub_phase4_demo` và `synchub_phase4_test`. `npm run prisma:deploy` áp dụng migration `20261106000000_init` cho từng DB, `npm run seed` nạp fixture vào DB demo. Suite tích hợp nhận `TEST_DATABASE_URL` của DB test riêng. [Phiên bản, bảng và migration đã áp dụng](database.txt)

`npm run dev` ở root chạy Express cùng giao diện và API tại cổng 5000. `npm start` chạy trực tiếp `node src/index.js`, đã kiểm tra health, shell cho URL sâu và Socket.io client ở cổng riêng 5500. [Log dev](express.txt) · [Log start](start.txt) · [Hướng dẫn](../../../README.md)

## Kết quả

| Nhóm | Kết quả |
| --- | --- |
| Suite backend | 65/65 pass, khớp baseline. [Log](backend.txt) |
| BR-SLT-01/02 | 20 request đồng thời trả đúng 1 HTTP 200 và 19 HTTP 409 `SLOT_TAKEN`. Ca giữ 10 phút pass. Với fixture đã quá hạn ghi theo UTC, tiến trình đang chạy phát `slot:released` qua WebSocket sau khoảng 48,2 giây chờ. DB chuyển slot về `AVAILABLE` và xóa `locked_by`, `locked_until`. Interval của tiến trình là 60 giây. |
| BR-INT-02 | Ca chuẩn trả 53.750, 58.500, 30.000 và 72.750 VND, tổng 215.000 VND. Largest Remainder, ưu tiên Host khi bằng phần dư, không có món và khấu trừ cọc đều pass. |
| BR-ESC-03 | Lần giải ngân lặp cùng khóa trả HTTP 409 `IDEMPOTENCY_DUPLICATE_RELEASE`. DB có đúng một giao dịch cho khóa được kiểm tra. |
| Express cùng origin | Health, JSON 404 API, shell cho URL trang sâu và wildcard, 404 asset/upload, CSS/ES modules, favicon, sprite và ảnh Leaflet đều pass. Không phục vụ server source, .env hoặc node_modules qua các đường dẫn kiểm tra. [Log HTTP](http.txt) |
| Bản đồ, QR, upload và transport | Đã mở popup Leaflet. Ảnh QR mời tải 220 px với URL mời cùng origin. VietQR thật tải 540 px sau khi tạo bill. Upload bằng chứng trả 201, GET trả đúng byte ảnh. Polling và WebSocket chấp nhận JWT hợp lệ, từ chối token sai hoặc thiếu. [Log](assets-final.txt) |
| Điều hướng và auth | 13/13 pass, gồm login có `from`, logout, JWT đã hết hạn, role guards, Back/Forward, reload và modal Escape/trả focus. Reload URL split được kiểm tra riêng. [Log browser](browser.json) |
| Realtime Host/Member | Snapshot thành viên và giỏ, cập nhật giỏ/chat ở hai phiên, giữ bản nháp và focus, reconnect đồng bộ lại và không lặp tin, khóa giỏ tức thì, REST trả 403 `LOBBY_LOCKED`. Chạy lại với Express độc lập sau khi dừng Vite đối chiếu. [Log](lobby-express.txt) |
| Schema | Đúng 12 model nghiệp vụ. Schema và migrations không có diff so với `87c4863` hoặc `fe4192a`. |

Ở mốc Giai đoạn 3, client gửi JWT trong handshake và server chưa xác thực. Giai đoạn 4 kiểm tra bằng bộ xác thực JWT dùng chung với REST. Luồng upload cùng origin thêm CSP sandbox và `nosniff` cho response tệp.

## So sánh giao diện

Chụp 87 ảnh mỗi bên với Chromium headless, 29 trạng thái ở 390×844, 768×1024 và 1440×900, cùng đồng hồ browser cố định và DB demo. Phạm vi gồm auth, discover/map, venue, join, lobby, split, wallet, disputes, provider, admin và styleguide. Trạng thái lobby đã khóa cho lượt chụp dùng response fixture cố định. Lượt kiểm tra realtime thực hiện khóa thật qua API.

Lượt đầu 77 cặp trùng pixel, 9 cặp chỉ khác vùng QR mời do origin khác nhau, và 1 cặp Provider ở 768×1024 có thêm một dòng slot do fixture quét slot được thêm giữa các lượt chụp. Chụp lại Provider wildcard ở cả ba viewport với fixture giống nhau cho kết quả trùng pixel ở cả ba. Không ghi nhận tràn ngang, ảnh hỏng, request tài nguyên lỗi hay lỗi JavaScript. Hai trạng thái lỗi API chủ đích là venue không tồn tại (404) và đăng nhập sai (401). [Đối chiếu pixel và lỗi](visual-diff.json) · [Đo lobby](lobby-measurements.json)

Ảnh gốc của lần chạy ở `/tmp/synchub-phase4/before` và `/tmp/synchub-phase4/after`. Ảnh chụp lại Provider ở `/tmp/synchub-phase4/provider-before` và `/tmp/synchub-phase4/provider-after`. Ảnh kiểm tra riêng ở `/tmp/synchub-phase4/leaflet.png`, `/tmp/synchub-phase4/invite-qr.png` và `/tmp/synchub-phase4/vietqr.png`.

Kiểm chứng triển khai giới hạn ở loopback và Chromium headless. Chưa chạy trên reverse proxy production hoặc trình duyệt khác. Ca phiên hết hạn dùng JWT đã hết hạn khi reload trang.

Ba sai lệch nghiệp vụ về hủy phòng liên đới, mẫu khóa hoàn tiền và giới hạn lịch sử chat vẫn thuộc Giai đoạn 5.
