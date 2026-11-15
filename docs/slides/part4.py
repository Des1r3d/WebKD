from deck_lib import *


def s14(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "04 · KINH DOANH", "Doanh thu trên mỗi giao dịch, không phải quảng cáo",
           "Nền tảng chỉ thu khi một buổi chơi thực sự diễn ra và dòng tiền được giải ngân.")

    card(s, 0.62, 1.78, 3.55, 1.62, fill=MINT2, line=None, radius=0.07, shadow=False)
    text(s, 0.84, 1.92, 3.0, 0.24, "VENUE · 8%", size=8.6, color=EMERALD, bold=True)
    text(s, 0.82, 2.20, 3.1, 0.52, "9.600đ", size=30, color=FOREST, bold=True, line_spacing=0.95)
    text(s, 0.84, 2.76, 3.1, 0.50, "trên hóa đơn sân 120.000đ", size=8.8, color=MUTED)

    card(s, 4.34, 1.78, 3.55, 1.62, fill=GOLD2, line=None, radius=0.07, shadow=False)
    text(s, 4.56, 1.92, 3.0, 0.24, "F&B · 12%", size=8.6, color=GOLD, bold=True)
    text(s, 4.54, 2.20, 3.1, 0.52, "11.400đ", size=30, color=FOREST, bold=True, line_spacing=0.95)
    text(s, 4.56, 2.76, 3.1, 0.50, "trên hóa đơn quán 95.000đ", size=8.8, color=MUTED)

    # flow
    card(s, 0.62, 3.66, 7.27, 1.28, fill=WHITE, line=LINE, radius=0.06, shadow=False)
    text(s, 0.84, 3.78, 1.9, 0.24, "KHÁCH TRẢ", size=7.6, color=MUTED, bold=True)
    text(s, 0.82, 4.02, 2.0, 0.40, "215.000đ", size=21, color=FOREST, bold=True)
    arrow(s, 2.80, 4.14, w=0.28, h=0.24, color=EMERALD)
    text(s, 3.18, 3.78, 2.0, 0.24, "ĐỐI TÁC NHẬN", size=7.6, color=MUTED, bold=True)
    text(s, 3.16, 4.02, 2.2, 0.40, "194.000đ", size=21, color=FOREST, bold=True)
    arrow(s, 5.24, 4.14, w=0.28, h=0.24, color=EMERALD)
    text(s, 5.62, 3.78, 2.0, 0.24, "NỀN TẢNG", size=7.6, color=MUTED, bold=True)
    text(s, 5.60, 4.02, 2.1, 0.40, "21.000đ", size=21, color=EMERALD, bold=True)

    # take rate
    card(s, 8.10, 1.78, 4.61, 3.16, fill=FOREST, line=None, radius=0.08, shadow=False)
    text(s, 8.34, 1.94, 4.0, 0.24, "TAKE RATE TRÊN MỘT BUỔI", size=8.0, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 8.30, 2.20, 4.0, 0.78, "9,8%", size=44, color=WHITE, bold=True, line_spacing=0.9)
    text(s, 8.34, 3.00, 4.0, 0.28, "21.000đ / 215.000đ", size=10.4, color=RGBColor(0xCF, 0xEC, 0xDF))
    line(s, 8.34, 3.38, 12.48, 3.38, color=FOREST2, width=1.0)
    text(s, 8.34, 3.52, 4.0, 0.26, "Doanh thu lặp lại theo mỗi buổi", size=9.6, color=WHITE, bold=True)
    text(s, 8.34, 3.82, 4.0, 0.80, "Không phụ thuộc quảng cáo; phí chỉ ghi nhận khi escrow giải ngân thành công.",
         size=8.6, color=RGBColor(0xCF, 0xEC, 0xDF), line_spacing=1.08)

    card(s, 0.62, 5.14, 7.27, 1.36, fill=CREAM2, line=None, radius=0.06, shadow=False)
    text(s, 0.84, 5.26, 6.8, 0.24, "HAI DÒNG DOANH THU MỞ RỘNG (ROADMAP)", size=7.8, color=GOLD, bold=True)
    text(s, 0.84, 5.52, 3.3, 0.24, "SaaS cho đối tác", size=9.2, color=FOREST, bold=True)
    text(s, 0.84, 5.76, 3.3, 0.24, "Quản lý lịch, menu, báo cáo", size=8.2, color=MUTED)
    text(s, 4.16, 5.52, 3.5, 0.24, "Vị trí trong gợi ý", size=9.2, color=FOREST, bold=True)
    text(s, 4.16, 5.76, 3.5, 0.24, "Minh bạch, gắn nhãn tài trợ", size=8.2, color=MUTED)
    text(s, 0.84, 6.06, 6.7, 0.24,
         "Cả hai đều là doanh thu lặp lại, không phụ thuộc ngân sách quảng cáo.",
         size=7.8, color=MUTED, italic=True)

    text(s, 0.62, 6.62, 12.05, 0.26,
         "Lưu ý: 8% và 12% là tỷ lệ giả định trong seed; mô hình dữ liệu lưu commission_rate riêng theo từng đối tác.",
         size=8.0, color=MUTED, italic=True)

    footer(s, 14)
    notes(s, "Mô hình doanh thu là một tỷ lệ trên phần của từng nhà cung cấp khi quyết toán. Với ca 215.000, sân 120.000 chịu 8% là 9.600, quán 95.000 chịu 12% là 11.400, tổng 21.000, tương đương 9,8% GMV. Đối tác nhận 194.000. Điểm cần nói rõ: đây là giả định trong seed, chưa phải bảng giá thương mại; muốn đánh giá doanh thu thật cần thêm tỷ lệ hủy, hoàn và chi phí hỗ trợ. (0:50)")
    return s


