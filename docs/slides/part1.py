from deck_lib import *


def s01(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    # right panel
    rect(s, 8.55, 0.55, 4.16, 6.40, fill=FOREST, line=None, radius=0.10)
    rect(s, 11.55, 0.85, 0.85, 0.85, fill=FOREST2, line=None, radius=0.5)
    rect(s, 8.95, 6.05, 0.55, 0.55, fill=EMERALD, line=None, radius=0.5)
    phone(s, 9.35, 0.95, 2.56, 5.55, "12-mobile-discover.png")

    text(s, 0.72, 0.62, 7.4, 0.28, "ĐỒ ÁN MÔN HỌC · PHÁT TRIỂN ỨNG DỤNG WEB KINH DOANH",
         size=10.5, color=EMERALD, bold=True)
    text(s, 0.66, 0.92, 7.5, 1.05, "SyncHub", size=66, color=FOREST, bold=True, line_spacing=0.92)
    text(s, 0.72, 2.02, 7.4, 0.55, "Một phòng cho cả buổi chơi.", size=26, color=INK, bold=True)
    text(s, 0.72, 2.64, 7.1, 0.72,
         "Đặt sân · Gọi món nhóm · Chia tiền tự động · Ký quỹ bảo vệ cọc",
         size=13.5, color=MUTED, line_spacing=1.2)

    labels = ["BookSlot", "GroupOrder", "Split Bill", "Escrow"]
    for i, lab in enumerate(labels):
        pill(s, 0.72 + i * 1.68, 3.52, 1.55, 0.36, lab, fill=MINT, color=FOREST, size=9.5)

    line(s, 0.72, 4.28, 7.4, 4.28, color=LINE, width=1.0)
    text(s, 0.72, 4.46, 7.3, 0.3, "NHÓM ___ · 4 THÀNH VIÊN", size=9.5, color=EMERALD, bold=True)
    text(s, 0.72, 4.80, 7.4, 0.62,
         "PO / Fullstack  ·  BA  ·  FE / UI-UX  ·  BE / DB + QA",
         size=12.5, color=INK, bold=True)
    text(s, 0.72, 5.46, 7.4, 0.28, "GVHD: ________", size=10.5, color=MUTED)
    text(s, 0.72, 6.62, 7.4, 0.28, "11/2026", size=9.5, color=MUTED)

    # floating result card
    card(s, 8.02, 3.62, 2.28, 1.06, fill=WHITE, line=LINE, radius=0.09)
    text(s, 8.18, 3.72, 2.0, 0.32, "215.000đ", size=17, color=FOREST, bold=True)
    text(s, 8.18, 4.06, 2.0, 0.46, "4 hóa đơn · 0đ lệch", size=9.2, color=EMERALD, bold=True)
    text(s, 8.18, 4.30, 2.0, 0.28, "SYNC01 · 4 thành viên", size=8.0, color=MUTED)

    notes(s, "Kính thưa thầy/cô và các bạn. SyncHub giải quyết một việc rất cụ thể: một nhóm bạn muốn chơi cầu lông hoặc học nhóm, nhưng phải dùng ba bốn công cụ khác nhau để chốt sân, gọi nước, chia tiền và giữ cọc. Trong 15–18 phút tới, nhóm trình bày bối cảnh và tác nhân, quy trình AS-IS/TO-BE, 14 use case, 21 quy tắc nghiệp vụ, ma trận truy vết, sản phẩm đang chạy, bốn điểm kỹ thuật lõi, mô hình doanh thu và giới hạn. (0:15)")
    return s


def s02(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "NỘI DUNG", "15–18 phút, 6 phần",
           "Mỗi phần gắn với một câu hỏi mà hội đồng có thể đặt ra.")

    rows = [
        ("01", "Bối cảnh & tác nhân", "Bài toán · 6 tác nhân · AS-IS → TO-BE", "4 phút"),
        ("02", "Use case & quy tắc", "14 UC · 21 BR · 6 tác nhân", "2 phút"),
        ("03", "Yêu cầu & truy vết", "14 FR · 6 NFR · 82/82 test", "1 phút"),
        ("04", "Sản phẩm & kỹ thuật lõi", "BookSlot · GroupOrder · Split · Escrow", "6,5 phút"),
        ("05", "Kinh doanh & hạn chế", "8%/12% · 9,8% · roadmap", "1,5 phút"),
        ("06", "Kết luận & Q&A", "Ba giá trị · demo", "0,5 phút"),
    ]
    for i, (num, title, desc, dur) in enumerate(rows):
        y = 1.70 + i * 0.72
        card(s, 0.62, y, 8.25, 0.62, fill=WHITE, line=LINE, radius=0.06, shadow=False)
        badge(s, 0.78, y + 0.12, 0.38, num, fill=FOREST if i < 4 else EMERALD, size=8.5)
        text(s, 1.30, y + 0.07, 4.2, 0.26, title, size=13.2, color=INK, bold=True)
        text(s, 1.30, y + 0.34, 5.6, 0.22, desc, size=9.2, color=MUTED)
        pill(s, 7.55, y + 0.16, 1.02, 0.30, dur, fill=MINT2, color=FOREST, size=8.2)

    rect(s, 9.28, 1.70, 3.42, 4.42, fill=FOREST, line=None, radius=0.09)
    text(s, 9.52, 1.88, 3.0, 0.28, "TỔNG THỜI LƯỢNG", size=9.0, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 9.50, 2.14, 3.0, 0.70, "15–18", size=40, color=WHITE, bold=True, line_spacing=0.9)
    text(s, 9.52, 2.82, 3.0, 0.28, "phút · 20 slide", size=11.0, color=RGBColor(0xCF, 0xEC, 0xDF))
    line(s, 9.52, 3.22, 12.42, 3.22, color=FOREST2, width=1.0)
    stats = [("82/82", "ca kiểm thử đạt"), ("14", "use case"), ("21", "quy tắc nghiệp vụ")]
    for i, (big, lab) in enumerate(stats):
        yy = 3.42 + i * 0.84
        text(s, 9.52, yy, 1.35, 0.36, big, size=20, color=WHITE, bold=True)
        text(s, 10.72, yy + 0.05, 1.95, 0.28, lab, size=9.2, color=RGBColor(0xCF, 0xEC, 0xDF))
    text(s, 9.52, 5.78, 2.9, 0.24, "Số liệu từ lần chạy 14/11/2026", size=7.4, color=RGBColor(0x9F, 0xD9, 0xC4))

    text(s, 0.62, 6.34, 8.2, 0.24,
         "Trọng tâm BA: tác nhân → quy trình → use case → quy tắc → truy vết.",
         size=8.6, color=EMERALD, bold=True)

    footer(s, 2)
    notes(s, "Sáu phần, khoảng 15–18 phút. Phần 1 đặt bối cảnh và tác nhân; phần 2 đi từ hiện trạng sang quy trình đích; phần 3 là use case và quy tắc nghiệp vụ; phần 4 là yêu cầu và truy vết; phần 5 là sản phẩm và kỹ thuật lõi; phần 6 là kinh doanh, hạn chế, kết luận. Nếu hội đồng hỏi sâu, nhóm ưu tiên phần 2–4 vì đó là phần BA. (0:20)")
    return s


def s03(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "01 · BÀI TOÁN", "Một buổi chơi, bốn lần đứt gãy",
           "Các cam kết phụ thuộc nhau, nhưng mỗi bước lại nằm ở một công cụ khác.")

    items = [
        ("01", "Chốt sân", "Nhắn tin hỏi giờ, không ai thực sự giữ chỗ. Hai nhóm có thể cùng “chốt” một slot.",
         "Ví dụ: hai nhóm cùng nhắn “9h mai nhé”.", "Trùng lịch, mất niềm tin."),
        ("02", "Gom món", "Mỗi người nhắn một món; người tổng hợp phải đọc lại hàng chục tin.",
         "Ví dụ: 4 người, 12 tin, 3 lần sửa.", "Sai món, quán giao muộn."),
        ("03", "Chia tiền", "Tiền sân, ship, voucher và cọc được tính tay trên nhiều đoạn chat.",
         "Ví dụ: 4 người, 3 cách tính, 3 kết quả.", "Lệch đồng, tranh cãi."),
        ("04", "Giữ tiền", "Chuyển khoản trước nhưng không ai đứng ra bảo vệ khoản cọc.",
         "Ví dụ: cọc 30.000đ, không ai hoàn.", "Bùng kèo, khó hoàn."),
    ]
    for i, (num, title, desc, example, risk) in enumerate(items):
        x = 0.62 + i * 3.03
        card(s, x, 1.78, 2.88, 3.92, fill=WHITE, line=LINE, radius=0.07)
        badge(s, x + 0.22, 1.98, 0.44, num, fill=FOREST, size=9.5)
        text(s, x + 0.22, 2.52, 2.45, 0.34, title, size=16, color=INK, bold=True)
        text(s, x + 0.22, 2.94, 2.44, 0.95, desc, size=10.4, color=MUTED, line_spacing=1.18)
        text(s, x + 0.22, 3.94, 2.44, 0.30, example, size=8.4, color=MUTED, italic=True)
        line(s, x + 0.22, 4.30, x + 2.66, 4.30, color=LINE, width=1.0)
        text(s, x + 0.22, 4.42, 2.44, 0.22, "HỆ QUẢ", size=8.2, color=GOLD, bold=True)
        text(s, x + 0.22, 4.66, 2.44, 0.62, risk, size=10.6, color=RED, bold=True)

    card(s, 0.62, 5.98, 12.09, 0.78, fill=CREAM2, line=None, radius=0.06, shadow=False)
    text(s, 0.86, 6.12, 1.5, 0.26, "CHI PHÍ ẨN", size=8.5, color=GOLD, bold=True)
    text(s, 1.95, 6.10, 10.55, 0.50,
         "3–4 công cụ · một người làm “thủ quỹ” · không có bằng chứng khi tranh chấp · không ai chịu trách nhiệm khi bùng kèo.",
         size=11.6, color=FOREST, bold=True)

    footer(s, 3)
    notes(s, "Bốn điểm đứt gãy không nằm ở một màn hình mà ở chỗ chuyển giao giữa các công cụ. Điểm chung là thiếu một thực thể duy nhất giữ cam kết: ai, giờ nào, món gì, trả bao nhiêu, tiền đang ở đâu. SyncHub chọn thực thể đó là phòng ghép kèo gắn với một slot. (1:00)")
    return s


def s04(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "01 · CƠ HỘI", "Chưa ai nối lịch sân với đơn nhóm và dòng tiền",
           "Ba cách đang được dùng đều giải quyết tốt một phần, nhưng bỏ trống phần còn lại.")

    rows = [
        ("Nhắn tin + chuyển khoản", "Linh hoạt, quen thuộc, không cần cài thêm.",
         "Không giữ chỗ, không đối soát, không có trạng thái buổi chơi."),
        ("Ứng dụng đặt sân", "Có lịch theo giờ, có xác nhận của đối tác.",
         "Không gom món, không chia tiền, không bảo vệ cọc."),
        ("Ứng dụng giao đồ ăn", "Có đơn nhóm và mời bạn cùng chọn.",
         "Không gắn tài nguyên theo giờ, không có cọc hay tranh chấp."),
    ]
    for i, (title, good, miss) in enumerate(rows):
        y = 1.78 + i * 1.30
        card(s, 0.62, y, 7.55, 1.14, fill=WHITE, line=LINE, radius=0.06, shadow=False)
        text(s, 0.86, y + 0.13, 7.0, 0.30, title, size=13.8, color=INK, bold=True)
        text(s, 0.86, y + 0.48, 3.5, 0.50, [[("Có  ", {"color": EMERALD, "bold": True}), (good, {"color": MUTED})]],
             size=9.6, line_spacing=1.05)
        text(s, 4.55, y + 0.48, 3.5, 0.50, [[("Thiếu  ", {"color": RED, "bold": True}), (miss, {"color": MUTED})]],
             size=9.6, line_spacing=1.05)

    rect(s, 8.45, 1.78, 4.25, 4.28, fill=FOREST, line=None, radius=0.09)
    text(s, 8.70, 1.98, 3.7, 0.28, "SYNCHUB NỐI CẢ BA", size=9.2, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 8.68, 2.28, 3.8, 0.66, "Một phòng giữ\ntoàn bộ cam kết.", size=19, color=WHITE, bold=True, line_spacing=1.02)
    checks = [
        ("Giữ slot nguyên tử", "10 phút, một người thắng"),
        ("Một giỏ cho cả nhóm", "Socket.io, khóa giỏ BR-INT-04"),
        ("Một hóa đơn mỗi người", "Largest Remainder + khấu trừ cọc"),
        ("Một sổ cái escrow", "HOLD → RELEASE / FROZEN / REFUND"),
    ]
    for i, (a, b) in enumerate(checks):
        yy = 3.18 + i * 0.66
        rect(s, 8.70, yy + 0.04, 0.20, 0.20, fill=EMERALD, line=None, radius=0.5)
        text(s, 9.00, yy, 3.45, 0.26, a, size=10.6, color=WHITE, bold=True)
        text(s, 9.00, yy + 0.26, 3.45, 0.24, b, size=8.8, color=RGBColor(0xCF, 0xEC, 0xDF))

    text(s, 0.62, 6.22, 12.05, 0.52,
         [[("Đơn vị quản lý không phải “đơn hàng” hay “slot”, mà là ", {"color": MUTED}),
           ("phòng ghép kèo gắn với một slot", {"color": FOREST, "bold": True}),
           (" — từ đó mới lần được thành viên, giỏ món, hóa đơn và dòng tiền.", {"color": MUTED})]],
         size=11.4, line_spacing=1.1)

    footer(s, 4)
    notes(s, "Nhắn tin giải quyết giao tiếp nhưng không giữ chỗ. App đặt sân giữ chỗ nhưng dừng ở đó. App giao đồ ăn gom đơn nhưng không gắn với giờ chơi và cọc. Khoảng trống là một thực thể nối cả ba. Trong báo cáo, nhóm gọi đó là phòng ghép kèo gắn với slot — và đây là đơn vị trung tâm của toàn bộ mô hình dữ liệu. (1:00)")
    return s
