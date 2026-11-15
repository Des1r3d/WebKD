# SyncHub — bộ slide bảo vệ đồ án

Bộ slide **20 trang**, thời lượng gợi ý **15:45** (khung 15–18 phút), dựng bằng `python-pptx` trên hệ thiết kế kem – forest – emerald. Bản này được viết lại theo hướng **BA-first**: 6 slide phân tích (tác nhân, AS-IS/TO-BE, use case, business rules, yêu cầu & truy vết) đứng trước phần sản phẩm và kỹ thuật. Toàn bộ ảnh sản phẩm là ảnh chụp thật từ bản chạy ngày **14/11/2026** (Express + PostgreSQL 16, dữ liệu seed).

## Tệp

| Tệp | Vai trò |
|---|---|
| `build_deck.py` | Tạo `SyncHub-Slide.pptx`, gắn speaker notes và chuẩn hóa mốc thời gian |
| `deck_lib.py` | Design system: màu, font, card, pill, code block, ảnh bo góc + bóng |
| `part1.py` | Slide 01–03: cover, agenda, bài toán |
| `part_ba.py` | Slide 04–09: tác nhân, AS-IS, TO-BE, use case, business rules, yêu cầu & truy vết |
| `part2.py` | Slide 10–14: giải pháp, khám phá, BookSlot, GroupOrder, Split Bill |
| `part3.py` | Slide 15–17: Escrow, uy tín, ba vai trò |
| `part4.py` | Slide 18–20: doanh thu, hạn chế, kết luận |
| `SyncHub-Slide.pptx` | Bản trình chiếu chính |
| `SyncHub-Slide.pdf` | Bản PDF để nộp / in |
| `preview/` | 20 ảnh PNG 1600×900 để rà soát layout |
| `assets-cards/` | Cache ảnh đã bo góc + đổ bóng (tự sinh) |

## Dựng lại

```powershell
cd docs\slides
python build_deck.py
```

Xuất PDF + PNG qua PowerPoint COM:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:TEMP\shots\export.ps1"
```

`export.ps1` đang trỏ tới `docs\slides\SyncHub-Slide.pptx`, xuất PDF cùng thư mục và PNG vào `preview/`.

## Hệ thiết kế

- Nền kem `#F7F4EC`, chữ forest `#10231C`, nhấn emerald `#059669`, cảnh báo vàng `#C98A2E`, lỗi đỏ `#B4453A`.
- Font Segoe UI; code block dùng Consolas trên nền `#0F2A22`.
- Khổ 16:9 (13,333 × 7,5 in), lề trái 0,62 in.
- Mỗi slide có footer `SyncHub · Đồ án Phát triển Ứng dụng Web Kinh doanh` và số trang `/ 20`.
- Ảnh chụp được cover-crop, bo góc và đổ bóng mềm bằng Pillow; không dùng ảnh mock.

## Bản đồ slide

| # | Tiêu đề | Thông điệp | Thời lượng |
|---|---|---|---|
| 01 | SyncHub — Một phòng cho cả buổi chơi | Định vị sản phẩm | 0:15 |
| 02 | 15–18 phút, 6 phần | Lộ trình trình bày | 0:20 |
| 03 | Một buổi chơi, bốn lần đứt gãy | Bài toán | 0:50 |
| 04 | Sáu tác nhân, bốn nhóm quyền | Tác nhân & kiểm soát | 0:55 |
| 05 | Một buổi chơi, năm bước, ba nguồn sự thật | AS-IS | 1:00 |
| 06 | Từ ba nguồn sự thật đến một phòng | TO-BE + BR | 1:00 |
| 07 | 14 use case, 4 phân hệ, 6 tác nhân | Use case map | 1:05 |
| 08 | 21 quy tắc nghiệp vụ, 6 nhóm | Business rules | 1:05 |
| 09 | Từ yêu cầu đến bằng chứng, không có khoảng trống | FR/NFR + traceability | 1:00 |
| 10 | Năm bước, một mã phòng | Giải pháp | 0:50 |
| 11 | Khám phá và giữ chỗ trong một màn hình | Sản phẩm | 0:45 |
| 12 | 20 request cùng lúc, đúng một người thắng | BookSlot | 0:55 |
| 13 | Cả nhóm cùng chốt trong một giỏ | GroupOrder + chat | 0:50 |
| 14 | 215.000đ → 4 hóa đơn, không lệch một đồng | Split Bill | 0:55 |
| 15 | Tiền chỉ chảy khi buổi chơi được xác nhận | Escrow | 0:55 |
| 16 | Uy tín quyết định ai được vào phòng | Reputation + dispute | 0:45 |
| 17 | Một hệ sinh thái, ba góc nhìn | Member / Provider / Admin | 0:30 |
| 18 | Doanh thu trên mỗi giao dịch, không phải quảng cáo | 8% / 12% | 0:45 |
| 19 | Biết giới hạn để không hứa quá | Hạn chế + roadmap | 0:45 |
| 20 | Một phòng. Không lệch đồng nào. Một sổ cái. | Kết luận + Q&A | 0:20 |

Tổng: **15:45** (chưa tính thời gian chuyển slide và Q&A).

Nếu phải rút về 12–15 phút: giữ slide 01–09 (phần BA), rút gọn 12–16 (mỗi slide 35–40 giây), bỏ phần demo dài. Không cắt slide 04–09 vì đó là trọng tâm BA của bản này.

