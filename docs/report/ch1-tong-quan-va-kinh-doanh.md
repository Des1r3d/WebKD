# Chương 1: Tổng quan Đề tài, Nghiên cứu Thị trường & Mô hình Kinh doanh

---

## 1.1 Bối cảnh & Lý do Chọn Đề tài

### 1.1.1 Bối cảnh thực tế tại các khu đô thị đại học
Trong đời sống sinh viên và giới trẻ tại các khu đô thị tập trung quy mô lớn — tiêu biểu là **Khu đô thị Đại học Quốc gia TP.HCM (Làng Đại học Thủ Đức)** với hơn 80.000 sinh viên sinh sống và học tập — nhu cầu sinh hoạt, giao lưu và rèn luyện thể chất diễn ra với tần suất hàng ngày. Trong đó, có hai hoạt động luôn song hành mật thiết với nhau:
1. **Đặt khung giờ dịch vụ bãi sân / không gian sinh hoạt chung (`BookSlot`):** Đặt sân cầu lông, sân bóng đá cỏ nhân tạo, bóng rổ, hoặc phòng họp nhóm/co-working space theo các khung giờ cố định từ 1 đến 2 giờ.
2. **Gọi đồ ăn, thức uống theo nhóm (`GroupOrder`):** Đặt trà sữa, cà phê, nước tăng lực hoặc đồ ăn nhẹ để giao trực tiếp tới sân bãi trong khung giờ sinh hoạt.

Tuy nhiên, dù nhu cầu tiêu dùng là đồng thời, quy trình tổ chức hiện nay lại hoàn toàn bị phân mảnh thành nhiều công đoạn thủ công rời rạc, gây ra nhiều bất cập nghiêm trọng cho cả người dùng lẫn các hộ kinh doanh địa phương.

### 1.1.2 Các điểm nghẽn (Pain points) trong thực tế
- **Quy trình đặt sân phân mảnh và dễ xung đột lịch:** Trưởng nhóm (Host) thường phải liên hệ chủ sân qua Zalo, gọi điện thoại hoặc đến tận nơi để hỏi lịch trống. Vào các khung giờ cao điểm (17h00 – 21h00), tình trạng đặt trùng lịch (double-booking) xảy ra phổ biến do chủ sân ghi chép sổ sách thủ công.
- **Quy trình gọi đồ nhóm thủ công, mất thời gian:** Để gom đơn nước, Host phải gửi ảnh thực đơn vào nhóm chat Zalo/Messenger, từng người nhắn tin lựa chọn món, Host tự ghi chú lại rồi gọi quán hoặc đặt qua ứng dụng giao hàng ngoài. Thao tác này tốn từ 15 – 30 phút và dễ bị sót món hoặc sai ghi chú cá nhân (đường, đá, topping).
- **Chia hóa đơn phức tạp, sai lệch số lẻ:** Chi phí một buổi giao lưu gồm hai phần có bản chất kế toán khác nhau: tiền sân chia đều theo đầu người tham gia, trong khi tiền nước tính theo từng món cá nhân, sau đó lại phải cộng dồn phí ship và trừ chiết khấu voucher theo tỷ lệ. Việc tính nhẩm hoặc tạo bảng tính Excel sau trận đấu rất rườm rà, thường dẫn đến việc lệch vài trăm đến vài nghìn đồng và gây tâm lý ái ngại khi đòi tiền bạn bè.
- **Rủi ro bùng kèo (No-show) và thiếu bảo chứng tài chính:** Thành viên đăng ký tham gia nhưng hủy sát giờ hoặc không đến khiến chi phí tiền sân bị đội lên cho những người còn lại, hoặc Host phải chịu mất tiền cọc cho chủ sân mà không có cơ chế bồi hoàn nào.
- **Thiếu kết nối giữa các cơ sở kinh doanh lân cận:** Quán nước gần sân không nắm được lịch thi đấu để chủ động chuẩn bị đơn hàng; chủ sân cũng không có công cụ gia tăng giá trị dịch vụ cho khách hàng của mình.

