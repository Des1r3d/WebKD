# Kế hoạch nội dung & bố cục — SyncHub

## 1. Mục tiêu

- Bảo vệ đồ án trong **15–18 phút** (tổng notes **15:45**), ưu tiên **phân tích nghiệp vụ (BA)** trước khi đi vào sản phẩm và kỹ thuật.
- 6 slide BA (04–09) trả lời bốn câu hỏi: ai là tác nhân, quy trình hiện tại đứt ở đâu, hệ thống đích thay đổi gì, và mỗi yêu cầu được chứng minh bằng gì.
- Mỗi slide chỉ một ý lớn; số liệu khớp báo cáo mới và code mới; ảnh là ảnh chụp thật từ app.

## 2. Mạch kể

1. **Vì sao** — một buổi chơi nhóm đang bị chia cắt giữa 3–4 công cụ; sáu tác nhân, bốn nhóm quyền.
2. **Hiện trạng → tương lai** — AS-IS có năm bước và ba nguồn sự thật; TO-BE gom về một phòng với bốn thay đổi cốt lõi.
3. **Phân tích** — 14 use case, 21 business rule, 14 FR/6 NFR, ma trận truy vết UC → FR → BR → code → test.
4. **Giải pháp** — năm bước sản phẩm, ba góc nhìn, bốn điểm kỹ thuật lõi (BookSlot, GroupOrder, Split Bill, Escrow).
5. **Đánh giá** — phí 8%/12%, take rate 9,8%, 82/82 test, hạn chế đã biết và lộ trình.

## 3. Bố cục từng slide

| # | Tiêu đề | Nội dung chính | Hình ảnh / bằng chứng | Nhịp |
|---|---|---|---|---|
| 01 | SyncHub — Một phòng cho cả buổi chơi | Tên, tagline, 4 module, nhóm, GVHD | Phone mockup màn hình khám phá + card 215.000đ | Mở |
| 02 | 15–18 phút, 6 phần | 6 phần + thời lượng; 3 số neo: 82/82, 14 UC, 21 BR | Panel forest bên phải | Chuyển |
| 03 | Một buổi chơi, bốn lần đứt gãy | Chốt sân / gom món / chia tiền / giữ tiền; ví dụ + hệ quả | 4 card, không ảnh | Bài toán |
| 04 | Sáu tác nhân, bốn nhóm quyền | Khách, Host, Member, Venue, F&B, Admin; mục tiêu + điểm kiểm soát + UC liên quan | 6 card + dải 3 lớp JWT → role → ownership | BA 1 |
| 05 | Một buổi chơi, năm bước, ba nguồn sự thật | 5 bước AS-IS (chat, gọi sân, sheet, chuyển khoản, đối soát); 3 nguồn: lịch sân, tiền, món | 5 card + 3 nguồn + dải hệ quả | BA 2 |
| 06 | Từ ba nguồn sự thật đến một phòng | 4 thay đổi: giữ chỗ, gom món, đối chiếu, sự cố; mỗi dòng gắn BR | Bảng As-Is → To-Be + 3 metric | BA 3 |
| 07 | 14 use case, 4 phân hệ, 6 tác nhân | 4 module: khám phá & giữ chỗ; phòng & giỏ; chia tiền & thanh toán; ngoại lệ & quản trị | 4 card, mã UC + tác nhân | BA 4 |
| 08 | 21 quy tắc nghiệp vụ, 6 nhóm | ACC/DSC, SLT, INT, ESC/DSP, REP/LBY, PRV/ADM/RT; ngoại lệ tiêu biểu | 6 card + dải 21 BR · 14 FR · 82 test | BA 5 |
| 09 | Từ yêu cầu đến bằng chứng, không có khoảng trống | 14 UC, 14 FR, 21 BR, 6 NFR; 6 dòng truy vết tiêu biểu; 82/82 test | 4 số lớn + bảng UC → FR → BR → code → test | BA 6 |
| 10 | Năm bước, một mã phòng | Giữ slot → mở phòng → chốt giỏ → chia bill → ký quỹ | 5 card + mũi tên + dải kết quả | Giải pháp |
| 11 | Khám phá và giữ chỗ trong một màn hình | 25 địa điểm/3 km, Leaflet, slot 10 phút, seed thật | Screenshot discover + venue | Sản phẩm |
| 12 | 20 request cùng lúc, đúng một người thắng | UPDATE có điều kiện, 409, 10 phút, job 60 giây, hủy phòng | Code block + 1/20 + 20 chấm | Kỹ thuật 1 |
| 13 | Cả nhóm cùng chốt trong một giỏ | Socket.io room, cart lock, chat 50 tin, voucher CROSS | Screenshot lobby chat + công thức gợi ý | Kỹ thuật 2 |
| 14 | 215.000đ → 4 hóa đơn, không lệch một đồng | Bảng A/B/C/D; 5 bước; cọc; Largest Remainder | Bảng số + 5 bước + card tổng | Kỹ thuật 3 |
| 15 | Tiền chỉ chảy khi buổi chơi được xác nhận | HELD/RELEASED/FROZEN/REFUNDED; idempotency; hủy phòng; rời muộn | 4 card số + flow + screenshot ví | Kỹ thuật 4 |
| 16 | Uy tín quyết định ai được vào phòng | A/B/C/FLAGGED; check-in +2, no-show −15; khiếu nại có ảnh | 4 tier + screenshot khiếu nại | Kỹ thuật 5 |
| 17 | Một hệ sinh thái, ba góc nhìn | Member / Provider / Admin; số liệu mỗi vai trò | 3 ảnh thật (mobile, portal, dashboard) | Sản phẩm |
| 18 | Doanh thu trên mỗi giao dịch, không phải quảng cáo | 8% sân, 12% F&B; 215.000 → 194.000 + 21.000; take rate 9,8% | 2 card phí + waterfall + panel take rate | Kinh doanh |
| 19 | Biết giới hạn để không hứa quá | 5 hạn chế hiện tại; 4 việc tiếp theo; roadmap 3 quý | 2 cột + 3 card roadmap | Đánh giá |
| 20 | Một phòng. Không lệch đồng nào. Một sổ cái. | 3 giá trị; cảm ơn; Q&A; tài khoản demo | Nền forest + card demo | Kết |

