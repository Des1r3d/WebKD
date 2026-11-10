# Phụ lục 1: Quy chế & Chính sách Xử lý Trách nhiệm, Khiếu nại và Tranh chấp

---

# QUY CHẾ VẬN HÀNH & CHÍNH SÁCH BẢO LÃNH GIAO DỊCH SYNCHUB
*(Ban hành và áp dụng chính thức từ Tháng 11/2026 trên toàn bộ hệ sinh thái SyncHub)*

---

## Điều 1: Phạm vi Áp dụng & Định nghĩa Thuật ngữ

### 1.1 Phạm vi áp dụng
Chính sách này điều chỉnh toàn bộ quyền, nghĩa vụ, quy trình giải quyết tranh chấp và cơ chế bồi thường phát sinh giữa các bên tham gia giao dịch trên nền tảng **SyncHub** (bao gồm Người khởi tạo kèo `HOST`, Thành viên tham gia `MEMBER`, Đối tác Sân bãi `VENUE`, Đối tác Ăn uống `FNB` và Bộ phận Quản trị sàn `ADMIN`).

Bằng việc đăng ký tài khoản, tham gia phòng ghép kèo hoặc đăng ký cung cấp dịch vụ trên nền tảng SyncHub, các bên xác nhận đã đọc, hiểu rõ và tự nguyện cam kết tuân thủ vô điều kiện các điều khoản trong chính sách này.

### 1.2 Định nghĩa thuật ngữ
1. **Phòng ghép kèo (`GroupLobby`):** Không gian tương tác trực tuyến kết nối các cá nhân có cùng nhu cầu sử dụng dịch vụ sân bãi và gọi đồ uống trong cùng một khung giờ.
2. **Khung giờ dịch vụ (`Slot`):** Khoảng thời gian cụ thể (thường từ 60 đến 120 phút) tại một sân thể thao hoặc phòng học nhóm được bảo đảm quyền sử dụng.
3. **Ví trung gian Escrow:** Hệ thống tài khoản kỹ thuật do SyncHub vận hành nhằm tạm giữ tiền thanh toán của người dùng (`HOLD`) và chỉ giải ngân cho các nhà cung cấp (`RELEASE`) khi dịch vụ đã được xác nhận hoàn tất (Check-in) hợp lệ.
4. **Hiện tượng Bùng kèo (`NO_SHOW`):** Hành vi thành viên đã đăng ký tham gia phòng nhưng vắng mặt không lý do chính đáng tại thời điểm bắt đầu khung giờ dịch vụ, gây thiệt hại chi phí cho nhóm và chủ sân.
5. **Khóa Idempotency (`idempotency_key`):** Chuỗi mã định danh duy nhất của mỗi giao dịch giải ngân, bảo đảm ngăn chặn tuyệt đối tình trạng giải ngân đúp do thao tác lặp lại hoặc lỗi truyền thông mạng.

---

## Điều 2: Quyền & Trách nhiệm của các Bên Tham gia

### 2.1 Trưởng nhóm khởi tạo kèo (`HOST`)
- **Quyền hạn:** Được quyền lựa chọn khung giờ sân, mở phòng ghép kèo, mời thành viên qua mã QR, chọn quán FNB liên kết và kích hoạt lệnh chốt phòng (`LOCKED`) để kích hoạt chia bill.
- **Trách nhiệm:** Đại diện nhóm giao tiếp với chủ sân; không được tự ý hủy phòng sau khi đã chốt đơn mà không có sự đồng thuận của các thành viên; chịu trách nhiệm đối soát thông tin ban đầu.

### 2.2 Thành viên tham gia phòng (`MEMBER`)
- **Quyền hạn:** Tự do lựa chọn món đồ uống theo ý thích; được quyền khiếu nại và yêu cầu hoàn tiền nếu dịch vụ nhận được không đúng cam kết; được tích lũy điểm uy tín sau mỗi giao dịch thành công.
- **Trách nhiệm:** Nộp tiền cọc (nếu thuộc Hạng B hoặc C) theo quy định `BR-REP-01`; quét mã VietQR thanh toán đúng số tiền và cú pháp trong thời hạn quy định; có mặt đúng giờ thi đấu tại sân.

### 2.3 Đối tác Cung cấp Sân bãi (`VENUE PROVIDER`)
- **Quyền hạn:** Nhận 92% giá trị tiền sân ròng ngay sau khi khách check-in tại sân; nhận toàn bộ tiền cọc bồi thường (`PENALTY`) từ quỹ Escrow nếu thành viên của phòng bùng kèo (`NO_SHOW`).
- **Trách nhiệm:** Đảm bảo sân bãi đúng tiêu chuẩn cam kết (đèn chiếu sáng, mặt sân, lưới, vệ sinh); giữ đúng khung giờ đã được hệ thống xác nhận `BOOKED`; thực hiện điểm danh khách trung thực trên Provider Portal.