### 1.1.3 Giải pháp đề xuất: Nền tảng SyncHub
**SyncHub** là nền tảng thương mại điện tử hai chiều (Two-sided Marketplace) tích hợp liền mạch quy trình **Đặt khung giờ dịch vụ (BookSlot)** và **Gọi đồ nhóm thời gian thực (GroupOrder)** trong cùng một phòng ghép kèo (`GroupLobby`). Nền tảng vận hành dựa trên 3 trụ cột kỹ thuật - nghiệp vụ đột phá:
1. **Khóa chỗ nguyên tử (Atomic Slot Lock):** Giữ chỗ khung giờ sân tức thì trong 10 phút, ngăn chặn hoàn toàn hiện tượng đặt trùng lịch bằng giao dịch cơ sở dữ liệu có điều kiện.
2. **Giỏ hàng chung thời gian thực & Tự động chia bill VietQR:** Mọi thành viên cùng tương tác trên một giỏ hàng qua WebSocket; hóa đơn được phân bổ chính xác tuyệt đối tới từng đồng VND (thuật toán Largest Remainder) kèm mã VietQR cá nhân hóa.
3. **Ví giữ tiền trung gian Escrow & Hệ sinh thái Tín nhiệm (Reputation):** Đóng băng và giải ngân tự động đa bên sau khi Check-in (khấu trừ hoa hồng sàn 8% cho Venue và 12% cho F&B), kết hợp chế tài xử phạt tiền cọc và trừ điểm uy tín khi xảy ra hành vi bùng kèo (No-show).

---

## 1.2 Khảo sát & Đánh giá các Hệ thống Hiện có

Nhóm đã tiến hành khảo sát và so sánh các kênh/nền tảng hiện có trên thị trường phục vụ nhu cầu đặt sân và gọi món nhóm:

| Tiêu chí so sánh | Nhóm mạng xã hội (Zalo / Facebook) | Ứng dụng giao đồ ăn (ShopeeFood / GrabFood) | Ứng dụng đặt sân chuyên biệt (Sporta / Sân Việt) | **Nền tảng SyncHub (Đề tài đề xuất)** |
|---|---|---|---|---|
| **Đặt khung giờ thể thao** | Thủ công (nhắn tin/gọi điện hỏi lịch) | Không hỗ trợ | Có hỗ trợ đặt sân đơn lẻ | **Hỗ trợ đặt sân tức thì với khóa slot 10 phút chống race condition** |
| **Gọi đồ ăn/thức uống theo nhóm** | Thủ công (chat từng dòng) | Có tính năng gom đơn nhóm (Group Order) | Không hỗ trợ | **Hỗ trợ giỏ hàng chung Realtime đồng bộ qua WebSocket < 1s** |
| **Tính liên kết giữa Sân và Quán** | Hoàn toàn rời rạc | Độc lập, không biết giờ và địa điểm sân | Độc lập, không có thực đơn ăn uống | **Tích hợp 2 trong 1: Gợi ý quán FNB gần sân $\le 1\text{ km}$ và Voucher chéo** |
| **Cơ chế chia tiền (Split Bill)** | Tự tính nhẩm, chuyển khoản thủ công | Chia đều hoặc theo món, người gom chịu trách nhiệm ứng tiền | Không hỗ trợ chia tiền nhiều người | **Tự động chia tiền theo công thức Largest Remainder, sinh mã VietQR cá nhân** |
| **Bảo chứng chống bùng kèo** | Không có (dựa vào lòng tin) | Người tạo đơn phải thanh toán trước 100% | Đặt cọc cho chủ sân nhưng khách bùng tự chịu | **Phân hạng uy tín (A/B/C), thu cọc tự động, phạt No-show chuyển cọc cho sân** |
| **Bảo vệ tài chính & Giải ngân** | Chuyển khoản trực tiếp, rủi ro lừa đảo | Trừ thẻ/ví người gom ngay lập tức | Thanh toán chuyển khoản trước cho sân | **Ví trung gian Escrow giữ tiền, giải ngân tách bạch cho Venue/FnB sau Check-in** |

**Kết luận khảo sát:** Hiện nay trên thị trường chưa có bất kỳ giải pháp nào tích hợp được cả hai luồng nghiệp vụ "Đặt chỗ khung giờ" và "Gọi đồ nhóm" cùng lúc. SyncHub là giải pháp tiên phong lấp đầy khoảng trống (Market Gap) này, mang lại giá trị gia tăng rõ rệt cho toàn bộ các bên tham gia.

