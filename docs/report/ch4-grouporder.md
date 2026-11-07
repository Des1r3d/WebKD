# Báo cáo Triển khai Khối 4: GroupOrder Realtime & Chia Bill (WBS-4.1, 4.2, 4.3)

---

## 1. Tổng quan Phân hệ Khối 4

Khối 4 là trái tim liên kết hai nghiệp vụ cốt lõi của **SyncHub**: **Đặt sân (BookSlot)** và **Gọi đồ ăn uống nhóm (GroupOrder)** thành một trải nghiệm liền mạch theo thời gian thực (Realtime), tự động tối ưu chi phí thông qua gợi ý địa điểm thông minh và phân bổ hóa đơn chuẩn xác tới từng đồng VND.

Toàn bộ logic tuân thủ nghiêm ngặt **12 bảng cơ sở dữ liệu** và các **Luật Nghiệp vụ (BR)** đã khóa trong `CONTEXT.md`.

| Hạng mục | WBS | Nghiệp vụ Lõi & Ràng buộc | Trạng thái |
|---|---|---|---|
| **Socket.io Giỏ hàng chung & Chat Realtime** | WBS-4.1 | Room `lobby:{id}`, đồng bộ giỏ hàng `< 1s`, in-memory 50 tin nhắn chat, khóa giỏ tức thì khi Host chốt (`BR-INT-01`, `BR-INT-04`) | **Hoàn thành** |
| **Gợi ý Thông minh & Voucher Chéo** | WBS-4.2 | `GET /api/recommend?lobbyId=`, thuật toán điểm score đa tiêu chí (khoảng cách, giờ mở, độ phổ biến, bonus voucher), kiểm tra điều kiện voucher CROSS (`BR-INT-05`) | **Hoàn thành** |
| **Chia Bill Largest Remainder & VietQR** | WBS-4.3 | `POST /api/lobbies/:id/split`, thuật toán Hamilton/Largest Remainder chia đều phần dư, khớp hoàn hảo ca chuẩn 215.000 VND & các ca biên, sinh URL VietQR chuẩn Napas 247 | **Hoàn thành** |

---

## 2. Chi tiết Kỹ thuật Các Phân hệ (WBS-4.1 → WBS-4.3)

### 2.1 WBS-4.1: Socket.io Giỏ hàng chung & Chat Realtime (BR-INT-01, BR-INT-04)

#### 1. Kiến trúc Phòng Realtime (Room `lobby:{id}`)
- Sử dụng Socket.io thiết lập phòng cách ly theo mã hoặc ID phòng (`lobby:${lobbyId}`).
- Khi người dùng tham gia phòng (`lobby:join`), server tự động gửi:
  - `lobby:members`: Danh sách thành viên cùng trạng thái điểm uy tín & tiền cọc.
  - `cart:updated`: Danh sách món trong giỏ hàng chung kèm tổng tiền `subtotal` và ID quán FNB.
  - `chat:message`: Lịch sử 50 tin nhắn gần nhất được lưu trữ in-memory.

#### 2. Đồng bộ Thao tác Giỏ hàng & Ràng buộc Server là Nguồn Sự Thật
- Các sự kiện `cart:add`, `cart:update`, `cart:remove` được xử lý nguyên tử tại server.
- **Ràng buộc nghiệp vụ BR-INT-01 & BR-INT-04:**
  - Server kiểm tra `lobby.status === 'OPEN'` trước mọi thao tác ghi giỏ hàng.
  - Khi Host kích hoạt khóa phòng (`POST /api/lobbies/:id/lock`), server lập tức chuyển trạng thái sang `LOCKED`, phát sự kiện broadcast `lobby:locked` đến toàn bộ client trong phòng.
  - Mọi request thêm/sửa/xóa món sau thời điểm này đều bị từ chối ngay lập tức với mã lỗi HTTP `403 LOBBY_LOCKED` hoặc event `notify: ERROR`.

---

### 2.2 WBS-4.2: Gợi ý Thông minh (Rule-based) & Voucher Chéo (BR-INT-05)

#### 1. Công thức Điểm Gợi ý Quán FNB
Để hỗ trợ Host chọn quán nước/ăn nhẹ phù hợp nhất quanh sân đã đặt, hệ thống áp dụng công thức tính điểm minh bạch (Explainable AI / Rule-based):

$$\text{score} = 0.5 \times \max\left(0, 1 - \frac{d_{\text{meters}}}{1000}\right) + 0.3 \times \text{isOpenAtSlotTime} + 0.2 \times \text{norm}(\text{order\_count}) + \text{crossVoucherBonus}(0.15)$$

- **Khoảng cách ($0.5$):** Ưu tiên các quán trong bán kính $1\text{ km}$ từ sân thể thao (`prv-venue`).
- **Khung giờ mở cửa ($0.3$):** Kiểm tra giờ bắt đầu slot (`slot.start_at`) có nằm trong chuỗi `open_hours` của quán hay không (VD: `"08:00-22:30"`).
- **Độ phổ biến ($0.2$):** Tỷ lệ tổng số lượt đặt món của quán so với quán cao nhất trên hệ thống.
- **Bonus Voucher Chéo ($0.15$):** Thưởng điểm nếu có mã giảm giá `CROSS` khả dụng trong phạm vi khoảng cách.