## Nguồn số liệu

- `docs/Bao_cao_SyncHub/Bao_cao_SyncHub.docx` — báo cáo chính thức: 14 UC, 14 FR, 6 NFR, 21 BR, 12 bảng, 82/82 test.
- `docs/Bao_cao_SyncHub/Ma_tran_truy_vet.csv` — truy vết yêu cầu → code → test.
- `server/prisma/schema.prisma` — 12 model, index `(status, locked_until)`, `commission_rate`.
- `server/src/services/*` — `slotLock.js`, `splitBill.js`, `escrow.js`, `lobby.js`, `recommend.js`, `promo.js`, `dispute.js`.
- `server/tests/*` — 9 tệp, 20 suite, 82 ca.

Các con số xuất hiện trên slide:

- Ca chuẩn **215.000đ**: sân 120.000 + món 100.000 + ship 15.000 − voucher FNB 20.000.
- A 53.750 · B 58.500 (cọc 9.000 → còn 49.500) · C 30.000 (cọc 30.000 → còn 0) · D 72.750; phải thu **176.000đ**.
- Sổ cái sau kịch bản demo: HELD 176.000 · RELEASED 345.000 · FROZEN 95.000 · REFUNDED 25.000.
- Phí: sân 8% × 120.000 = **9.600đ**; F&B 12% × 95.000 = **11.400đ**; tổng **21.000đ ≈ 9,8%**.
- Admin: GMV 410.000 · phí 40.400 · 9 người dùng · 2 phòng.
- Provider 01: 40 slot · 38 trống · gross 220.000 · thực nhận 202.400.
- Seed: 9 users · 10 venue + 15 F&B · 18 món · 355 slot · 4 voucher · 2 lobby.
- Truy vết: 14/14 UC có test · 0 FR chưa ánh xạ · 4/6 NFR đã kiểm chứng (NFR-05 P95 và NFR-06 accessibility chưa đo).

## Ảnh chụp

Thư mục `docs/slides-assets/screens/`:

| Tệp | Màn hình | Dùng ở slide |
|---|---|---|
| `01-discover.png` | Khám phá + bản đồ | 11 |
| `02-venue.png` | Chi tiết sân + slot | 11 |
| `03-lobby.png` | Phòng nhóm (đầu trang) | — (dự phòng) |
| `03b-lobby-chat.png` | Giỏ + gợi ý quán + chat | 13 |
| `04-split.png` | Hóa đơn 4 thành viên | — (dự phòng) |
| `05-wallet-held.png` | Ví ở trạng thái HELD | — (dự phòng) |
| `06-disputes.png` | Khiếu nại có bằng chứng | 16 |
| `07-wallet.png` | Sổ cái sau giải ngân | 15 |
| `08-provider.png` | Portal đối tác | 17 |
| `09-admin.png` | Dashboard quản trị | 17 |
| `10-login.png` | Đăng nhập | — (dự phòng) |
| `11-profile.png` | Hồ sơ uy tín | — (dự phòng) |
| `12-mobile-discover.png` | Khám phá trên mobile | 01 |
| `13-mobile-lobby.png` | Phòng nhóm trên mobile | 17 |

Kịch bản chụp: đăng nhập host `nguyen.minh.phat@synchub.vn`, mở SYNC01, chat 2 tin, chốt & chia bill, thanh toán 4 hóa đơn qua webhook mock, tạo khiếu nại FNB 25.000đ, check-in 3 người + 1 no-show. Ảnh phản ánh đúng trạng thái sau kịch bản, không chỉnh sửa.

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Host | `nguyen.minh.phat@synchub.vn` | `Password123!` |
| Provider | `thang.venue@synchub.vn` | `Password123!` |
| Admin | `admin@synchub.vn` | `Password123!` |
| Member B | `khuong.thao.vy@synchub.vn` | `Password123!` |
| Member C | `tran.minh.quang@synchub.vn` | `Password123!` |
| Member D | `tran.quang.bao@synchub.vn` | `Password123!` |
| FLAGGED | `hung.flag@synchub.vn` | `Password123!` |

## Cần điền trước khi nộp

Báo cáo gốc để trống phần hành chính, nên cover cũng để chỗ trống:

- Tên học phần / mã học phần.
- Giảng viên hướng dẫn.
- Mã nhóm và họ tên 4 thành viên.
- Nếu muốn, thay dòng vai trò `PO / Fullstack · BA · FE / UI-UX · BE / DB + QA` bằng phân công thật.

## Lưu ý khi trình bày

- Slide 04–09 là phần BA: không đọc hết bảng; chọn 1–2 tác nhân, 1 quy trình, 3 use case khó, 2 BR và 1 dòng truy vết để kể.
- Slide 12 dùng pseudo-SQL; trong code là `prisma.slot.updateMany` với `NOT: { lobby: { is: { status: 'CANCELLED' } } }` và `OR` trạng thái AVAILABLE / LOCKED hết hạn.
- Slide 15: RELEASE và FROZEN là hai nhánh sau check-in, không phải chuỗi tuần tự; REFUND chỉ sau quyết định admin.
- Slide 18: 8% và 12% là giả định trong seed, không phải bảng giá thương mại.
- Slide 09: 82/82 là lần chạy trên database test riêng, không phải database demo.
- Slide 19 nêu đúng các hạn chế trong chương 5; không che bớt khi bị hỏi.
