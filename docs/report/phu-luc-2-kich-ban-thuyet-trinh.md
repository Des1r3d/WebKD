# Phụ lục 2: Kịch bản Thuyết trình Bảo vệ Đồ án (Presentation Script)

---

# KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN TỐT NGHIỆP
## ĐỀ TÀI: SYNCHUB — NỀN TẢNG KẾT NỐI ĐẶT CHỖ VÀ GỌI ĐỒ NHÓM TÍCH HỢP ESCROW
*(Thời lượng thuyết trình tiêu chuẩn: 12 – 15 phút + 10 phút Hỏi đáp Hội đồng)*

---

### Slide 1: Trang tiêu đề & Giới thiệu Nhóm
- **Hình ảnh trình chiếu:** Logo SyncHub, tên đề tài "Nền tảng kết nối đặt chỗ và gọi đồ nhóm tích hợp Escrow", danh sách 5 thành viên và giảng viên hướng dẫn.
- **Lời thoại thuyết trình (Người đại diện mở đầu):**
  > *"Kính thưa Quý Thầy Cô trong Hội đồng chấm đồ án tốt nghiệp và các bạn sinh viên đang có mặt hôm nay. Em tên là Đào Tiến Đạt, đại diện cho Nhóm 5 thành viên xin phép được trình bày báo cáo kết quả đề tài: **'SyncHub — Nền tảng kết nối đặt chỗ và gọi đồ nhóm tích hợp Escrow'** thuộc học phần Phát triển Ứng dụng Web Kinh doanh. Sau đây, em xin phép bắt đầu phần thuyết trình với câu chuyện xuất phát điểm của dự án."*

---

### Slide 2: Câu chuyện Nỗi đau (The Pain Point Story)
- **Hình ảnh trình chiếu:** Ảnh chụp màn hình tin nhắn Zalo lộn xộn gom kèo đánh cầu lông, hóa đơn tính nhẩm bị lệch tiền lẻ, hình ảnh khách hủy kèo sát giờ.
- **Lời thoại thuyết trình:**
  > *"Thưa Thầy Cô, là sinh viên sinh sống và học tập tại Khu đô thị Đại học Quốc gia TP.HCM, chắc hẳn chúng ta đều từng trải qua cảm giác này: Mỗi lần muốn rủ bạn bè đi đánh cầu lông hoặc học nhóm, Trưởng nhóm phải nhắn tin hỏi sân bãi, sau đó gửi ảnh menu vào nhóm Zalo để gom đơn nước. Từng người nhắn một kiểu: người ít đường, người thêm trân chú, người lại bảo 'gọi hộ tao tí tao trả'.*
  > *Kết quả là: Host phải tự bỏ tiền túi ứng trước từ 300.000 đến 500.000 đồng; sau buổi chơi ngồi tính nhẩm chia tiền sân, cộng tiền nước, trừ tiền ship rất đau đầu và hay lệch vài nghìn lẻ; tệ hơn nữa là có bạn bùng kèo không đến, khiến những người còn lại phải gánh thêm chi phí. Đây chính là một 'khoảng trống thị trường' rất lớn mà chưa có ứng dụng nào hiện nay giải quyết triệt để."*

---

### Slide 3: Giải pháp SyncHub — Trải nghiệm Tích hợp 2-in-1
- **Hình ảnh trình chiếu:** Mockup giao diện SyncHub trên Desktop & Mobile, sơ đồ kết nối Sân bãi (`VENUE`) + Quán nước (`FNB`) + Phòng ghép kèo (`Lobby`).
- **Lời thoại thuyết trình:**
  > *"Để giải quyết trọn vẹn chuỗi vấn đề trên, nhóm chúng em đã phát triển **SyncHub**. SyncHub không chỉ là một ứng dụng đặt sân thông thường, mà là một nền tảng thương mại điện tử hai chiều tích hợp liền mạch hai nhu cầu: **Đặt khung giờ dịch vụ (BookSlot)** và **Gọi đồ nhóm thời gian thực (GroupOrder)** trong cùng một phòng ghép kèo.*
  > *Người dùng chỉ cần khóa sân, mở phòng, gửi mã QR cho bạn bè. Mọi người tự vào chọn món trên giỏ hàng chung, hệ thống tự động chia hóa đơn chính xác từng đồng bằng VietQR và bảo vệ tiền qua ví trung gian Escrow. Mọi thao tác tổ chức rút ngắn từ 30 phút xuống dưới 3 phút."*

---