---

## 1.3 Chân dung Khách hàng Mục tiêu (Personas) & Bối cảnh Sử dụng

Hệ thống phục vụ 4 nhóm đối tượng người dùng cụ thể:

### 1. Persona 1: Trưởng nhóm sinh hoạt / Người khởi tạo kèo (Host)
- **Đại diện:** Đào Tiến Đạt — 21 tuổi, sinh viên năm 3 ĐHQG TP.HCM, Đội trưởng đội cầu lông Khoa.
- **Hành vi & Bối cảnh:** Thường xuyên đứng ra tổ chức các buổi đánh cầu 2 buổi/tuần tại Cụm sân Cầu lông Suối Tiên; kiêm luôn việc gọi nước giải khát cho 6–8 người tham gia.
- **Nỗi đau (Pain points):**
  - Mất nhiều thời gian nhắn tin hỏi sân và chốt danh sách bạn bè.
  - Phải ứng trước tiền sân và tiền nước (khoảng 300.000 – 500.000 VND).
  - Tốn công sức chia bill và nhắc bạn bè chuyển khoản; nhiều người "quên" trả hoặc trả thiếu.
  - Bị người khác hủy sát giờ khiến bản thân phải bù tiền sân.
- **Mục tiêu khi dùng SyncHub:** Khóa sân nhanh chóng, gửi link phòng cho cả nhóm tự vào chọn món, hệ thống tự chia bill và thu tiền, không cần ứng tiền hay tính nhẩm.

### 2. Persona 2: Thành viên tham gia nhóm (Member)
- **Đại diện:** Trần Quang Minh — 20 tuổi, sinh viên năm 2 Ký túc xá Khu B ĐHQG.
- **Hành vi & Bối cảnh:** Thích thể thao và giao lưu kết bạn, thường xuyên tham gia các kèo chơi cầu lông hoặc học nhóm do bạn bè rủ.
- **Nỗi đau (Pain points):**
  - Ngại hỏi chi tiết giá món nước, sợ không đúng ý mình khi người khác gọi hộ.
  - Ngại tính tiền lẻ, không có tiền mặt lẻ để gửi lại cho Host.
  - Không rõ tiền sân được chia thế nào, có minh bạch hay không.
- **Mục tiêu khi dùng SyncHub:** Tự tay chọn món trà sữa yêu thích trên giỏ hàng chung, quét mã VietQR đúng số tiền của mình trong 5 giây, tích lũy điểm uy tín để được miễn cọc cho các lần sau.

### 3. Persona 3: Chủ cơ sở sân bãi / không gian học tập (Venue Provider)
- **Đại diện:** Hoàng Văn Thắng — 45 tuổi, Quản lý Cụm sân Cầu lông Thắng Lợi (Đường vành đai ĐHQG).
- **Hành vi & Bối cảnh:** Quản lý 6 sân cầu lông, ghi chép sổ sách và nhận đặt sân qua điện thoại/Zalo.
- **Nỗi đau (Pain points):**
  - Khung giờ vàng (17h–20h) thường xuyên bị khách gọi đặt miệng nhưng không đến (bùng kèo), làm mất doanh thu mà không phạt được khách.
  - Mất công đối soát tin nhắn chuyển khoản ngân hàng trong lúc bận rộn tại sân.
- **Mục tiêu khi dùng SyncHub:** Các khung giờ được tự động khóa và thanh toán qua tiền cọc/Escrow; nếu khách bùng kèo thì nhận được tiền bồi thường từ hệ thống; quản lý lịch sân trực quan trên điện thoại.

### 4. Persona 4: Chủ quán nước / Đồ ăn nhẹ địa phương (FnB Provider)
- **Đại diện:** Mai Thị Thảo — 32 tuổi, Chủ tiệm Trà sữa & Cà phê ToCoToCo Ký túc xá Khu B.
- **Hành vi & Bối cảnh:** Quán nằm cách cụm sân thể thao 400 mét, chuyên phục vụ sinh viên mang đi và giao hàng nội khu.
- **Nỗi đau (Pain points):**
  - Bị các ứng dụng giao hàng công nghệ lớn chiết khấu hoa hồng quá cao (20% – 25%).
  - Đơn hàng nhóm thường bị lắt léo về ghi chú, shipper giao trễ làm đá tan, khách phàn nàn.