#### 2. Kiểm chứng Luật Nghiệp vụ Voucher Chéo (BR-INT-05)
Endpoint `POST /api/vouchers/validate` kiểm soát nghiêm ngặt 3 điều kiện tiên quyết:
1. Phòng phải có cả slot sân và đơn gọi đồ FNB (`cart_items.length > 0`).
2. Khoảng cách Haversine giữa sân (`VENUE`) và quán (`FNB`) không vượt quá `max_distance_m` của voucher (mặc định $1.000\text{ m}$).
3. Đơn hàng đạt giá trị tối thiểu (`min_order`), trong thời hạn hiệu lực và chưa vượt giới hạn lượt dùng.

---

### 2.3 WBS-4.3: Dịch vụ Chia Bill `splitBill.ts` (Largest Remainder) & Sinh VietQR

#### 1. Thuật toán Chia Bill Chuẩn (BR-INT-02)
1. **Tiền sân ròng (`slot_net`):**
   $$\text{slot\_net} = \max(0, \text{slot\_price} - \text{venue\_or\_cross\_discount})$$
   Phần tiền sân cơ bản chia đều cho $N$ thành viên `JOINED`: $\text{slot\_share}_i = \text{slot\_net} / N$.
2. **Tiền món cá nhân (`food_i`):** Tính tổng tiền các món do từng thành viên chọn.
3. **Điều chỉnh FNB (`adj` = Phí Ship − Voucher FNB):**
   - Nếu $\Sigma\text{food} = 0$: $\text{adj} = 0$.
   - Nếu $\Sigma\text{food} > 0$: Phân bổ $\text{adj} \times (\text{food}_i / \Sigma\text{food})$.
4. **Phân phối Phần dư Largest Remainder (Hamilton Method):**
   - Tính phần nguyên $\text{floor}_i = \lfloor \text{raw}_i \rfloor$ và phần dư lẻ $\text{frac}_i = \text{raw}_i - \text{floor}_i$.
   - Tính số tiền dư cần bù: $\Delta = \text{GrandTotal} - \sum \text{floor}_i$.
   - Sắp xếp giảm dần theo $\text{frac}_i$; nếu bằng nhau, **ưu tiên Host nhận phần dư trước**, sau đó theo thứ tự tham gia phòng (`joined_at`).
   - Cộng $+1\text{ VND}$ cho $\Delta$ người đầu tiên.
5. **Khấu trừ tiền cọc (`deposit_offset`):**
   $$\text{total}_i = \max(0, \text{gross\_total}_i - \text{deposit\_paid}_i)$$
6. **Bất biến Bắt buộc (Assertion):**
   $$\sum_{i=1}^N \text{gross\_total}_i === \text{GrandTotal}$$
   Nếu sai lệch dù chỉ 1 VND $\rightarrow$ Server `throw Error('SPLIT_SUM_MISMATCH')` và rollback toàn bộ.

#### 2. Ma trận Kiểm thử Ca Chuẩn 215.000 VND (Đã Pass Unit Test)

- Sân `120.000` VND / 4 người (A là Host, B, C, D);
- Món: A `25.000`, B `30.000`, C `0`, D `45.000` ($\Sigma\text{food} = 100.000$);
- Ship `15.000`, Voucher FNB `-20.000` ($\text{adj} = -5.000$).

| Thành viên | `slot_share` | `food_amount` | `ship_share` | `discount_share` | `adj` ròng | **`total` (VND)** |
|---|---:|---:|---:|---:|---:|---:|
| **A (Host)** | 30.000 | 25.000 | 3.750 | 5.000 | −1.250 | **53.750** |
| **B** | 30.000 | 30.000 | 4.500 | 6.000 | −1.500 | **58.500** |
| **C** | 30.000 | 0 | 0 | 0 | 0 | **30.000** |
| **D** | 30.000 | 45.000 | 6.750 | 9.000 | −2.250 | **72.750** |
| **Tổng ($\Sigma$)** | **120.000** | **100.000** | **15.000** | **20.000** | **−5.000** | **215.000** ✔ |

#### 3. Cấu trúc VietQR Chuẩn Sinh Tự Động
Hệ thống tạo mã VietQR theo chuẩn Napas 247 thông qua dịch vụ `img.vietqr.io`:
```
https://img.vietqr.io/image/${BANK}-${ACCOUNT}-compact2.png?amount=${total}&addInfo=SYNCHUB%20${inviteCode}%20${userId}&accountName=${NAME}
```
Mỗi thành viên khi bấm vào hóa đơn cá nhân sẽ nhìn thấy đúng số tiền của mình kèm cú pháp chuyển khoản định danh duy nhất (`SYNCHUB {inviteCode} {user_id}`).

---

## 3. Kết quả Kiểm thử Toàn bộ Phân hệ

Hệ thống đã triển khai đầy đủ bộ unit & integration tests trong `server/tests/split-bill.test.ts` và `server/tests/grouporder.test.ts`:
- **52 / 52 tests PASS (100%)**
- Bao gồm:
  - 7 ca kiểm thử thuật toán chia bill `splitBill.ts` (Ca 215k, ca 1 người, ca không ai gọi món, ca phân phối phần dư Hamilton, ca khấu trừ cọc, ca voucher CROSS, ca cấu trúc VietQR).
  - 10 ca kiểm thử API tích hợp giỏ hàng, khóa phòng, gợi ý thông minh, và voucher chéo.
  - 35 ca kiểm thử thừa kế từ Khối 2 & Khối 3 (Khóa slot nguyên tử, RBAC, phân hạng uy tín).
