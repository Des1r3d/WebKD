from deck_lib import *


def s04(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "01 · TÁC NHÂN", "Sáu tác nhân, bốn nhóm quyền",
           "Mỗi tác nhân có mục tiêu riêng, nhưng cùng một nguồn dữ liệu và ba lớp kiểm soát.")

    actors = [
        ("KHÁCH", "Tìm giá, vị trí và khung giờ.", "Đăng nhập trước khi giữ chỗ.", "UC-01 · UC-02"),
        ("HOST", "Mời nhóm và chốt chi phí.", "host_id + trạng thái phòng.", "UC-04 · UC-08 · UC-13"),
        ("THÀNH VIÊN", "Tham gia, chọn món, theo dõi bill.", "JWT + uy tín + quan hệ tham gia.", "UC-05 · UC-06 · UC-14"),
        ("ĐỐI TÁC VENUE", "Cập nhật slot, xác nhận hiện diện.", "Chủ địa điểm / quyền quản trị.", "UC-12"),
        ("ĐỐI TÁC F&B", "Quản lý món, theo dõi thống kê.", "Chủ sở hữu + provider_id.", "UC-12"),
        ("ADMIN", "Theo dõi vận hành và phân xử.", "Middleware ADMIN + audit log.", "UC-11 · UC-12"),
    ]
    for i, (name, goal, control, uc) in enumerate(actors):
        x = 0.62 + (i % 3) * 4.12
        y = 1.72 + (i // 3) * 1.72
        card(s, x, y, 3.85, 1.58, fill=WHITE, line=LINE, radius=0.06, shadow=False)
        text(s, x + 0.18, y + 0.10, 3.45, 0.24, name, size=10.2, color=EMERALD, bold=True)
        text(s, x + 0.18, y + 0.36, 3.48, 0.40, goal, size=9.2, color=INK, line_spacing=1.05)
        text(s, x + 0.18, y + 0.78, 3.48, 0.44,
             [[("Kiểm soát  ", {"bold": True, "color": EMERALD}), (control, {"color": MUTED})]],
             size=8.2, line_spacing=1.05)
        pill(s, x + 0.18, y + 1.26, 2.20, 0.24, uc, fill=MINT2, color=FOREST, size=7.0)

    card(s, 0.62, 5.24, 12.09, 0.70, fill=CREAM2, line=None, radius=0.05, shadow=False)
    text(s, 0.84, 5.34, 1.7, 0.24, "BA LỚP KIỂM SOÁT", size=7.8, color=GOLD, bold=True)
    layers = [("JWT", "danh tính"), ("ROLE", "quyền"), ("OWNERSHIP", "quan hệ")]
    for i, (a, b) in enumerate(layers):
        px = 2.55 + i * 3.30
        pill(s, px, 5.38, 1.02, 0.30, a, fill=FOREST, color=WHITE, size=7.4)
        text(s, px + 1.10, 5.42, 1.9, 0.22, b, size=7.6, color=MUTED)
    text(s, 0.84, 6.12, 11.8, 0.24,
         "Vai trò là theo ngữ cảnh: cùng một người có thể là Khách ở phòng này, Host ở phòng khác.",
         size=8.4, color=MUTED, italic=True)

    footer(s, 4)
    notes(s, "Sáu tác nhân nhưng chỉ bốn nhóm quyền: khách, host/member, provider và admin. Mỗi tác nhân có mục tiêu riêng, nhưng điểm chung là cùng nhìn vào một nguồn dữ liệu. Quyền được kiểm ở ba lớp: JWT cho danh tính, role cho loại thao tác, ownership cho quan hệ với phòng hoặc địa điểm. Vai trò còn theo ngữ cảnh: cùng một người có thể là host ở phòng này và member ở phòng khác. (0:55)")
    return s


def s05(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "01 · HIỆN TRẠNG", "Một buổi chơi, năm bước, ba nguồn sự thật",
           "Quy trình hiện tại không thiếu bước; nó thiếu một nơi giữ trạng thái chung.")

    steps = [
        ("01", "Chat nhóm", "Messenger / Zalo", "Không khóa slot"),
        ("02", "Gọi giữ sân", "Điện thoại / chủ sân", "Không ai giữ chỗ"),
        ("03", "Sheet gom món", "Google Sheets", "Nhiều phiên bản"),
        ("04", "Chuyển khoản", "Banking app", "Không đối soát"),
        ("05", "Đối soát", "Excel / trí nhớ", "Không bằng chứng"),
    ]
    for i, (num, title, tool, pain) in enumerate(steps):
        x = 0.62 + i * 2.40
        card(s, x, 1.72, 2.25, 1.95, fill=WHITE, line=LINE, radius=0.06, shadow=False)
        badge(s, x + 0.16, 1.86, 0.36, num, fill=RED, size=8.5)
        text(s, x + 0.16, 2.30, 1.95, 0.28, title, size=12.0, color=INK, bold=True)
        text(s, x + 0.16, 2.62, 1.95, 0.24, tool, size=7.8, color=MUTED, italic=True)
        line(s, x + 0.16, 2.92, x + 2.09, 2.92, color=LINE, width=1.0)
        text(s, x + 0.16, 3.00, 1.95, 0.46, pain, size=9.0, color=RED, bold=True)
        if i < 4:
            arrow(s, x + 2.27, 2.55, w=0.12, h=0.18, color=GOLD)

    rect(s, 0.62, 3.90, 12.09, 1.55, fill=CREAM2, line=None, radius=0.06)
    text(s, 0.84, 4.02, 3.0, 0.22, "BA NGUỒN SỰ THẬT", size=8.0, color=GOLD, bold=True)
    sources = [
        ("LỊCH SÂN", "Ai giữ? Đến khi nào?", "Điện thoại · chủ sân"),
        ("TIỀN", "Ai trả? Trả bao nhiêu?", "Tài khoản cá nhân"),
        ("MÓN", "Phiên bản nào đúng?", "Chat + Google Sheets"),
    ]
    for i, (lab, question, sub) in enumerate(sources):
        x = 0.84 + i * 3.92
        card(s, x, 4.28, 3.76, 1.02, fill=WHITE, line=LINE, radius=0.05, shadow=False)
        text(s, x + 0.16, 4.36, 3.4, 0.22, lab, size=7.6, color=EMERALD, bold=True)
        text(s, x + 0.16, 4.58, 3.4, 0.28, question, size=10.4, color=FOREST, bold=True)
        text(s, x + 0.16, 4.86, 3.4, 0.22, sub, size=7.6, color=MUTED)

    card(s, 0.62, 5.62, 12.09, 0.72, fill=FOREST, line=None, radius=0.05, shadow=False)
    text(s, 0.86, 5.72, 11.5, 0.50,
         "Điểm đứt gãy nằm ở chỗ chuyển giao, không ở từng bước: 3–4 công cụ · 1 thủ quỹ · 0 bằng chứng.",
         size=10.6, color=WHITE, bold=True)
    text(s, 0.62, 6.52, 12.0, 0.24,
         "Mỗi lần chuyển giao là một lần mất trạng thái; không ai nhìn thấy cùng một sự thật.",
         size=8.4, color=MUTED, italic=True)

    footer(s, 5)
    notes(s, "AS-IS không thiếu bước, nó thiếu nơi giữ trạng thái. Năm bước nằm ở ba công cụ: chat để chốt, điện thoại để giữ sân, ngân hàng để trả tiền. Ba nguồn sự thật là lịch sân, tiền và món; không nguồn nào nhìn thấy nguồn còn lại. Điểm đứt gãy nằm ở chỗ chuyển giao, nên thêm một màn hình không giải quyết được. (1:00)")
    return s


def s06(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "01 · TƯƠNG LAI", "Từ ba nguồn sự thật đến một phòng",
           "Bốn thay đổi cốt lõi, mỗi thay đổi gắn với một quy tắc nghiệp vụ và một bằng chứng.")

    text(s, 0.84, 1.78, 1.5, 0.22, "KHÍA CẠNH", size=7.6, color=MUTED, bold=True)
    text(s, 2.35, 1.78, 2.8, 0.22, "AS-IS", size=7.6, color=RED, bold=True)
    text(s, 5.45, 1.78, 3.6, 0.22, "TO-BE", size=7.6, color=EMERALD, bold=True)
    text(s, 9.55, 1.78, 3.0, 0.22, "KIỂM SOÁT", size=7.6, color=MUTED, bold=True)

    rows = [
        ("Giữ chỗ", "Trao đổi lịch, không ai giữ slot.", "Slot LOCKED 10 phút; một người thắng.", "BR-SLT-01/02"),
        ("Gom món", "Tin nhắn nhiều phiên bản.", "Giỏ theo phòng và người đặt.", "BR-INT-04"),
        ("Đối chiếu", "Bảng tính hoặc giao dịch rời.", "Bill cá nhân + sổ cái escrow.", "BR-INT-02 / ESC-01"),
        ("Sự cố", "Thỏa thuận ngoài hệ thống.", "Bằng chứng, trạng thái, audit.", "BR-ESC-04 / DSP-01"),
    ]
    for i, (aspect, asis, tobe, br) in enumerate(rows):
        y = 2.12 + i * 0.90
        card(s, 0.62, y, 12.09, 0.80, fill=WHITE, line=LINE, radius=0.05, shadow=False)
        text(s, 0.84, y + 0.10, 1.4, 0.28, aspect, size=12.0, color=FOREST, bold=True)
        text(s, 2.35, y + 0.10, 2.9, 0.56, asis, size=9.2, color=RED, line_spacing=1.05)
        text(s, 5.45, y + 0.10, 3.8, 0.56, tobe, size=9.2, color=FOREST, bold=True, line_spacing=1.05)
        pill(s, 9.55, y + 0.22, 2.55, 0.28, br, fill=MINT2, color=EMERALD, size=7.4)

    card(s, 0.62, 5.82, 12.09, 0.68, fill=FOREST, line=None, radius=0.05, shadow=False)
    metrics = [("4 → 1", "công cụ"), ("3 → 0", "lần đối soát"), ("0 → 1", "sổ cái")]
    for i, (big, lab) in enumerate(metrics):
        x = 0.90 + i * 3.90
        text(s, x, 5.90, 1.4, 0.34, big, size=16, color=WHITE, bold=True)
        text(s, x + 1.30, 5.96, 2.2, 0.24, lab, size=8.4, color=RGBColor(0xCF, 0xEC, 0xDF))

    footer(s, 6)
    notes(s, "TO-BE không phải thêm một màn hình, mà đổi thực thể quản lý: phòng gắn với slot. Bốn thay đổi: giữ chỗ bằng cập nhật có điều kiện, gom món theo phòng và người đặt, đối chiếu bằng bill cá nhân và sổ cái, sự cố có bằng chứng và audit. Mỗi thay đổi đều có BR và test tương ứng. Kết quả là bốn công cụ thu về một phòng, ba lần đối soát về không, và một sổ cái thay cho trí nhớ. (1:00)")
    return s


def s07(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "02 · USE CASE", "14 use case, 4 phân hệ, 6 tác nhân",
           "Mỗi use case có tác nhân, tiền điều kiện, kết quả và ngoại lệ — không chỉ một màn hình.")

    modules = [
        ("KHÁM PHÁ & GIỮ CHỖ", "3 UC", [
            ("UC-01", "Tài khoản & phân quyền", "Khách"),
            ("UC-02", "Khám phá địa điểm", "Khách"),
            ("UC-03", "Giữ / giải phóng slot", "Host · Member"),
        ]),
        ("PHÒNG & GIỎ", "5 UC", [
            ("UC-04", "Mở phòng từ slot", "Host"),
            ("UC-05", "Tham gia / rời phòng", "Member"),
            ("UC-06", "Giỏ hàng & khóa phòng", "Member · Host"),
            ("UC-07", "Gợi ý & voucher", "Member"),
            ("UC-14", "Trao đổi trong phòng", "Member"),
        ]),
        ("CHIA TIỀN & THANH TOÁN", "3 UC", [
            ("UC-08", "Chia hóa đơn", "Host"),
            ("UC-09", "Thanh toán mô phỏng", "User"),
            ("UC-10", "Check-in & quyết toán", "User"),
        ]),
        ("NGOẠI LỆ & QUẢN TRỊ", "3 UC", [
            ("UC-11", "Khiếu nại & quyết định", "Member · Admin"),
            ("UC-12", "Portal đối tác & quản trị", "Provider · Admin"),
            ("UC-13", "Hủy phòng có lịch sử", "Host"),
        ]),
    ]
    for i, (title, count, rows) in enumerate(modules):
        x = 0.62 + (i % 2) * 6.10
        y = 1.72 + (i // 2) * 2.28
        card(s, x, y, 5.99, 2.15, fill=WHITE, line=LINE, radius=0.06, shadow=False)
        text(s, x + 0.20, y + 0.12, 4.5, 0.26, title, size=10.2, color=EMERALD, bold=True)
        pill(s, x + 5.05, y + 0.12, 0.74, 0.24, count, fill=FOREST, color=WHITE, size=7.2)
        for j, (code, name, actor) in enumerate(rows):
            yy = y + 0.50 + j * 0.30
            text(s, x + 0.20, yy, 0.62, 0.24, code, size=7.4, color=EMERALD, bold=True)
            text(s, x + 0.86, yy, 3.1, 0.24, name, size=8.6, color=INK, bold=True)
            text(s, x + 4.02, yy, 1.75, 0.24, actor, size=7.2, color=MUTED)
        if len(rows) <= 3:
            text(s, x + 0.20, y + 1.78, 5.5, 0.22,
                 "Mỗi UC: tiền điều kiện → kết quả → ngoại lệ",
                 size=7.2, color=MUTED, italic=True)

    card(s, 0.62, 6.28, 12.09, 0.50, fill=CREAM2, line=None, radius=0.04, shadow=False)
    text(s, 0.82, 6.38, 11.7, 0.28,
         "14/14 UC có test · 6 tác nhân · 4 phân hệ · mỗi UC có một luồng chính và tối thiểu một ngoại lệ.",
         size=8.6, color=FOREST, bold=True)

    footer(s, 7)
    notes(s, "14 use case chia bốn phân hệ. Mỗi use case có tác nhân, tiền điều kiện, kết quả và ngoại lệ; đây là phần phân tích, không phải danh sách màn hình. Nhóm nhấn mạnh ba use case khó nhất: giữ slot, chia hóa đơn và check-in giải ngân, vì chúng quyết định tính đúng của toàn bộ luồng. (1:05)")
    return s


def s08(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "02 · QUY TẮC", "21 quy tắc nghiệp vụ, 6 nhóm",
           "BR là hợp đồng giữa phân tích và code: mỗi quy tắc có điều kiện, ngoại lệ và test.")

    groups = [
        ("ACC · DSC", "2", ["BR-ACC-01  JWT & phiên", "BR-DSC-01  Lọc theo loại, bán kính"], "Ngoại lệ: 401 · trạng thái rỗng"),
        ("SLT", "2", ["BR-SLT-01  Giữ slot 10 phút", "BR-SLT-02  Một cập nhật thắng"], "Ngoại lệ: 409 SLOT_TAKEN"),
        ("INT", "4", ["BR-INT-01  Phòng OPEN", "BR-INT-02  Tổng gross", "BR-INT-04  Khóa giỏ", "BR-INT-05  Voucher CROSS"], ""),
        ("ESC · DSP", "5", ["BR-ESC-01  Một HOLD / bill", "BR-ESC-02/03  Release theo check-in", "BR-ESC-04  Đóng băng khiếu nại", "BR-DSP-01  Quyết định + audit"], ""),
        ("REP · LBY", "5", ["BR-REP-01/02/03  Hạng uy tín", "BR-LBY-01  Cọc theo hạng", "BR-LBY-02  Hủy phòng + hoàn HELD"], "Ngoại lệ: FLAGGED · rời trễ"),
        ("PRV · ADM · RT", "3", ["BR-PRV-01  Quyền đối tác", "BR-ADM-01  Quyền admin", "BR-RT-01  Chat 50 tin / phòng"], "Ngoại lệ: 403 · mất lịch sử chat"),
    ]
    for i, (title, count, rules, exception) in enumerate(groups):
        x = 0.62 + (i % 3) * 4.12
        y = 1.72 + (i // 3) * 1.92
        card(s, x, y, 3.85, 1.75, fill=WHITE, line=LINE, radius=0.06, shadow=False)
        text(s, x + 0.18, y + 0.12, 2.9, 0.24, title, size=9.2, color=EMERALD, bold=True)
        pill(s, x + 3.05, y + 0.12, 0.62, 0.22, count, fill=FOREST, color=WHITE, size=6.8)
        for j, rule in enumerate(rules):
            yy = y + 0.46 + j * 0.29
            text(s, x + 0.18, yy, 3.5, 0.26, rule, size=7.8, color=INK, line_spacing=1.0)
        if exception:
            text(s, x + 0.18, y + 1.40, 3.5, 0.22, exception, size=7.0, color=RED, italic=True)

    card(s, 0.62, 5.62, 12.09, 0.70, fill=FOREST, line=None, radius=0.05, shadow=False)
    text(s, 0.86, 5.72, 11.5, 0.50,
         "21 BR · 14 FR · 82 test — mỗi quy tắc có ngoại lệ và bằng chứng. Ngoại lệ khó nhất: 409, rollback, hoàn một phần.",
         size=9.8, color=WHITE, bold=True)
    text(s, 0.62, 6.52, 12.0, 0.24,
         "Quy tắc viết trước, code sau; test khóa hành vi thay vì chỉ kiểm tra màn hình.",
         size=8.4, color=MUTED, italic=True)

    footer(s, 8)
    notes(s, "21 quy tắc nghiệp vụ chia sáu nhóm. BR không phải mô tả màn hình; nó là điều kiện và ngoại lệ. Ví dụ SLT-01/02 khóa slot 10 phút và chỉ một cập nhật thắng; ESC-01 một bill chỉ một HOLD; DSP-01 đóng băng phần đối tác khi có khiếu nại. Mỗi quy tắc đều có test tương ứng, nên khi sửa code có thể biết ngay hành vi nào bị ảnh hưởng. (1:05)")
    return s


def s09(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "02 · YÊU CẦU", "Từ yêu cầu đến bằng chứng, không có khoảng trống",
           "14 FR, 6 NFR, 21 BR và 14 UC được nối bằng một ma trận truy vết.", title_size=27)

    counts = [
        ("14", "use case"),
        ("14", "yêu cầu chức năng"),
        ("21", "quy tắc nghiệp vụ"),
        ("6", "yêu cầu phi chức năng"),
    ]
    for i, (big, label) in enumerate(counts):
        x = 0.62 + (i % 2) * 1.78
        y = 1.72 + (i // 2) * 1.18
        card(s, x, y, 1.64, 1.02, fill=WHITE, line=LINE, radius=0.05, shadow=False)
        text(s, x + 0.14, y + 0.10, 1.3, 0.42, big, size=24, color=FOREST, bold=True)
        text(s, x + 0.14, y + 0.58, 1.35, 0.34, label, size=7.4, color=MUTED, line_spacing=1.0)

    card(s, 0.62, 4.12, 3.42, 0.62, fill=FOREST, line=None, radius=0.05, shadow=False)
    text(s, 0.80, 4.22, 3.1, 0.42, "82/82 test · 20 suite · 9 tệp", size=8.6, color=WHITE, bold=True)
    text(s, 0.62, 4.84, 3.42, 0.62,
         "4/6 NFR đã kiểm chứng; NFR-05 P95 và NFR-06 accessibility chưa đo.",
         size=7.4, color=MUTED, line_spacing=1.1)
    text(s, 0.62, 5.58, 3.42, 0.42,
         "Ma trận đầy đủ: docs/Bao_cao_SyncHub/Ma_tran_truy_vet.csv",
         size=7.0, color=MUTED, italic=True)

    card(s, 4.22, 1.72, 8.49, 4.10, fill=WHITE, line=LINE, radius=0.05, shadow=False)
    heads = [("UC", 4.42, 0.75), ("FR", 5.25, 0.80), ("BR", 6.10, 1.55),
             ("CODE", 7.75, 1.80), ("TEST", 9.65, 2.85)]
    for lab, x, w in heads:
        text(s, x, 1.86, w, 0.22, lab, size=7.4, color=EMERALD, bold=True)
    line(s, 4.42, 2.12, 12.50, 2.12, color=LINE, width=1.0)

    rows = [
        ("UC-03", "FR-03", "SLT-01/02", "slotLock.js", "bookslot"),
        ("UC-06", "FR-06", "INT-01/04", "lobby.js", "grouporder"),
        ("UC-08", "FR-08", "INT-02", "splitBill.js", "split-bill"),
        ("UC-10", "FR-10", "ESC-02/03", "escrow.js", "escrow"),
        ("UC-11", "FR-11", "ESC-04/DSP-01", "dispute.js", "dispute-admin"),
        ("UC-13", "FR-13", "LBY-02", "lobby.js", "lobby-cancel"),
    ]
    for i, (uc, fr, br, code, test) in enumerate(rows):
        y = 2.22 + i * 0.54
        text(s, 4.42, y, 0.75, 0.24, uc, size=7.8, color=FOREST, bold=True)
        text(s, 5.25, y, 0.80, 0.24, fr, size=7.8, color=FOREST, bold=True)
        text(s, 6.10, y, 1.55, 0.24, br, size=7.6, color=MUTED)
        text(s, 7.75, y, 1.80, 0.24, code, size=7.2, color=FOREST, font=MONO)
        text(s, 9.65, y, 2.85, 0.24, test, size=7.2, color=MUTED, font=MONO)
        if i < 5:
            line(s, 4.42, y + 0.44, 12.50, y + 0.44, color=LINE, width=0.8)

    card(s, 0.62, 5.98, 12.09, 0.66, fill=CREAM2, line=None, radius=0.04, shadow=False)
    text(s, 0.82, 6.08, 11.7, 0.40,
         "14/14 UC có test · 0 FR chưa ánh xạ · 2 NFR chưa đo (P95, accessibility).",
         size=9.0, color=FOREST, bold=True)
    text(s, 0.62, 6.76, 12.0, 0.22,
         "Truy vết giúp trả lời câu hỏi: yêu cầu này được hiện thực ở đâu và chứng minh bằng ca nào?",
         size=7.8, color=MUTED, italic=True)

    footer(s, 9)
    notes(s, "Ma trận truy vết nối UC với FR, BR, file code và test. Sáu dòng tiêu biểu: giữ slot, giỏ hàng, chia bill, escrow, khiếu nại và hủy phòng. 14/14 UC có test; 0 FR chưa ánh xạ; 4/6 NFR đã kiểm chứng, còn P95 và accessibility chưa đo. Đây là bằng chứng BA mạnh nhất: không có yêu cầu nào bị bỏ rơi giữa tài liệu và code. (1:00)")
    return s