- **Mục tiêu khi dùng SyncHub:** Nhận các đơn hàng nhóm giá trị cao (High Order Value) giao thẳng tới sân theo khung giờ cố định; mức phí hoa hồng sàn chỉ 12% (thấp hơn nhiều so với app ngoài); được hưởng lợi từ việc gợi ý chéo cho khách đặt sân.

---

## 1.4 Môi trường Kinh doanh & Ma trận Cạnh tranh (SWOT)

Nhóm phân tích môi trường kinh doanh của SyncHub thông qua mô hình SWOT:

```text
       ĐIỂM MẠNH (STRENGTHS)                     ĐIỂM YẾU (WEAKNESSES)
+----------------------------------------+----------------------------------------+
| 1. Mô hình tích hợp 2-in-1 tiên phong  | 1. Là nền tảng mới, cần thời gian giáo |
|    (BookSlot + GroupOrder).            |    dục thói quen người dùng.           |
| 2. Trải nghiệm Realtime mượt mà        | 2. Chưa có ứng dụng Native iOS/Android |
|    (WebSocket < 1s).                   |    (hiện chạy trên Responsive Web).    |
| 3. Thuật toán chia tiền chính xác      | 3. Mạng lưới ban đầu giới hạn trong    |
|    tuyệt đối 0 VND sai lệch.           |    khu vực KĐT ĐHQG TP.HCM.            |
| 4. Hệ thống Tín nhiệm & Escrow bảo vệ  |                                        |
|    chống bùng kèo độc quyền.           |                                        |
+----------------------------------------+----------------------------------------+
       CƠ HỘI (OPPORTUNITIES)                     THÁCH THỨC (THREATS)
+----------------------------------------+----------------------------------------+
| 1. Thị trường sinh viên tập trung cao, | 1. Thói quen sử dụng Zalo/tiền mặt của |
|    thích nghi công nghệ cực nhanh.     |    các chủ sân lớn tuổi.               |
| 2. Làn sóng thanh toán số VietQR phát  | 2. Khả năng các app lớn (Grab, Shopee) |
|    triển bùng nổ tại Việt Nam.         |    mở rộng tính năng tương tự.         |
| 3. Khả năng nhân rộng mô hình ra các   | 3. Rủi ro gian lận tài khoản hoặc tranh|
|    cụm đại học khác (Hà Nội, Đà Nẵng). |    chấp dịch vụ cần đội ngũ kiểm duyệt |
+----------------------------------------+----------------------------------------+
```

---

## 1.5 Mô hình Kinh doanh — Business Model Canvas (BMC) & Dòng Doanh thu

### 1.5.1 Bảng Business Model Canvas (BMC)