## 4. Nguyên tắc trình bày

- Mỗi slide chỉ một ý lớn; tiêu đề là một câu khẳng định, không phải nhãn.
- Phần BA (04–09) không đọc hết bảng: chọn 1–2 tác nhân, 1 quy trình, 3 use case khó, 2 BR và 1 dòng truy vết để kể.
- Số liệu quan trọng đặt ở dạng lớn (82/82, 9,8%, 1/20, 215.000đ, 14/14 UC).
- Ảnh chụp đặt trong card bo góc, có caption nguồn; không dùng ảnh mock.
- Code block chỉ giữ phần quyết định (điều kiện UPDATE, idempotency key), không dán nguyên file.
- Speaker notes viết theo văn nói, có mốc thời gian; không đọc lại chữ trên slide.

## 5. Chuẩn bị Q&A

### BA

- **Vì sao 14 use case?** Bốn phân hệ, mỗi tác nhân có mục tiêu riêng; 14 UC phủ trọn luồng từ khám phá đến quyết toán và ngoại lệ, không chỉ màn hình.
- **BR khác FR thế nào?** FR nói hệ thống làm gì; BR nói điều kiện, thứ tự và ngoại lệ. Mỗi BR có test tương ứng.
- **Traceability để làm gì?** Chứng minh không có yêu cầu nào bị bỏ rơi giữa tài liệu, code và test; 14/14 UC có test, 0 FR chưa ánh xạ.
- **Nếu thu hẹp MVP?** Giữ UC-02/03/04/06/08/09/10; bỏ chat, gợi ý và portal đối tác; vẫn đủ luồng đặt – chia – trả – check-in.
- **Vì sao tách Venue và F&B?** Hai loại đối tác có dữ liệu và quyền khác nhau (slot vs menu); gộp sẽ làm BR và phân quyền phức tạp hơn.

### Kỹ thuật

- **Vì sao không dùng Redis/mutex?** PostgreSQL đã có row lock; một câu UPDATE có điều kiện là đủ cho phạm vi đồ án, ít thành phần hơn.
- **Vì sao chat không lưu DB?** Giới hạn 12 bảng; chat là dữ liệu phiên, giới hạn 50 tin/phòng, chấp nhận mất khi restart.
- **Vì sao 8%/12%?** Giả định trong seed; schema lưu `commission_rate` theo đối tác để thay đổi không cần migration.
- **Nếu thanh toán thật?** Cần webhook signature, đối soát, trạng thái treo, hoàn một phần; đã ghi trong hạn chế.
- **Nếu hai người cùng check-in?** `SELECT … FOR UPDATE` trên phòng + idempotency key của release.
- **Vì sao slot hủy không đặt lại được?** Giữ lịch sử để truy vết; muốn tái sử dụng phải tách bảng lịch sử khỏi slot (roadmap).
- **Điểm khác biệt lớn nhất?** Đơn vị quản lý là phòng gắn slot, không phải đơn hàng rời hay slot rời.

## 6. Checklist trước khi nộp

- [ ] Điền học phần, GVHD, mã nhóm, họ tên thành viên.
- [ ] Kiểm tra lại ảnh chụp khớp phiên bản code tại thời điểm nộp.
- [ ] Chạy lại `npm --prefix server test` và xác nhận 82/82.
- [ ] Mở PDF trên máy chiếu, kiểm tra font và tương phản.
- [ ] Tập ít nhất một lần bấm giờ; mục tiêu 15:30–16:30.
- [ ] Chuẩn bị sẵn tab demo SYNC01 và tài khoản host/provider/admin.