### Slide 4: Khảo sát Thị trường & Ma trận Cạnh tranh
- **Hình ảnh trình chiếu:** Bảng so sánh SyncHub với Zalo, ShopeeFood/GrabFood và Sporta/Sân Việt.
- **Lời thoại thuyết trình:**
  > *"Qua khảo sát thị trường, chúng em nhận thấy: Zalo thì hoàn toàn thủ công và không có bảo chứng tài chính; Grab hay ShopeeFood chỉ hỗ trợ gom đơn ăn uống chứ không biết địa điểm và khung giờ sân; còn các app đặt sân như Sporta thì lại không tích hợp thực đơn ăn uống.*
  > *SyncHub là giải pháp đầu tiên kết nối Sân và Quán trong bán kính 1km, áp dụng mã giảm giá chéo CROSS Voucher và thiết lập cơ chế điểm uy tín chống bùng kèo độc quyền."*

---

### Slide 5: Kiến trúc Kỹ thuật & Công nghệ Lựa chọn
- **Hình ảnh trình chiếu:** Sơ đồ kiến trúc 3 tầng: React 18 + Vite + TailwindCSS (Frontend) $\leftrightarrow$ Node.js Express + Socket.io (Backend) $\leftrightarrow$ PostgreSQL 16 + Prisma ORM (Database).
- **Lời thoại thuyết trình:**
  > *"Về mặt kỹ thuật, hệ thống được xây dựng trên nền tảng công nghệ hiện đại và chuẩn mực: Frontend sử dụng **React 18 kết hợp TypeScript** và thư viện bản đồ **Leaflet**. Backend sử dụng **Node.js Express** kết hợp hạ tầng thời gian thực **Socket.io** theo kiến trúc Room cách ly.*
  > *Đặc biệt, tầng dữ liệu sử dụng **PostgreSQL 16 với Prisma ORM**. Nhóm kiên quyết chọn PostgreSQL thay vì MongoDB vì các luồng nghiệp vụ nhạy cảm như khóa sân và giải ngân tài chính đòi hỏi tính toàn vẹn ACID tuyệt đối và khả năng khóa cấp độ dòng (Row-level Lock) để ngăn chặn hoàn toàn lỗi tranh chấp tài nguyên."*

---

### Slide 6: Đột phá Kỹ thuật 1 — Khóa Slot Nguyên tử (Atomic Slot Lock)
- **Hình ảnh trình chiếu:** Đoạn mã SQL `UPDATE slots SET status = 'LOCKED' ... WHERE status = 'AVAILABLE' RETURNING *` và kết quả test 20 requests đồng thời.
- **Lời thoại thuyết trình:**
  > *"Một trong những bài toán khó nhất của sàn đặt chỗ là Race Condition: Nếu 20 người cùng bấm đặt một sân tại cùng một giây thì sao?*
  > *Hệ thống của chúng em áp dụng câu lệnh cập nhật nguyên tử có điều kiện trực tiếp trong cơ sở dữ liệu PostgreSQL. Trong số 20 request gửi đến cùng mili-giây, cơ sở dữ liệu chỉ cho phép đúng 1 dòng được cập nhật thành công và trả về mã 200, 19 request còn lại lập tức nhận mã 409 Conflict. Khung giờ được giữ trong 10 phút, nếu quá hạn mà chưa thanh toán, một Job nền định kỳ 60 giây sẽ tự động quét và nhả slot về màu xanh cho người khác đặt."*

---

### Slide 7: Đột phá Kỹ thuật 2 — Thuật toán Chia Bill Largest Remainder & VietQR
- **Hình ảnh trình chiếu:** Bảng ma trận ca chuẩn 215.000đ (4 người, có người không uống nước, có người uống nhiều, trừ cọc) và mã VietQR Napas 247.
- **Lời thoại thuyết trình:**
  > *"Để giải quyết triệt để việc sai lệch tiền lẻ, nhóm đã hiện thực hóa thuật toán **Largest Remainder (phương pháp Hamilton)**. Toàn bộ tiền tệ trong hệ thống được lưu kiểu số nguyên VND. Sau khi chia đều tiền sân và phân bổ tiền nước cá nhân, các phần dư lẻ sẽ được ưu tiên phân phối cho người có phần thập phân lớn nhất (nếu bằng nhau ưu tiên Host).*
  > *Chúng em thiết lập một câu lệnh Assert kiểm toán bắt buộc: Tổng các hóa đơn con phải bằng chính xác 100% tổng hóa đơn lớn, sai lệch 0 VND. Mỗi người dùng sẽ nhận được một mã VietQR cá nhân hóa, mở app ngân hàng quét là chuyển đúng số tiền của mình trong 5 giây."*