| Khối BMC | Nội dung chi tiết tại SyncHub |
|---|---|
| **1. Phân khúc Khách hàng (Customer Segments)** | - **Người dùng cuối (Users):** Sinh viên, nhóm bạn trẻ, câu lạc bộ tại khu vực Làng ĐH Thủ Đức (vai trò `HOST` — người khởi tạo kèo và `MEMBER` — thành viên tham gia).<br>- **Đối tác cung cấp (`PROVIDER`):** (1) `VENUE` — Chủ sân cầu lông, sân bóng mini, không gian học nhóm; (2) `FNB` — Quán trà sữa, cà phê, đồ ăn vặt trong bán kính $\le 1\text{ km}$ quanh các cụm sân. |
| **2. Giá trị Đề xuất (Value Propositions)** | - **Với Host & Member:** Đặt sân + gọi nước chung trong $\le 3$ bước; giỏ hàng đồng bộ thời gian thực (`< 1s`); tự động chia bill chính xác đến từng đồng kèm mã VietQR cá nhân; chống bùng kèo nhờ hệ thống điểm uy tín & tiền cọc.<br>- **Với Venue Provider:** Lấp đầy khung giờ trống, khóa lịch tự động chống trùng, nhận tiền cọc bồi thường nếu khách no-show.<br>- **Với FnB Provider:** Nhận đơn hàng nhóm giá trị lớn (High AOV) gắn liền với địa điểm và giờ giao cố định tại sân, tăng đơn nhờ gợi ý chéo (`CROSS Voucher`). |
| **3. Kênh phân phối (Channels)** | - Ứng dụng Web Responsive (Desktop & Mobile Browser) tối ưu thao tác quét QR.<br>- Cơ chế lan truyền tự nhiên (Viral Loop) qua Link mời phòng (`/lobby/:inviteCode`) và mã QR chia sẻ trực tiếp lên Zalo/Messenger. |
| **4. Quan hệ Khách hàng (Customer Relationships)** | - Tự phục vụ (Self-service) thông qua giao diện thời gian thực.<br>- Cơ chế đánh giá tự động qua Điểm uy tín (`Reputation Score` 0–100, phân hạng A/B/C).<br>- Bảo vệ người mua qua ví giữ tiền tạm thời (`Escrow`) và quy trình phân xử khiếu nại minh bạch của `ADMIN`. |
| **5. Dòng Doanh thu (Revenue Streams)** | - **Hoa hồng giao dịch đặt sân (`VENUE Commission`):** Thu **8%** trên giá trị tiền sân giải ngân thành công.<br>- **Hoa hồng đơn hàng đồ uống (`FNB Commission`):** Thu **12%** trên giá trị đơn đồ ăn/thức uống giải ngân thành công.<br>- *(Mở rộng tương lai):* Phí tài trợ hiển thị ưu tiên (Sponsored Listing) trên bản đồ và danh sách gợi ý. |
| **6. Nguồn lực Chính (Key Resources)** | - Hệ thống lõi: Thuật toán khóa slot nguyên tử (`SlotLock`), bộ chia hóa đơn (`SplitBill` — Largest Remainder), sổ cái `Escrow` chống giải ngân trùng (`Idempotency Key`), và hạ tầng WebSocket (`Socket.io`).<br>- Cơ sở dữ liệu không gian địa lý (`lat, lng`) của mạng lưới sân và quán quanh Làng ĐH Thủ Đức. |
| **7. Hoạt động Chính (Key Activities)** | - Vận hành nền tảng đặt chỗ, đồng bộ giỏ hàng nhóm, đối soát thanh toán VietQR và giải ngân tự động sau khi Check-in.<br>- Quản trị rủi ro: Kiểm duyệt tài khoản bị gắn cờ (`FLAGGED`), phân xử tranh chấp dịch vụ (`Disputes`) và lưu vết kiểm toán (`Audit Logs`). |
| **8. Đối tác Chính (Key Partners)** | - Các cụm sân thể thao, phòng học nhóm và chuỗi quán nước địa phương tại Khu đô thị ĐHQG TP.HCM.<br>- Dịch vụ tạo mã thanh toán chuẩn Napas247 (`VietQR.io`) và dữ liệu bản đồ mở (`OpenStreetMap / Leaflet`). |
| **9. Cơ cấu Chi phí (Cost Structure)** | - Chi phí hạ tầng máy chủ (Cloud Server, PostgreSQL Database, WebSocket connection).<br>- Chi phí tài trợ mã giảm giá chéo (`CROSS Voucher`) kích cầu giai đoạn đầu.<br>- Chi phí vận hành, chăm sóc khách hàng và xử lý khiếu nại. |

### 1.5.2 Cấu trúc Doanh thu Chi tiết 3 Nhóm
Để đảm bảo nền tảng phát triển bền vững và không phụ thuộc vào một nguồn thu duy nhất, SyncHub xây dựng cấu trúc doanh thu thành 3 nhóm cốt lõi:
1. **Nhóm 1: Doanh thu từ Phí Hoa hồng Giao dịch (Transaction Commission):**
   - **Đối với Chủ sân (`VENUE`):** Khấu trừ **8%** trên giá trị slot sân ròng khi giải ngân thành công. Tỷ lệ này rất hợp lý và cạnh tranh so với các kênh môi giới truyền thống (10–15%).
   - **Đối với Quán nước (`FNB`):** Khấu trừ **12%** trên tổng giá trị món ăn, thức uống ròng. Mức phí này hấp dẫn hơn đáng kể so với mức 20–25% của ShopeeFood/GrabFood.