### 2.4 Đối tác Cung cấp Ăn uống (`FNB PROVIDER`)
- **Quyền hạn:** Nhận 88% tổng giá trị đơn nước ròng sau khi giao hàng thành công tới sân; được bảo đảm thanh toán qua ví trung gian Escrow trước khi chuẩn bị món.
- **Trách nhiệm:** Chế biến đúng món, đúng định lượng và ghi chú của khách; đóng gói cẩn thận và giao tới đúng địa chỉ sân bãi trước giờ bắt đầu slot thi đấu ít nhất 5–10 phút.

---

## Điều 3: Cơ chế Giữ tiền Escrow & Vòng đời Giao dịch

Mọi giao dịch thanh toán trên SyncHub bắt buộc phải tuân thủ nghiêm ngặt chu trình 4 giai đoạn của ví Escrow:

```text
[GIAI ĐOẠN 1: TẠO HÓA ĐƠN] ---> [GIAI ĐOẠN 2: TẠM GIỮ TIỀN] ---> [GIAI ĐOẠN 3: ĐIỂM DANH] ---> [GIAI ĐOẠN 4: GIẢI NGÂN]
- Host khóa phòng (LOCKED)     - Thành viên quét VietQR        - Khách đến sân thi đấu         - Tách quỹ Escrow tự động
- Thuật toán Largest           - Webhook xác nhận PAID         - Chủ sân bấm Check-in          - VENUE nhận 92% ròng
  Remainder chia bill          - Escrow lưu trạng thái         - Điểm danh từng thành          - FNB nhận 88% ròng
- Sinh mã VietQR cá nhân         HELD (Giữ tiền an toàn)         viên (CHECKED_IN / NO_SHOW)   - Chặn giải ngân đúp
```

- **Nguyên tắc giải ngân:** Tiền chỉ được chuyển vào tài khoản ngân hàng của đối tác sau khi có hành động xác nhận Check-in hợp lệ. Tuyệt đối không giải ngân trước giờ bắt đầu khung giờ dịch vụ.
- **Tỷ lệ khấu trừ hoa hồng nền tảng:**
  - Đối với dịch vụ Sân bãi (`VENUE`): Hoa hồng sàn là **8%** trên giá thuê sân ròng.
  - Đối với dịch vụ Đồ uống (`FNB`): Hoa hồng sàn là **12%** trên giá trị đơn hàng thực tế (sau khi trừ khuyến mãi và cộng phí ship).

---

## Điều 4: Cơ chế Tín nhiệm & Chế tài Xử phạt Bùng Kèo (No-show Policy)

Để bảo đảm tính cam kết và văn hóa sinh hoạt văn minh trong cộng đồng sinh viên, SyncHub áp dụng hệ thống quản trị tín nhiệm tự động:

### 4.1 Thang điểm uy tín & Mức cọc bắt buộc (`BR-REP-01`)
Mỗi tài khoản khi khởi tạo được cấp mặc định **100 điểm uy tín**. Điểm số biến động dựa trên lịch sử giao dịch:
- **Hạng A (Từ 90 đến 100 điểm):** Được đánh giá là thành viên uy tín cao $\rightarrow$ **Miễn cọc 100%** khi tham gia bất kỳ phòng ghép kèo nào.
- **Hạng B (Từ 70 đến 89 điểm):** Uy tín trung bình $\rightarrow$ Bắt buộc nộp trước **30% tiền sân dự kiến** vào quỹ Escrow khi bấm tham gia phòng.
- **Hạng C (Từ 50 đến 69 điểm):** Thành viên từng có lịch sử vi phạm hoặc hủy kèo muộn $\rightarrow$ Bắt buộc nộp trước **100% tiền sân dự kiến** vào quỹ Escrow.
- **Hạng FLAGGED (Dưới 50 điểm):** Tài khoản bị hệ thống tự động gắn cờ cảnh báo nguy cơ cao $\rightarrow$ **Bị khóa quyền tham gia mọi phòng ghép kèo mới**, chỉ được mở lại sau khi Admin xét duyệt giải trình.

### 4.2 Chế tài đối với hành vi bùng kèo (`NO_SHOW` — `BR-REP-02`)
Khi chủ sân thực hiện điểm danh tại sân và đánh dấu một thành viên là `NO_SHOW`:
1. **Chế tài điểm tín nhiệm:** Thành viên đó ngay lập tức bị **trừ -15 điểm uy tín**. Nếu số điểm sau khi trừ rơi xuống dưới 50 điểm, tài khoản lập tức bị hạ xuống hạng `FLAGGED`.
2. **Chế tài tài chính:** Toàn bộ số tiền cọc (`deposit_paid`) của thành viên đó bị tịch thu toàn bộ, chuyển thành giao dịch `PENALTY` trong Escrow để bồi thường thiệt hại trực tiếp cho Chủ sân (`VENUE PROVIDER`).
3. **Lưu vết kiểm toán:** Hệ thống tự động ghi một bản ghi bất biến vào bảng `audit_logs` với `action = 'REPUTATION_CHANGE'` để phục vụ tra cứu sau này.