---

### Slide 8: Đột phá Kỹ thuật 3 — Ví Escrow, Cổng Idempotency & Đóng băng Từng phần
- **Hình ảnh trình chiếu:** Sơ đồ 4 trạng thái Escrow (`HOLD` $\rightarrow$ `HELD` $\rightarrow$ `RELEASED` / `FROZEN`), khóa `idempotency_key`.
- **Lời thoại thuyết trình:**
  > *"Về an toàn tài chính, SyncHub hoạt động như một bên thứ ba bảo lãnh: Tiền của người dùng sau khi quét QR sẽ được chuyển vào ví trung gian Escrow ở trạng thái HELD. Chỉ khi đến sân thi đấu và Chủ sân nhấn 'Xác nhận Check-in', tiền mới được tự động tách quỹ giải ngân: Chủ sân nhận 92% (sàn thu hoa hồng 8%), Quán nước nhận 88% (sàn thu hoa hồng 12%).*
  > *Mỗi lệnh giải ngân đều có khóa duy nhất `idempotency_key`. Nếu mạng lag bấm giải ngân 2 lần, hệ thống sẽ phát hiện trùng khóa và chặn ngay lập tức. Nếu có khiếu nại quán giao thiếu nước, hệ thống chỉ đóng băng khoản tiền của quán đó, tiền sân bãi vẫn được giải ngân bình thường."*

---

### Slide 9: Động cơ Tín nhiệm & Chế tài Xử phạt Bùng kèo (No-show Policy)
- **Hình ảnh trình chiếu:** Bảng phân hạng uy tín (A: 0% cọc, B: 30% cọc, C: 100% cọc, FLAGGED: Chặn) và luồng trừ điểm No-show.
- **Lời thoại thuyết trình:**
  > *"Làm sao để người tham gia có trách nhiệm không bùng kèo? SyncHub xây dựng hệ thống Tín nhiệm tự động: Mỗi tài khoản khởi tạo có 100 điểm. Người dùng Hạng A từ 90 điểm trở lên được miễn cọc hoàn toàn. Người dùng Hạng B phải cọc 30%, Hạng C phải cọc 100%.*
  > *Nếu vắng mặt không đến (`NO_SHOW`), người đó bị trừ ngay 15 điểm uy tín, nếu rơi xuống dưới 50 điểm sẽ bị gắn cờ FLAGGED và cấm vào phòng mới; đồng thời toàn bộ tiền cọc bị tịch thu bồi thường trực tiếp cho chủ sân. Ngược lại, nếu tham gia đầy đủ sẽ được thưởng +2 điểm."*

---

### Slide 10: Phần Trình diễn Trực tiếp Sản phẩm (Live Demo)
- **Hình ảnh trình chiếu:** Chuyển sang 2 màn hình trình duyệt thực tế (1 Laptop của Host Đào Tiến Đạt + 1 Điện thoại/Trình duyệt ẩn danh của Member).
- **Lời thoại thuyết trình:**
  > *"Sau đây, nhóm xin phép được Demo trực tiếp luồng nghiệp vụ thực tế giữa 2 người dùng trên hệ thống:*
  > *1. Đầu tiên, trên Laptop, Host mở bản đồ, tìm sân Cầu lông Suối Tiên và nhấn khóa khung giờ 18h–19h. Đồng hồ 10 phút bắt đầu đếm ngược.*
  > *2. Host nhấn mở phòng ghép kèo, màn hình sinh ra mã QR và link mời.*
  > *3. Trên điện thoại, Member quét mã QR để tham gia phòng. Hệ thống kiểm tra điểm uy tín Hạng A nên cho vào ngay.*
  > *4. Member chọn 1 ly Trà đào cam sả trên giỏ hàng chung. Ngay lập tức, trên màn hình Laptop của Host, giỏ hàng nhảy số lượng và tổng tiền trong chưa đầy 0.3 giây qua WebSocket.*
  > *5. Host bấm 'Chốt đơn'. Toàn bộ nút thêm món trên cả 2 máy bị vô hiệu hóa tức thì.*
  > *6. Màn hình chia bill xuất hiện kèm mã VietQR cá nhân. Em thực hiện bấm nút 'Giả lập thanh toán Webhook'. Hóa đơn chuyển màu xanh PAID và phòng chuyển sang trạng thái sẵn sàng ra sân."*

