# Kiểm chứng Giai đoạn 5 trên Express

Mốc Giai đoạn 5 ngày 14/11/2026. Mốc đối chiếu là `fe4192a` và cây làm việc Giai đoạn 4 tại thời điểm bắt đầu, gồm 79 tệp tracked khác HEAD và ba mục untracked trong `git status --short`. Index lúc đó trống. Bản sao ở `/tmp/synchub-phase5/phase4.patch`, `phase4-untracked.tar` và `phase4-status.txt`. SHA-256 của `git diff --binary` là `ab589c50acd3f6f8cf5b5bdbdb00896e24b9ef9190ca1d326b5aaaa4665fb1`. Các thay đổi Express Giai đoạn 4 được giữ trong cây làm việc. Hai quyết định nghiệp vụ được chốt sau lượt kiểm chứng đầu tiên. [Biên bản Giai đoạn 4](../phase-4-express/README.md)

## Lệnh và kết quả

| Lệnh hoặc thao tác | Kết quả |
| --- | --- |
| `node -v`, `initdb`, `pg_ctl`, `createdb`, `psql "$TEST_DATABASE_URL"` | Node 24.22.1, PostgreSQL 16.15. Xác minh DB riêng `synchub_phase5_test` tại 127.0.0.1:55435, schema public trống trước migration. Dùng DB này cho seed qua test fixtures và cho Express smoke. [Xác minh đích](database.txt) |
| `DATABASE_URL="$TEST_DATABASE_URL" npm run prisma:deploy` | Áp dụng `20261106000000_init`. DB có đúng 12 bảng nghiệp vụ, schema và file migration không có diff. [Deploy](deploy.txt) · [Kiểm tra SQL](final-schema.txt) |
| `cd server && node --import ./tests/setup.js --test --test-concurrency=1 $(git ls-files -- tests/\*.test.js)` trước khi sửa | 65/65 pass. Một lượt gọi runner trực tiếp thiếu `--test-concurrency=1` làm các fixture seed ghi đè lẫn nhau. Chạy lại tuần tự theo cấu hình repo. [Baseline](baseline-sequential.txt) |
| `npm test` | 82/82 pass sau khi sửa các lỗi nghiệp vụ, chạy tuần tự trên Node 24.22.1. [Kết quả](final-suite.txt) |
| `DATABASE_URL="$TEST_DATABASE_URL" PORT=5507 node server/src/index.js`, rồi `python3 scripts/verify_phase3_lobby.py` và `python3 scripts/verify_phase5_cancel.py` | Chromium trên Express cùng origin ở 390×844, 768×1024, 1440×900. Host/Member cập nhật giỏ và chat, giữ focus và bản nháp, reconnect không nhân đôi tin, nhận khóa và hủy realtime. Phòng đã hủy hiện badge và giỏ trống ở cả ba viewport. Giỏ dùng ID làm tiêu chí phụ khi trùng thời điểm tạo để giữ thứ tự snapshot. Test focus định danh đúng nút theo ID dòng. UI dùng nút outline, badge và thông báo sẵn có theo design.md. [Realtime](browser-lobby.txt) · [Hủy và SYNC00](browser-cancel.txt) |
| `npm run seed` với `DATABASE_URL="$TEST_DATABASE_URL"` đã xác minh | Nạp lại fixture OPEN sau suite. Lượt smoke đầu dùng fixture đã bị suite thay đổi nên timeout lúc chờ nút giỏ hàng bật. [Seed](seed.txt) |
| `node scripts/verify_phase4_http.mjs` và `python3 scripts/verify_phase3_browser.py` | HTTP và tài nguyên cùng origin pass. 13/13 ca điều hướng, xác thực, bàn phím và vòng đời socket pass. [HTTP](http.txt) · [Điều hướng](browser-nav.json) |

## Ba lỗi đã kiểm tra

