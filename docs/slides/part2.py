from deck_lib import *


def s05(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · GIẢI PHÁP", "Năm bước, một mã phòng",
           "Mọi thứ bắt đầu từ một slot đã giữ và kết thúc ở một sổ cái đã quyết toán.")

    steps = [
        ("01", "Giữ slot", "Một câu UPDATE nguyên tử; giữ chỗ 10 phút.", "10 phút · job 60 giây", "BR-SLT-01/02"),
        ("02", "Mở phòng", "Mã mời 6 ký tự; hạn chốt 45 phút, chặn trước giờ 15 phút.", "Mã 6 ký tự · mời qua QR", "BR-INT-01"),
        ("03", "Chốt giỏ", "Cả nhóm thêm món; khóa giỏ trước khi chia.", "Socket.io · 50 tin chat", "BR-INT-04"),
        ("04", "Chia bill", "Largest Remainder + khấu trừ tiền cọc.", "215.000đ · 4 hóa đơn", "BR-INT-02"),
        ("05", "Ký quỹ", "Check-in mới giải ngân; khiếu nại thì đóng băng.", "8%/12% · idempotency key", "BR-ESC-02/03"),
    ]
    for i, (num, title, desc, detail, br) in enumerate(steps):
        x = 0.62 + i * 2.46
        card(s, x, 1.82, 2.24, 3.22, fill=WHITE, line=LINE, radius=0.07)
        badge(s, x + 0.18, 2.00, 0.40, num, fill=FOREST if i < 4 else EMERALD, size=9.0)
        text(s, x + 0.18, 2.52, 1.95, 0.30, title, size=14.0, color=INK, bold=True)
        text(s, x + 0.18, 2.88, 1.92, 0.80, desc, size=9.8, color=MUTED, line_spacing=1.15)
        text(s, x + 0.18, 3.64, 1.92, 0.30, detail, size=8.0, color=EMERALD, bold=True)
        pill(s, x + 0.18, 4.36, 1.55, 0.28, br, fill=MINT2, color=FOREST, size=7.6)
        if i < 4:
            arrow(s, x + 2.28, 3.22, w=0.15, h=0.18, color=EMERALD)

    card(s, 0.62, 5.36, 12.09, 1.10, fill=FOREST, line=None, radius=0.07, shadow=False)
    text(s, 0.88, 5.50, 2.0, 0.26, "KẾT QUẢ", size=8.4, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    outcomes = [("1 mã phòng", "thay cho 4 công cụ"), ("1 hóa đơn / người", "không cần thủ quỹ"),
                ("1 sổ cái", "HOLD → RELEASE"), ("0 đồng lệch", "kiểm chứng 215.000đ")]
    for i, (big, small) in enumerate(outcomes):
        xx = 0.88 + i * 2.98
        text(s, xx, 5.78, 2.7, 0.34, big, size=15.5, color=WHITE, bold=True)
        text(s, xx, 6.12, 2.7, 0.24, small, size=8.8, color=RGBColor(0xCF, 0xEC, 0xDF))
        if i:
            line(s, xx - 0.18, 5.82, xx - 0.18, 6.28, color=FOREST2, width=1.0)

    footer(s, 5)
    notes(s, "Năm bước tương ứng năm nhóm use case trong báo cáo. Điểm quan trọng là các bước không rời nhau: giữ slot tạo ra phòng, phòng tạo ra giỏ, giỏ đã khóa mới chia được, và chỉ khi check-in thì tiền mới rời escrow. Mỗi bước đều có mã quy tắc nghiệp vụ đi kèm để truy vết. (1:10)")
    return s


def s06(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · SẢN PHẨM", "Khám phá và giữ chỗ trong một màn hình",
           "Bản đồ, bộ lọc và slot 10 phút nằm cùng một luồng — không cần chuyển app.")

    picture(s, "01-discover.png", 0.62, 1.72, 7.35, 4.59, radius=0.07)

    bullets = [
        ("25 địa điểm trong 3 km", "10 sân/phòng + 15 quán F&B quanh Làng ĐH Thủ Đức"),
        ("Leaflet + Haversine", "Lọc loại, danh mục và bán kính 1–5 km"),
        ("Slot 10 phút", "Đồng hồ đếm ngược ngay trên thẻ giờ"),
        ("Dữ liệu seed thật", "355 slot · 18 món · 4 voucher"),
    ]
    for i, (title, desc) in enumerate(bullets):
        y = 1.78 + i * 0.70
        rect(s, 8.30, y + 0.05, 0.18, 0.18, fill=EMERALD, line=None, radius=0.5)
        text(s, 8.60, y, 4.0, 0.28, title, size=11.4, color=INK, bold=True)
        text(s, 8.60, y + 0.27, 4.05, 0.30, desc, size=8.9, color=MUTED, line_spacing=1.05)

    picture(s, "02-venue.png", 8.30, 4.62, 4.38, 1.98, radius=0.06)

    footer(s, 6)
    notes(s, "Đây là màn hình khám phá thật của bản chạy ngày 14/11. Bộ lọc trả 25 địa điểm trong bán kính 3 km; bản đồ dùng tọa độ seed và công thức Haversine. Khi chọn một sân, người dùng thấy các khung giờ và nút giữ slot 10 phút. Ảnh nhỏ bên dưới là trang chi tiết sân với các slot thật. (1:05)")
    return s


def s07(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · KỸ THUẬT · BOOKSLOT", "20 request cùng lúc, đúng một người thắng",
           "Không dùng mutex trong JavaScript: để PostgreSQL quyết định bằng một câu UPDATE có điều kiện.")

    code = [
        "// Prisma updateMany  →  một câu UPDATE",
        "UPDATE slots",
        "SET status = 'LOCKED',",
        "    locked_by = $user,",
        "    locked_until = now() + interval '10 minutes'",
        "WHERE id = $slot",
        "  AND ( status = 'AVAILABLE'",
        "     OR (status = 'LOCKED'",
        "         AND locked_until < now()) )",
        "  AND NOT EXISTS (",
        "    SELECT 1 FROM group_lobbies",
        "    WHERE slot_id = slots.id",
        "      AND status = 'CANCELLED' );",
        "",
        "-- count = 1  →  người thắng",
        "-- count = 0  →  409 SLOT_TAKEN",
    ]
    code_block(s, 0.62, 1.78, 6.60, 3.40, code, size=8.7)

    # metric card
    card(s, 7.52, 1.78, 2.52, 1.22, fill=FOREST, line=None, radius=0.07, shadow=False)
    text(s, 7.72, 1.90, 2.1, 0.62, "1 / 20", size=34, color=WHITE, bold=True, line_spacing=0.9)
    text(s, 7.74, 2.54, 2.1, 0.26, "request giữ được slot", size=8.8, color=RGBColor(0xCF, 0xEC, 0xDF))
    card(s, 10.20, 1.78, 2.52, 1.22, fill=WHITE, line=LINE, radius=0.07, shadow=False)
    text(s, 10.40, 1.90, 2.1, 0.62, "409", size=34, color=RED, bold=True, line_spacing=0.9)
    text(s, 10.42, 2.54, 2.1, 0.26, "19 request còn lại", size=8.8, color=MUTED)

    stats = [("10 phút", "thời hạn giữ chỗ"), ("60 giây", "job quét slot hết hạn"), ("0 mutex", "trong tiến trình Node")]
    for i, (big, small) in enumerate(stats):
        yy = 3.18 + i * 0.62
        text(s, 7.56, yy, 2.1, 0.32, big, size=16.5, color=FOREST, bold=True)
        text(s, 9.35, yy + 0.06, 3.3, 0.24, small, size=9.2, color=MUTED)

    # 20 dots
    text(s, 7.56, 5.08, 4.8, 0.22, "Mô phỏng 20 yêu cầu đồng thời", size=8.4, color=MUTED, bold=True)
    for i in range(20):
        col, row = i % 10, i // 10
        fill = EMERALD if i == 4 else RGBColor(0xD8, 0xD4, 0xC6)
        rect(s, 7.58 + col * 0.235, 5.38 + row * 0.235, 0.16, 0.16, fill=fill, line=None, radius=0.5)
    text(s, 10.02, 5.36, 2.8, 0.46, "1 xanh · 19 xám", size=9.4, color=FOREST, bold=True)
    text(s, 10.02, 5.60, 2.8, 0.46, "kiểm thử bookslot", size=8.6, color=MUTED)

    card(s, 7.56, 5.98, 5.16, 0.86, fill=WHITE, line=LINE, radius=0.06, shadow=False)
    text(s, 7.74, 6.06, 4.8, 0.22, "VÌ SAO KHÔNG DÙNG MUTEX?", size=7.6, color=EMERALD, bold=True)
    text(s, 7.74, 6.30, 4.85, 0.46,
         "Khóa hàng nằm trong PostgreSQL; tiến trình Node không giữ trạng thái khóa nào.",
         size=8.6, color=FOREST, line_spacing=1.08)

    card(s, 0.62, 5.48, 6.60, 1.12, fill=CREAM2, line=None, radius=0.06, shadow=False)
    text(s, 0.82, 5.60, 6.2, 0.24, "HỦY PHÒNG & LỊCH SỬ SLOT", size=8.2, color=GOLD, bold=True)
    text(s, 0.82, 5.84, 6.25, 0.68,
         "Hủy phòng trả slot về AVAILABLE nhưng luật đặt lại vẫn chặn slot thuộc phòng CANCELLED. Lịch sử không bị đặt đè; audit ghi trong cùng transaction.",
         size=9.2, color=FOREST, line_spacing=1.12)

    footer(s, 7)
    notes(s, "Đây là câu UPDATE thật trong slotLock.js. Hai yêu cầu cùng lúc chỉ có một yêu cầu thấy trạng thái AVAILABLE, nên count = 1; yêu cầu còn lại count = 0 và trả 409. Test bookslot chạy 20 yêu cầu song song và kiểm tra đúng một thành công, 19 nhận 409. Hết 10 phút, job 60 giây quét và trả slot. Điểm đáng nói là hủy phòng không xóa lịch sử: slot về AVAILABLE nhưng bị chặn đặt lại nếu thuộc phòng CANCELLED. (1:15)")
    return s


def s08(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · KỸ THUẬT · GROUPORDER", "Cả nhóm cùng chốt trong một giỏ",
           "Socket.io giữ danh sách, giỏ và trò chuyện đồng bộ; server là nguồn dữ liệu có thẩm quyền.")

    picture(s, "03b-lobby-chat.png", 0.62, 1.76, 6.78, 4.24, radius=0.07)
    text(s, 0.62, 6.10, 6.78, 0.26,
         "Ảnh chụp phòng SYNC01: giỏ nhóm, gợi ý quán và chat realtime.",
         size=8.0, color=MUTED, italic=True)

    bullets = [
        ("Room `lobby:SYNC01`", "cart:updated · member:joined · chat:message · payment:confirmed"),
        ("Khóa giỏ BR-INT-04", "Sau khi chốt, server chặn thêm hoặc sửa món để kết quả chia tái lập được."),
        ("Chat 50 tin / phòng", "Lưu trong RAM, không thêm bảng thứ 13; mất khi khởi động lại."),
        ("Voucher CROSS", "Chỉ hợp lệ khi quán cách sân ≤ 1 km và giỏ đủ điều kiện."),
    ]
    for i, (title, desc) in enumerate(bullets):
        y = 1.78 + i * 0.94
        rect(s, 7.62, y + 0.05, 0.18, 0.18, fill=EMERALD, line=None, radius=0.5)
        text(s, 7.92, y, 4.75, 0.26, title, size=11.0, color=INK, bold=True)
        text(s, 7.92, y + 0.27, 4.70, 0.55, desc, size=8.8, color=MUTED, line_spacing=1.08)

    card(s, 7.62, 5.58, 5.05, 1.06, fill=FOREST, line=None, radius=0.06, shadow=False)
    text(s, 7.80, 5.68, 4.7, 0.22, "GỢI Ý QUÁN · RULE-BASED SCORING", size=7.8, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 7.80, 5.94, 4.7, 0.28, "0,5·gần  +  0,3·đang mở  +  0,2·phổ biến  +  0,15·voucher",
         size=9.6, color=WHITE, bold=True)
    text(s, 7.80, 6.24, 4.7, 0.24, "Chuẩn hóa order_count; top 3 món bán chạy kèm lý do gợi ý.", size=7.6, color=RGBColor(0xCF, 0xEC, 0xDF))

    footer(s, 8)
    notes(s, "Màn hình bên trái là phòng SYNC01 thật: giỏ của bốn người, gợi ý quán và chat. Socket.io phát cập nhật giỏ, thành viên, chat và thanh toán; client không tự tính lại mà hiển thị theo server. Khóa giỏ là điều kiện để kết quả chia tái lập. Chat giới hạn 50 tin mỗi phòng và nằm ngoài schema — đây là quyết định có ý thức để giữ đúng 12 bảng. (1:10)")
    return s


def s09(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · KỸ THUẬT · SPLIT BILL", "215.000đ → 4 hóa đơn, không lệch một đồng",
           "Ca chuẩn lấy từ split-bill.test.js: sân 120.000đ, món 100.000đ, ship 15.000đ, voucher FNB −20.000đ.")

    card(s, 0.62, 1.72, 7.68, 3.68, fill=WHITE, line=LINE, radius=0.06, shadow=False)
    cols = [("Thành viên", 0.78, 1.46, "left"), ("Sân", 2.24, 0.82, "right"), ("Món", 3.10, 0.82, "right"),
            ("Ship/Voucher", 3.96, 1.08, "right"), ("Tổng", 5.08, 0.88, "right"),
            ("Đã cọc", 6.00, 0.80, "right"), ("Phải trả", 6.84, 0.96, "right")]
    rect(s, 0.78, 1.86, 7.36, 0.38, fill=MINT2, line=None, radius=0.03)
    for label, x, w, al in cols:
        text(s, x, 1.92, w, 0.24, label, size=8.2, color=FOREST, bold=True,
             align=PP_ALIGN.RIGHT if al == "right" else PP_ALIGN.LEFT)

    rows = [
        ("A · Host · 98đ", "30.000", "25.000", "−1.250", "53.750", "0", "53.750", False),
        ("B · 82đ · hạng B", "30.000", "30.000", "−1.500", "58.500", "9.000", "49.500", False),
        ("C · 64đ · hạng C", "30.000", "0", "0", "30.000", "30.000", "0", True),
        ("D · 95đ · hạng A", "30.000", "45.000", "−2.250", "72.750", "0", "72.750", False),
    ]
    for i, (name, court, food, ship, total, dep, pay, highlight) in enumerate(rows):
        y = 2.30 + i * 0.66
        if highlight:
            rect(s, 0.78, y - 0.04, 7.36, 0.60, fill=GOLD2, line=None, radius=0.03)
        line(s, 0.78, y + 0.56, 8.14, y + 0.56, color=LINE, width=0.8)
        text(s, 0.80, y + 0.10, 1.42, 0.28, name, size=8.6, color=INK, bold=True)
        for val, (label, x, w, al) in zip([court, food, ship, total, dep, pay], cols[1:]):
            text(s, x, y + 0.10, w, 0.28, val, size=8.8, color=MUTED,
                 align=PP_ALIGN.RIGHT, bold=(label == "Phải trả"))
    line(s, 0.78, 4.96, 8.14, 4.96, color=FOREST, width=1.4)
    text(s, 0.80, 5.02, 4.2, 0.26, "Tổng gross 215.000 · cọc 39.000", size=8.4, color=MUTED, bold=True)
    text(s, 5.30, 5.02, 2.84, 0.26, "Phải thu 176.000đ", size=10.0, color=FOREST, bold=True, align=PP_ALIGN.RIGHT)

    # steps
    steps = [
        ("1", "Sân ròng ÷ 4", "120.000 ÷ 4 = 30.000/người"),
        ("2", "Món theo người", "25k · 30k · 0 · 45k"),
        ("3", "Ship + voucher theo tỷ trọng món", "−1.250 · −1.500 · 0 · −2.250"),
        ("4", "Largest Remainder", "đồng dư 1đ về Host"),
        ("5", "Trừ cọc đã nộp", "B còn 49.500 · C còn 0"),
    ]
    for i, (num, title, desc) in enumerate(steps):
        y = 1.78 + i * 0.78
        badge(s, 8.58, y + 0.02, 0.34, num, fill=FOREST if i < 4 else EMERALD, size=8.2)
        text(s, 9.04, y, 3.65, 0.26, title, size=10.2, color=INK, bold=True)
        text(s, 9.04, y + 0.27, 3.65, 0.30, desc, size=8.6, color=MUTED)

    card(s, 8.58, 5.78, 4.12, 0.86, fill=MINT2, line=None, radius=0.06, shadow=False)
    text(s, 8.74, 5.88, 3.8, 0.26, "Σ total + Σ cọc = 215.000đ", size=11.2, color=FOREST, bold=True)
    text(s, 8.74, 6.18, 3.8, 0.26, "0đ lệch · 7 ca kiểm thử", size=8.8, color=EMERALD, bold=True)

    footer(s, 9)
    notes(s, "Đây là ca chuẩn trong báo cáo và trong test. Tiền sân ròng chia đều 30.000. Tiền món theo người. Ship 15.000 và voucher FNB 20.000 được phân bổ theo tỷ trọng món, nên mỗi người chịu một phần khác nhau. Phần dư đồng được chia theo Largest Remainder, ưu tiên người tạo phòng khi đồng hạng. Cuối cùng trừ cọc: B đã cọc 9.000 nên còn 49.500; C cọc 30.000 nên còn 0. Tổng phải thu 176.000, cộng 39.000 cọc đúng bằng 215.000. (1:20)")
    return s