### 4.3 Thưởng hoàn thành giao dịch văn minh (`CHECKED_IN` — `BR-REP-03`)
Thành viên có mặt đúng giờ và được chủ sân điểm danh `CHECKED_IN` sẽ được hệ thống tự động **cộng thưởng +2 điểm uy tín** (tối đa không vượt quá mốc trần 100 điểm).

---

## Điều 5: Quy trình Tiếp nhận & Phân xử Khiếu nại Tranh chấp

### 5.1 Thời hạn gửi khiếu nại
Người dùng có quyền nộp đơn khiếu nại trực tiếp trên ứng dụng trong vòng **24 giờ** kể từ thời điểm kết thúc khung giờ slot sân. Quá thời hạn trên, giao dịch được coi là hoàn tất mỹ mãn và hệ thống tự động giải phóng toàn bộ các ràng buộc giữ tiền.

### 5.2 Quy định về Bằng chứng Hợp lệ
Đơn khiếu nại chỉ được Ban Quản trị (`ADMIN`) tiếp nhận khi cung cấp đầy đủ các bằng chứng khách quan:
- Đối với khiếu nại Quán giao thiếu nước hoặc sai món: Bắt buộc tải lên **ảnh chụp thực tế các món nước đã nhận** kèm **ảnh chụp hóa đơn bán lẻ/tem dán trên ly** của quán.
- Đối với khiếu nại Sân bãi không đúng cam kết (mất điện, mặt sân ướt ngập): Bắt buộc tải lên **ảnh chụp/video hiện trạng sân bãi** tại thời điểm diễn ra khung giờ.

### 5.3 Cơ chế Đóng băng Escrow Từng phần (`BR-ESC-04`)
Ngay khi có khiếu nại được tạo (`status = 'OPEN'`), thuật toán bảo vệ tài chính kích hoạt cơ chế đóng băng có chọn lọc:
- **Chỉ khoản tiền dự kiến chi trả cho đối tác bị khiếu nại mới chuyển sang trạng thái `FROZEN`.**
- Khoản tiền của đối tác không liên quan (ví dụ: khách khiếu nại quán nước giao thiếu, nhưng chủ sân vẫn phục vụ chu đáo) **vẫn được giải ngân bình thường**, không bị giữ lại vô lý.

### 5.4 Bảng Khung Phân xử Bồi thường Chuẩn của Ban Quản trị

| Trường hợp sự cố phát sinh | Kết luận phân xử của Admin | Phương án xử lý tài chính từ Escrow | Tác động uy tín |
|---|---|---|---|
| **Quán giao thiếu một số món nước** | Chấp thuận (`RESOLVED`) | Trích hoàn tiền (`REFUND`) đúng giá trị các món thiếu trả về tài khoản người dùng; giải ngân phần tiền các món còn lại cho quán. | Quán bị nhắc nhở, tái phạm bị trừ điểm hiển thị. |
| **Quán không giao hàng / Giao trễ sau giờ chơi** | Chấp thuận (`RESOLVED`) | Hoàn trả 100% tiền nước + tiền phí ship cho toàn bộ thành viên trong phòng; phạt quán 10% giá trị đơn. | Quán bị trừ điểm ưu tiên gợi ý trong 7 ngày. |
| **Sân bị hỏng đèn / Không thể thi đấu** | Chấp thuận (`RESOLVED`) | Hoàn trả 100% tiền sân cho các thành viên; không giải ngân cho chủ sân. | Chủ sân bị cảnh cáo vi phạm chất lượng. |
| **Khiếu nại sai sự thật / Không có ảnh chứng cứ** | Từ chối (`REJECTED`) | Hủy bỏ khiếu nại, giải phóng khoản tiền `FROZEN` sang `RELEASED` chuyển trả 100% cho đối tác. | Người khiếu nại sai bị trừ -10 điểm uy tín. |

---

## Điều 6: Giới hạn Trách nhiệm của Nền tảng SyncHub

1. **Bản chất pháp lý của nền tảng:** SyncHub đóng vai trò thuần túy là **Đơn vị cung cấp giải pháp công nghệ kết nối trung gian** và **Bên thứ ba bảo lãnh thanh toán (Escrow)**, không sở hữu trực tiếp các cơ sở sân bãi hay cơ sở chế biến thực phẩm.
2. **Giới hạn bồi thường tối đa:** Trách nhiệm tài chính tối đa của SyncHub trong mọi trường hợp tranh chấp không vượt quá tổng số tiền mà các bên đã thực tế nộp vào quỹ Escrow cho phiên giao dịch phòng ghép kèo đó.
3. **Các trường hợp bất khả kháng:** SyncHub được miễn trừ trách nhiệm bồi thường nếu sự cố phát sinh do các nguyên nhân bất khả kháng theo quy định pháp luật (thiên tai bão lũ, sự cố mất điện lưới diện rộng, sự cố cáp quang quốc tế làm gián đoạn hạ tầng ngân hàng).