| Lỗi | Trước sửa | Sau sửa |
| --- | --- | --- |
| Chat giữ 100 | Gửi 55 tin, vào lại nhận cả 55. [Log](chat-before.txt) | Nhận tin 6–55 theo thứ tự và payload cũ. Phòng khác giữ riêng hai tin. |
| Hủy liên đới | Route trả 404 cả sáu ca. [Log](first-regressions.txt) | Chỉ HOST sở hữu phòng hủy được. Cho phép OPEN, LOCKED, AWAITING_PAYMENT, PAID. Một transaction hủy giỏ F&B, chuyển HELD và các bill đã trả tương ứng sang REFUNDED, nhả slot và ghi audit. Hủy lặp và webhook đến muộn trả 409. Ca ép lỗi audit rollback. Race với webhook và giải ngân không để lại cả hoàn lẫn giải ngân. |
| Khóa hoàn tiền | Bốn test hồi quy thất bại. Fixture SYNC00 có `refund:lob-00-prev:dsp-01`, 25.000 VND, không gắn split bill. [Log](refund-before.txt) · [Dữ liệu cũ](legacy.txt) | Khóa chuẩn gắn từng bill, phân bổ theo tỷ lệ khoản đã giữ và Largest Remainder, giới hạn theo số đã thanh toán và tiền provider đang FROZEN. Lặp/đồng thời chỉ ghi một quyết định. Bản ghi khóa cũ thiếu split bill được giữ và cần đối chiếu trước khi hoàn tiếp. Bill đã có refund chuẩn được loại khỏi lần phân bổ tiếp theo. |

SYNC00 được kiểm tra riêng với fixture COMPLETED. Trang chia bill mở được, không gọi POST tạo bill. POST trực tiếp trả `409 INVALID_STATUS`. Kịch bản Giai đoạn 0 từng trả 500 `NO_ACTIVE_MEMBERS` do trang tự gọi tạo bill. Fixture vẫn thiếu bill lịch sử.

## Đối chiếu 15 BR

| BR | Ca và kết quả |
| --- | --- |
| SLT-01 | `bookslot.test.js` giữ 10 phút và quét quá hạn pass. |
| SLT-02 | 20 request đồng thời, đúng 1 HTTP 200 và 19 HTTP 409 `SLOT_TAKEN`. |
| INT-01 | Tạo phòng từ slot đang giữ và giỏ OPEN pass. Tái đặt slot sau hủy bị chặn và giữ nguyên quan hệ lịch sử. |
| INT-02 | 53.750, 58.500, 30.000, 72.750 VND, tổng 215.000. Các ca Largest Remainder, hòa ưu tiên Host, không món và cọc pass. |
| INT-03 | Bảy ca hủy, gồm giới hạn đặt lại, và smoke realtime pass. Rời sau khóa giữ 9.000 VND từ cọc trong ca fixture, ghi một bút toán dù gọi đồng thời, trừ khỏi phần còn phải chia và hoàn nếu phòng hủy. |
| INT-04 | `grouporder.test.js` và Chromium Host/Member pass, REST sửa giỏ sau khóa trả 403. |
| INT-05 | Voucher CROSS hợp lệ và quá khoảng cách pass. |
| REP-01 | Hạng A/B/C và chặn dưới 50 pass theo auth/bookslot. |
| REP-02 | NO_SHOW, trừ 15 điểm, PENALTY và audit pass trong escrow. |
| REP-03 | CHECKED_IN cộng 2, chặn vượt 100 và ghi audit pass. |
| ESC-01 | HOLD và đủ bill chuyển PAID/BOOKED pass. Webhook đến sau hủy trả 409. |
| ESC-02 | Vector giải ngân VENUE/FNB 8%/12% pass. Ca VENUE và CROSS dùng giá chốt tại lúc chia bill, kể cả voucher đổi trước giải ngân. |
| ESC-03 | Release lặp trả HTTP 409 `IDEMPOTENCY_DUPLICATE_RELEASE` với một hiệu ứng. Refund chuẩn, giới hạn, đồng thời và dữ liệu cũ pass. Quyết định tiếp theo chỉ phân bổ trên các bill chưa hoàn. |
| ESC-04 | Ca đóng băng provider được nhắm đến pass. Khiếu nại đến sau giải ngân trả 409. Khoản còn khiếu nại OPEN tiếp tục FROZEN khi Admin phân xử từng đơn. |
| DSP-01 | Duyệt hoàn, giới hạn tiền, audit và RBAC pass. Yêu cầu vượt số dư của các bill chưa hoàn trả 409 và giữ khiếu nại OPEN. |