def s15(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "04 · KIỂM THỬ", "82/82 ca đạt — bằng chứng cho các luồng khó",
           "Node test runner + Supertest trên PostgreSQL 16; chạy tuần tự để kiểm tra cạnh tranh và rollback.")

    card(s, 0.62, 1.76, 4.10, 2.60, fill=FOREST, line=None, radius=0.08, shadow=False)
    text(s, 0.90, 1.92, 3.6, 0.24, "KẾT QUẢ LẦN CHẠY 14/11/2026", size=7.8, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 0.86, 2.14, 3.7, 0.95, "82/82", size=58, color=WHITE, bold=True, line_spacing=0.9)
    text(s, 0.90, 3.06, 3.6, 0.30, "ca đạt · 0 fail · 0 skip", size=10.6, color=RGBColor(0xCF, 0xEC, 0xDF), bold=True)
    line(s, 0.90, 3.48, 4.44, 3.48, color=FOREST2, width=1.0)
    text(s, 0.90, 3.60, 3.6, 0.28, "20 suite · 9 tệp · 5 migration", size=9.0, color=WHITE, bold=True)
    text(s, 0.90, 3.88, 3.6, 0.26, "auth · bookslot · grouporder · split-bill · escrow", size=7.4, color=RGBColor(0xCF, 0xEC, 0xDF))
    text(s, 0.90, 4.10, 3.6, 0.26, "lobby-cancel · dispute-admin · chat-history · seed-data", size=7.4, color=RGBColor(0xCF, 0xEC, 0xDF))

    evidence = [
        ("20 → 1", "bookslot", "20 request giữ cùng slot: đúng 1 thành công, 19 nhận 409."),
        ("1 HOLD / bill", "escrow", "Webhook lặp trả kết quả cũ; release lặp bị chặn bằng 409."),
        ("Rollback", "lobby-cancel", "Audit hủy thất bại → hoàn nguyên toàn bộ giao dịch."),
        ("50 tin / phòng", "chat-history", "Tách lịch sử theo phòng, phát lại đúng thứ tự, giới hạn 50."),
    ]
    for i, (big, tag, desc) in enumerate(evidence):
        x = 5.02 + (i % 2) * 3.86
        y = 1.76 + (i // 2) * 1.42
        card(s, x, y, 3.66, 1.26, fill=WHITE, line=LINE, radius=0.06, shadow=False)
        text(s, x + 0.18, y + 0.12, 2.4, 0.36, big, size=17, color=FOREST, bold=True)
        pill(s, x + 2.42, y + 0.16, 1.02, 0.24, tag, fill=MINT2, color=EMERALD, size=6.6)
        text(s, x + 0.18, y + 0.54, 3.3, 0.62, desc, size=8.2, color=MUTED, line_spacing=1.08)

    card(s, 0.62, 4.62, 4.10, 1.62, fill=WHITE, line=LINE, radius=0.06, shadow=False)
    text(s, 0.82, 4.74, 3.7, 0.24, "CÁCH CHẠY", size=7.8, color=EMERALD, bold=True)
    text(s, 0.82, 4.98, 3.75, 0.90,
         "npm --prefix server test\nTEST_DATABASE_URL trỏ database riêng\nFixture reset dữ liệu trước mỗi nhóm",
         size=8.0, color=FOREST, font=MONO, line_spacing=1.20)
    text(s, 0.82, 5.80, 3.75, 0.26, "Mỗi ca in thời lượng; log giữ tên ca và kết quả.", size=7.4, color=MUTED)

    card(s, 5.02, 4.62, 7.70, 1.62, fill=WHITE, line=LINE, radius=0.06, shadow=False)
    text(s, 5.22, 4.74, 7.2, 0.24, "PHẠM VI KIỂM THỬ", size=7.8, color=EMERALD, bold=True)
    groups = ["auth", "bookslot", "grouporder", "split-bill", "escrow",
              "lobby-cancel", "dispute-admin", "chat-history", "seed-data"]
    for i, g in enumerate(groups):
        px = 5.22 + (i % 3) * 2.42
        py = 5.02 + (i // 3) * 0.32
        pill(s, px, py, 2.30, 0.26, g, fill=MINT2, color=FOREST, size=7.0)
    text(s, 5.22, 5.98, 7.2, 0.22,
         "5 migration · fixture reset trước mỗi nhóm · chạy tuần tự",
         size=7.4, color=MUTED)

    card(s, 0.62, 6.42, 12.09, 0.44, fill=CREAM2, line=None, radius=0.04, shadow=False)
    text(s, 0.80, 6.52, 11.8, 0.24,
         "Điểm mạnh của bộ test: kiểm tra trạng thái cuối cùng sau các yêu cầu chồng lấn, không chỉ một HTTP 200 đơn lẻ.",
         size=8.6, color=FOREST, bold=True)

    footer(s, 15)
    notes(s, "Con số 82/82 là lần chạy trên database test riêng, không phải database demo. Điểm nhấn là bốn ca khó: 20 yêu cầu giữ cùng slot chỉ một thành công; một bill chỉ một HOLD và release lặp bị chặn; hủy phòng rollback nếu audit lỗi; chat tách phòng và giới hạn 50. Bộ test chạy tuần tự để các ca cạnh tranh không nhiễu nhau. (1:00)")
    return s


def s16(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "05 · HẠN CHẾ", "Biết giới hạn để không hứa quá",
           "Đây là những điểm nhóm đã ghi rõ trong chương 5 của báo cáo, không phải phần bị bỏ sót.")

    card(s, 0.62, 1.74, 5.86, 3.46, fill=WHITE, line=LINE, radius=0.07)
    text(s, 0.86, 1.88, 5.3, 0.26, "HIỆN TẠI", size=8.6, color=RED, bold=True)
    limits = [
        "Webhook thanh toán mô phỏng; chưa xác thực chữ ký ngân hàng.",
        "Một số route chưa ràng buộc quyền sở hữu đủ chặt ở tầng API.",
        "Đăng ký công khai nhận role từ body, kể cả ADMIN.",
        "Slot hủy giữ lịch sử nên chưa thể đặt lại cùng slot.",
        "Chưa đo P95, chưa thử mất mạng và khả năng tiếp cận.",
    ]
    for i, ln in enumerate(limits):
        y = 2.22 + i * 0.56
        rect(s, 0.88, y + 0.08, 0.14, 0.14, fill=RED, line=None, radius=0.5)
        text(s, 1.12, y, 5.15, 0.48, ln, size=9.0, color=INK, line_spacing=1.08)

    card(s, 6.82, 1.74, 5.89, 3.46, fill=FOREST, line=None, radius=0.07, shadow=False)
    text(s, 7.06, 1.88, 5.3, 0.26, "TIẾP THEO", size=8.6, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    nexts = [
        "Cổng thanh toán thật + xác thực webhook + đối soát.",
        "Hardening RBAC; tách luồng cấp role đặc quyền.",
        "Tách lịch sử đặt khỏi slot để tái sử dụng.",
        "Load test P95, PWA/offline, onboarding đối tác.",
    ]
    for i, ln in enumerate(nexts):
        y = 2.22 + i * 0.62
        rect(s, 7.08, y + 0.08, 0.14, 0.14, fill=EMERALD, line=None, radius=0.5)
        text(s, 7.32, y, 5.15, 0.52, ln, size=9.4, color=WHITE, line_spacing=1.08)

    # roadmap
    phases = [("Q1/2027", "Thanh toán thật", "Signature, đối soát, hoàn tự động"),
              ("Q2/2027", "Hardening & tải", "RBAC, P95, mất mạng, tiếp cận"),
              ("Q3/2027", "Mở rộng địa bàn", "Thêm đối tác, PWA, vận hành")]
    for i, (q, title, desc) in enumerate(phases):
        x = 0.62 + i * 4.10
        card(s, x, 5.48, 3.86, 1.06, fill=CREAM2, line=None, radius=0.06, shadow=False)
        text(s, x + 0.18, 5.58, 1.2, 0.22, q, size=7.8, color=GOLD, bold=True)
        text(s, x + 0.18, 5.80, 3.5, 0.28, title, size=11.6, color=FOREST, bold=True)
        text(s, x + 0.18, 6.08, 3.5, 0.30, desc, size=8.2, color=MUTED)
        if i < 2:
            arrow(s, x + 3.92, 5.90, w=0.14, h=0.18, color=EMERALD)

    footer(s, 16)
    notes(s, "Nhóm chủ động nêu giới hạn. Thanh toán mới là mô phỏng; quyền sở hữu chưa được kiểm tra đủ ở API; đăng ký công khai đang nhận role từ body; slot hủy chưa tái sử dụng được; chưa có load test. Lộ trình ưu tiên thanh toán thật và hardening trước khi mở rộng địa bàn. Nói rõ những điểm này giúp phần bảo vệ đáng tin hơn là che đi. (0:45)")
    return s


def s17(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    rect(s, 0, 0, W, H, fill=FOREST, line=None)
    rect(s, 10.55, 0.55, 2.2, 2.2, fill=FOREST2, line=None, radius=0.5)

    text(s, 0.82, 0.72, 8.4, 0.26, "06 · KẾT LUẬN", size=10.0, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 0.78, 1.02, 9.0, 1.65,
         [[("Một phòng.", {"color": WHITE})],
          [("Không lệch đồng nào.", {"color": WHITE})],
          [("Một sổ cái.", {"color": RGBColor(0x9F, 0xD9, 0xC4)})]],
         size=38, bold=True, line_spacing=0.98)

    items = [
        ("Một phòng", "Slot, thành viên, giỏ món, hóa đơn cùng một mã."),
        ("0 đồng lệch", "Largest Remainder + cọc, kiểm chứng 215.000đ."),
        ("Một sổ cái", "HOLD → RELEASE/FROZEN/REFUND, có audit."),
    ]
    for i, (big, small) in enumerate(items):
        y = 3.48 + i * 0.86
        text(s, 0.82, y, 2.3, 0.30, big, size=13.4, color=WHITE, bold=True)
        text(s, 3.12, y + 0.04, 5.9, 0.28, small, size=9.6, color=RGBColor(0xCF, 0xEC, 0xDF))

    text(s, 0.82, 6.02, 7.4, 0.34, "Cảm ơn thầy/cô và các bạn.", size=16, color=WHITE, bold=True)
    text(s, 0.82, 6.40, 7.4, 0.26, "Q&A · Demo: SYNC01 · Password123!", size=10.0, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)

    card(s, 9.48, 1.20, 3.08, 4.30, fill=WHITE, line=None, radius=0.09, shadow=False)
    text(s, 9.68, 1.34, 2.7, 0.24, "DEMO ACCOUNTS", size=7.8, color=EMERALD, bold=True)
    accounts = [("Host", "nguyen.minh.phat@synchub.vn"), ("Provider", "thang.venue@synchub.vn"), ("Admin", "admin@synchub.vn")]
    for i, (role, mail) in enumerate(accounts):
        y = 1.64 + i * 0.72
        text(s, 9.68, y, 1.0, 0.22, role, size=8.0, color=MUTED, bold=True)
        text(s, 9.68, y + 0.22, 2.7, 0.24, mail, size=7.4, color=FOREST, bold=True)
    line(s, 9.68, 3.90, 12.32, 3.90, color=LINE, width=1.0)
    text(s, 9.68, 4.04, 2.7, 0.24, "MẬT KHẨU CHUNG", size=7.2, color=MUTED, bold=True)
    text(s, 9.68, 4.28, 2.7, 0.28, "Password123!", size=10.2, color=FOREST, bold=True, font=MONO)
    text(s, 9.68, 4.68, 2.7, 0.24, "82/82 test · 20 slide", size=7.8, color=EMERALD, bold=True)
    text(s, 9.68, 4.92, 2.7, 0.24, "Node 24 · PostgreSQL 16", size=7.2, color=MUTED)
    text(s, 9.68, 5.16, 2.7, 0.24, "Nguồn: docs/Bao_cao_SyncHub", size=6.8, color=MUTED)

    notes(s, "Tóm lại ba giá trị: một phòng thay cho bốn công cụ; chia tiền không lệch đồng nào; và một sổ cái escrow có thể giải thích từng khoản. Nhóm sẵn sàng trả lời câu hỏi và demo trực tiếp trên SYNC01. Cảm ơn thầy/cô và các bạn. (0:20)")
    return s