---

### Slide 11: Cổng thông tin Đối tác & Bảng điều khiển Quản trị (Admin)
- **Hình ảnh trình chiếu:** Giao diện Provider Portal (điểm danh, check-in) và Admin Dashboard (Biểu đồ doanh thu Recharts, Quản lý tranh chấp, Audit Logs).
- **Lời thoại thuyết trình:**
  > *"Tiếp theo là giao diện dành cho đối tác và quản trị viên:*
  > *- Phía Chủ sân (`Provider Portal`): Chủ sân thấy phòng đã thanh toán, kiểm tra danh sách thành viên và bấm nút 'Check-in & Nhận giải ngân'. Hệ thống lập tức giải ngân 92% tiền sân.*
  > *- Phía Quản trị (`Admin Dashboard`): Admin theo dõi tổng GMV giao dịch qua Escrow, doanh thu hoa hồng sàn thu về, trực quan hóa biểu đồ doanh thu theo ngày và tra cứu sổ cái kiểm toán audit_logs ghi lại chi tiết từng biến động số dư và điểm uy tín."*

---

### Slide 12: Báo cáo Kết quả Kiểm thử (Testing)
- **Hình ảnh trình chiếu:** Ảnh chụp màn hình kết quả chạy Vitest (7 test files, 65 tests passed 100%) và bảng 30 test cases hộp đen.
- **Lời thoại thuyết trình:**
  > *"Để chứng minh tính ổn định tuyệt đối của phần mềm, nhóm đã viết bộ kiểm thử tự động toàn diện gồm **65 automated test cases trên Vitest**, bao phủ từ mã hóa mật khẩu, kiểm tra cọc uy tín, chia bill Largest Remainder, đến các ca kiểm thử đồng thời khóa slot và cổng chống giải ngân lặp Idempotency. Toàn bộ 65 bài kiểm thử đều đạt kết quả **PASS 100%**."*

---

### Slide 13: Mô hình Doanh thu & Kế hoạch Khởi nghiệp
- **Hình ảnh trình chiếu:** Biểu đồ cơ cấu 3 nguồn doanh thu: Hoa hồng giao dịch (8% sân, 12% nước), Phí bảo lãnh rủi ro, và Quảng cáo ưu tiên Sponsored Placement.
- **Lời thoại thuyết trình:**
  > *"Về góc độ kinh doanh, SyncHub sở hữu mô hình doanh thu bền vững dựa trên 3 trụ cột: Nguồn thu cốt lõi từ phí hoa hồng 8% trên tiền sân và 12% trên tiền nước; nguồn thu từ phí bảo lãnh xử lý tranh chấp; và tiềm năng mở rộng từ các gói tài trợ hiển thị ưu tiên trên bản đồ cho các quán nước mới khai trương."*

---

### Slide 14: Hạn chế & Hướng phát triển Tương lai
- **Hình ảnh trình chiếu:** Lộ trình phát triển: Tích hợp cổng thanh toán trực tiếp PayOS/MoMo, AI gợi ý thực đơn, Ứng dụng di động Native React Native.
- **Lời thoại thuyết trình:**
  > *"Hiện tại, dự án vẫn còn một số điểm có thể cải thiện như việc cần tích hợp thêm cổng thanh toán trực tiếp từ các ngân hàng để thay thế webhook giả lập, và phát triển ứng dụng di động Native để có thông báo đẩy. Đây sẽ là những mục tiêu trọng tâm nếu nhóm tiếp tục phát triển sản phẩm ra thị trường thực tế."*

---

### Slide 15: Lời Kết & Hỏi đáp (Q&A)
- **Hình ảnh trình chiếu:** Lời cảm ơn, thông tin liên hệ của Nhóm và mã QR truy cập kho mã nguồn GitHub / Demo trực tuyến.
- **Lời thoại thuyết trình:**
  > *"Kính thưa Quý Thầy Cô, dự án SyncHub là kết tinh của sự nỗ lực, tinh thần kỷ luật và sự kết hợp chặt chẽ giữa tư duy kinh doanh và kỹ thuật công nghệ thông tin của cả 5 thành viên trong nhóm. Chúng em xin chân thành cảm ơn sự lắng nghe và chỉ dẫn quý báu của Thầy Cô. Sau đây, nhóm xin sẵn sàng tiếp thu các câu hỏi và đóng góp ý kiến từ Hội đồng. Em xin trân trọng cảm ơn!"*