2. **Nhóm 2: Doanh thu từ Dịch vụ Bảo lãnh Giao dịch & Quản trị Rủi ro (Escrow & Dispute Fee):**
   - Hệ thống tự động trích một phần phí xử lý (1–2%) từ các khoản tiền bồi thường tranh chấp hoặc phí phạt hành vi vi phạm điều khoản nền tảng.
3. **Nhóm 3: Nhóm Doanh thu Giá trị Gia tăng & Tiếp thị Liên kết (Value-added & Sponsored Ads):**
   - Thu phí từ các cơ sở kinh doanh muốn hiển thị nổi bật trên bản đồ (Top Marker Pin) hoặc xuất hiện ở vị trí đầu trong danh sách gợi ý quán quanh sân (`Sponsored Placement`).
   - Hợp tác phát hành các gói Voucher liên kết ngành độc quyền (`CROSS Voucher`) với các thương hiệu lớn.

---

## 1.6 Mục tiêu & Phạm vi Dự án

### 1.6.1 Mục tiêu dự án
- **Mục tiêu kỹ thuật:** Xây dựng hoàn chỉnh hệ thống Web Marketplace hai chiều đáp ứng tính toàn vẹn dữ liệu trong môi trường đồng thời (Concurrency); không xảy ra lỗi race condition đặt trùng sân; đảm bảo sai số làm tròn tài chính bằng $0\text{ VND}$; độ trễ đồng bộ giỏ hàng thời gian thực $< 1000\text{ ms}$.
- **Mục tiêu người dùng:** Rút ngắn thời gian tổ chức một buổi giao lưu thể thao từ 30 phút xuống dưới 3 phút; loại bỏ hoàn toàn việc ứng tiền và nhắc nợ thủ công.
- **Mục tiêu kinh doanh:** Tạo ra dòng tiền hoa hồng tự động từ giao dịch đặt chỗ và đồ uống, xây dựng cộng đồng người dùng có ý thức cam kết cao thông qua thang điểm uy tín.

### 1.6.2 Phạm vi thực hiện (In-Scope)
- Hỗ trợ 4 vai trò người dùng theo mô hình RBAC: `HOST`, `MEMBER`, `PROVIDER`, `ADMIN`.
- Bản đồ tương tác OpenStreetMap/Leaflet với bán kính lọc không gian địa lý quanh Làng ĐH Thủ Đức.
- Khóa slot sân nguyên tử (Atomic Slot Lock) 10 phút kèm tiến trình quét tự động (Background Sweep Cron Job).
- Phòng ghép kèo thời gian thực kết nối WebSocket: chia sẻ link mời, mã QR, giỏ hàng chung và chatbox.
- Thuật toán gợi ý quán FNB thông minh dựa trên khoảng cách, giờ mở cửa và voucher chéo.
- Thuật toán chia tiền tự động Largest Remainder kết hợp sinh mã VietQR Napas247 cá nhân hóa.
- Ví trung gian Escrow: giữ tiền `HOLD`, giải ngân đa bên `RELEASE` có cơ chế chống giải ngân đúp `Idempotency Gate`, đóng băng khoản tiền tranh chấp `FROZEN`.
- Trung tâm phân xử khiếu nại (Dispute Resolution) và sổ cái kiểm toán toàn diện `audit_logs`.

### 1.6.3 Phạm vi loại trừ (Out-of-Scope)
- **Không tích hợp cổng thanh toán ngân hàng thật:** Hệ thống sinh mã VietQR thật (quét được trên mọi app ngân hàng), nhưng bước xác nhận thanh toán được thực hiện qua **Webhook giả lập (`POST /api/payments/webhook-mock`)** để phục vụ môi trường demo và chấm điểm đồ án.
- **Không điều phối tài xế giao hàng thực tế (Fleet Management):** Nền tảng hoạt động theo mô hình quán FNB tự giao đồ đến địa chỉ sân đã đặt trong khung giờ slot; phí ship được tính cố định hoặc ước lượng theo cự ly.
- **Không phát triển ứng dụng di động Native (Android/iOS):** Ứng dụng được tối ưu hóa hiển thị Responsive Web App trên mọi kích thước màn hình từ điện thoại đến máy tính.