## Hai quyết định đã áp dụng

- **BR-INT-01/03, tái đặt sau hủy.** Slot vẫn về AVAILABLE và giữ FK từ lobby CANCELLED cùng lịch sử escrow. API giữ slot trả `409 SLOT_TAKEN` và API tạo phòng trả `409 LOBBY_EXISTS`. Ca tích hợp kiểm tra cả hai API và đối chiếu trạng thái DB trước/sau. [Smoke trước khi chốt](rebook.txt)
- **BR-ESC-03/DSP-01, quyết định hoàn tiếp.** Các bill đã có REFUND bị loại khỏi phân bổ. Nếu tiền FROZEN hoặc tổng số dư các bill chưa hoàn không đủ, API trả `409 REFUND_EXCEEDS_AVAILABLE` và giữ khiếu nại OPEN. Hồ sơ cũ thiếu liên kết bill vẫn trả `409 REFUND_REQUIRES_REVIEW`. Hai ca tích hợp kiểm tra lần hoàn thứ hai khi còn bill đủ tiền và khi mọi bill đã hoàn.
- Cả ba ca đều thất bại trước khi sửa và pass trong suite cuối. [Kết quả trước sửa](decisions-before.txt) · [Suite cuối](final-suite.txt)

## Cơ chế áp dụng cho các lỗi còn lại

- **BR-INT-03.** Khóa dòng lobby trong transaction trước khi đổi thành viên và khấu trừ cọc. Trước khi có bill, giữ tối đa phần sân và số cọc đã đóng, ghi một bút toán `PENALTY/HELD` có khóa theo phòng và người rời. Khoản giữ được tính vào tiền sân đã chi trả. Sau khi có bill, dùng phần sân và offset đã chốt, giữ bill và lịch sử thanh toán. Thành viên LEFT không được điểm danh lại.
- **BR-ESC-02.** Lưu tổng gộp VENUE/FNB trong audit log cùng transaction sinh bill. Khi check-in, tính hoa hồng từ các tổng đã chốt. Với bill cũ thiếu bản chốt, dùng công thức tương thích từ dữ liệu hiện lưu. Ca VENUE trả gross 108.000/115.000 VND và CROSS trả 102.000/115.000 VND.
- **BR-ESC-04/DSP-01.** Dùng cùng khóa dòng lobby cho gửi khiếu nại, check-in và phân xử. Provider đã nhận tiền giữ nguyên sổ cái và API từ chối yêu cầu đóng băng. Trường hợp nhiều khiếu nại mở trước giải ngân, khoản còn lại tiếp tục FROZEN cho đến khi xử lý xong khiếu nại cuối cùng của provider.
- Bốn ca hồi quy thất bại trước sửa và pass trong suite cuối. [Trước sửa](remaining-before.txt) · [Suite cuối](final-suite.txt)

## Mốc nghiệm thu

Giai đoạn 4 hoàn tất chuyển công nghệ theo biên bản Express. Giai đoạn 5 hoàn tất sửa nghiệp vụ và kiểm chứng ngày 14/11/2026 với 82/82 ca tích hợp và unit, 13/13 ca điều hướng, smoke realtime ở ba viewport và đối chiếu 15 BR. Ảnh của lượt smoke nằm ở `/tmp/synchub-phase5/lobby/`. [Số đo theo viewport](lobby-measurements.json)
