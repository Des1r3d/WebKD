import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  Countdown,
  MemberAvatar,
  MoneyText,
  QRCard,
  CartRow,
  ChatBubble,
} from '../components';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Coffee,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const StyleguidePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartQty, setCartQty] = useState(2);
  const [isCartLocked, setIsCartLocked] = useState(false);

  return (
    <div className="min-h-screen bg-bg-app text-text-primary pb-20">
      {/* Top Header */}
      <header className="border-b border-border-default bg-bg-surface sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-text-inverted font-bold text-base shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-text-primary">SyncHub</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Design System v1.0
                </span>
              </div>
              <p className="text-[11px] text-text-secondary hidden sm:block">
                Hallmark: Emerald Pulse · Modern Minimal · Báo cáo Đồ án Ch.3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
            >
              Xem Modal Mẫu
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* Intro Hero Section */}
        <div className="bg-bg-surface border border-border-default rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl">
            <Badge variant="primary" size="sm" className="mb-3">
              WBS-2.0 · Hallmark Floor Compliant
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-3">
              SyncHub UI Components & Design Tokens
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Hệ thống giao diện chuẩn hóa cho đồ án SyncHub (BookSlot + GroupOrder + SplitBill + Escrow). 
              Tuân thủ 100% tokens-first, chuẩn tiếp cận (a11y), responsive 375/768/1280px, tối ưu thao tác di động ≤ 3 click.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-bg-subtle text-text-secondary border border-border-default">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                12 Bảng & 15 BR Locked
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-bg-subtle text-text-secondary border border-border-default">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                10 Core Components
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-bg-subtle text-text-secondary border border-border-default">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                BR-INT-02 Largest Remainder
              </span>
            </div>
          </div>
        </div>

        {/* 1. Color Palette & Semantic Tokens */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-2">
            <h2 className="text-lg font-bold text-text-primary">1. Bảng màu & Semantic Tokens</h2>
            <p className="text-xs text-text-secondary">Ánh xạ từ tokens.css và tailwind.config.js theo quy định nghiệp vụ</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-border-default bg-bg-surface">
              <div className="h-10 rounded-md bg-primary mb-2 shadow-xs" />
              <div className="text-xs font-semibold">Primary (Emerald)</div>
              <div className="text-[11px] text-text-muted font-mono">#059669 · Sân & Uy tín</div>
            </div>

            <div className="p-3 rounded-lg border border-border-default bg-bg-surface">
              <div className="h-10 rounded-md bg-accent mb-2 shadow-xs" />
              <div className="text-xs font-semibold">Accent (Amber)</div>
              <div className="text-[11px] text-text-muted font-mono">#D97706 · F&B & Giỏ hàng</div>
            </div>

            <div className="p-3 rounded-lg border border-border-default bg-bg-surface">
              <div className="h-10 rounded-md bg-bg-app border border-border-default mb-2 shadow-xs" />
              <div className="text-xs font-semibold">Background App</div>
              <div className="text-[11px] text-text-muted font-mono">#F8FAFC · Slate 50</div>
            </div>

            <div className="p-3 rounded-lg border border-border-default bg-bg-surface">
              <div className="h-10 rounded-md bg-text-primary mb-2 shadow-xs" />
              <div className="text-xs font-semibold">Text Primary</div>
              <div className="text-[11px] text-text-muted font-mono">#0F172A · Slate 900</div>
            </div>
          </div>

          {/* Business State Badges Demo */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-4 sm:p-5">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Màu trạng thái Slot, Phòng (`group_lobbies`) & Uy tín (`BR-REP-01`)
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="available">AVAILABLE (Trống)</Badge>
              <Badge variant="open">OPEN (Phòng mở)</Badge>
              <Badge variant="locked">LOCKED (Đã chốt)</Badge>
              <Badge variant="awaiting">AWAITING_PAYMENT</Badge>
              <Badge variant="paid">PAID (Escrow HELD)</Badge>
              <Badge variant="completed">COMPLETED (Check-in)</Badge>
              <Badge variant="cancelled">CANCELLED (Đã hủy)</Badge>
              <Badge variant="disputed">DISPUTED (Khiếu nại)</Badge>
              <Badge variant="rep-a">Hạng A (0% cọc)</Badge>
              <Badge variant="rep-b">Hạng B (30% cọc)</Badge>
              <Badge variant="rep-c">Hạng C (100% cọc)</Badge>
              <Badge variant="rep-flagged">FLAGGED (Chặn)</Badge>
            </div>
          </div>
        </section>

        {/* 2. Button Component Spec */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-2">
            <h2 className="text-lg font-bold text-text-primary">2. Button Components</h2>
            <p className="text-xs text-text-secondary">5 biến thể, 3 kích cỡ, hỗ trợ loading & icon</p>
          </div>

          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Hủy / Từ chối</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" isLoading>Đang xử lý</Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border-default">
              <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Cỡ nhỏ (sm)
              </Button>
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Cỡ vừa (md - Chuẩn)
              </Button>
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Cỡ lớn (lg - Mobile CTA)
              </Button>
            </div>
          </div>
        </section>

        {/* 3. MoneyText & Countdown (Lõi nghiệp vụ BookSlot & Escrow) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MoneyText */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">3. MoneyText (Kiểu số tiền VND)</h2>
              <p className="text-xs text-text-secondary">Font Tabular Figures, làm tròn chuẩn theo BR-INT-02</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-1 border-b border-border-default">
                <span className="text-xs text-text-secondary">Tiền sân chuẩn:</span>
                <MoneyText amount={120000} size="md" variant="default" />
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-default">
                <span className="text-xs text-text-secondary">Tổng bill phòng (Ca 215k):</span>
                <MoneyText amount={215000} size="lg" variant="primary" />
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-default">
                <span className="text-xs text-text-secondary">Giảm giá Voucher F&B:</span>
                <MoneyText amount={-5000} size="md" variant="discount" showSign />
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-text-secondary">Hoàn tiền Escrow (Khiếu nại):</span>
                <MoneyText amount={45000} size="md" variant="positive" showSign />
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">4. Countdown (Đồng hồ giữ slot)</h2>
              <p className="text-xs text-text-secondary">Tự động đổi màu cảnh báo theo BR-SLT-01 (10 phút giữ chỗ)</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-1.5 border-b border-border-default">
                <span className="text-xs text-text-secondary">Bình thường (&gt; 3 phút):</span>
                <Countdown initialSeconds={580} label="Hạn giữ" />
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border-default">
                <span className="text-xs text-text-secondary">Cảnh báo sắp hết (1–3 phút):</span>
                <Countdown initialSeconds={140} label="Sắp hết" />
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-text-secondary">Khẩn cấp (&lt; 1 phút, nhấp nháy):</span>
                <Countdown initialSeconds={45} label="Hết hạn" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. MemberAvatar & Phân hạng uy tín (BR-REP-01) */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-2">
            <h2 className="text-lg font-bold text-text-primary">5. MemberAvatar & Phân hạng Uy tín</h2>
            <p className="text-xs text-text-secondary">Kèm vương miện cho Host và huy hiệu Hạng uy tín theo BR-REP-01</p>
          </div>

          <div className="bg-bg-surface border border-border-default rounded-xl p-5 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <MemberAvatar name="Đào Tiến Đạt" isHost size="lg" />
              <div className="text-xs">
                <div className="font-semibold">Đào Tiến Đạt (Host)</div>
                <div className="text-text-muted">Chủ phòng</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MemberAvatar name="Nguyễn Văn A" reputationScore={95} size="md" />
              <div className="text-xs">
                <div className="font-semibold">Nguyễn Văn A</div>
                <div className="text-emerald-600 font-medium">Hạng A (95đ · 0% cọc)</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MemberAvatar name="Trần Thị B" reputationScore={75} size="md" />
              <div className="text-xs">
                <div className="font-semibold">Trần Thị B</div>
                <div className="text-amber-600 font-medium">Hạng B (75đ · Cọc 30%)</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MemberAvatar name="Lê Hoàng C" reputationScore={55} size="md" />
              <div className="text-xs">
                <div className="font-semibold">Lê Hoàng C</div>
                <div className="text-orange-600 font-medium">Hạng C (55đ · Cọc 100%)</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MemberAvatar name="Phạm Bị Cảnh Báo" reputationScore={40} size="md" />
              <div className="text-xs">
                <div className="font-semibold">Phạm Văn D</div>
                <div className="text-red-600 font-medium">FLAGGED (40đ · Chặn vào)</div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. CartRow & Giỏ hàng nhóm Realtime */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">6. CartRow (Giỏ hàng F&B nhóm)</h2>
              <p className="text-xs text-text-secondary">Hiển thị người gọi món, số lượng, tự động vô hiệu khi phòng LOCKED</p>
            </div>
            <Button
              size="sm"
              variant={isCartLocked ? 'primary' : 'outline'}
              onClick={() => setIsCartLocked(!isCartLocked)}
              leftIcon={<Lock className="w-3.5 h-3.5" />}
            >
              {isCartLocked ? 'Mở khóa giỏ' : 'Khóa giỏ (LOCKED)'}
            </Button>
          </div>

          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-3">
            <CartRow
              id="item-1"
              name="Trà sữa Trân châu Đường đen L"
              userName="Đào Tiến Đạt"
              price={30000}
              qty={cartQty}
              isLocked={isCartLocked}
              onIncrease={() => setCartQty((q) => q + 1)}
              onDecrease={() => setCartQty((q) => Math.max(1, q - 1))}
              onRemove={() => alert('Xóa món')}
            />

            <CartRow
              id="item-2"
              name="Cà phê Muối Đặc biệt"
              userName="Nguyễn Văn A"
              price={25000}
              qty={1}
              isLocked={isCartLocked}
              canModify={false}
            />
          </div>
        </section>

        {/* 6. ChatBubble & QRCard Showcase */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ChatBubble */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">7. ChatBubble (Phòng ghép Realtime)</h2>
              <p className="text-xs text-text-secondary">Phân loại tin tôi, tin đồng đội và tin hệ thống</p>
            </div>

            <div className="bg-bg-app border border-border-default rounded-lg p-3 space-y-1">
              <ChatBubble
                content="Đào Tiến Đạt đã mở phòng ghép sân Cầu lông Thủ Đức!"
                senderName="Hệ thống"
                isSystem
              />
              <ChatBubble
                content="Chào cả nhà, mình gọi thêm 2 ly trà sữa nhé!"
                senderName="Trần Thị B"
                isMine={false}
                timestamp={new Date()}
              />
              <ChatBubble
                content="Ok bạn, mình vừa khóa giỏ để chuẩn bị chia bill rồi nha."
                senderName="Đào Tiến Đạt"
                isMine={true}
                timestamp={new Date()}
              />
              <ChatBubble
                content="Host đã chốt phòng. Vui lòng thanh toán VietQR trong 10 phút."
                senderName="Hệ thống"
                isSystem
              />
            </div>
          </div>

          {/* QRCard */}
          <div className="bg-bg-surface border border-border-default rounded-xl p-5">
            <div className="mb-3">
              <h2 className="text-base font-bold text-text-primary">8. QRCard (VietQR & Mời phòng)</h2>
              <p className="text-xs text-text-secondary">Quét mã trả tiền chuẩn ngân hàng và sao chép nhanh</p>
            </div>

            <QRCard
              type="vietqr"
              qrUrl="https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=53750&addInfo=SYNCHUB%20LB01%20USR1&accountName=SYNCHUB%20DEMO"
              bankCode="MB"
              accountNumber="0123456789"
              accountName="SYNCHUB DEMO"
              amount={53750}
              transferContent="SYNCHUB LB01 USR1"
            />
          </div>
        </section>

        {/* 7. Card Layout & Composability */}
        <section className="space-y-4">
          <div className="border-b border-border-default pb-2">
            <h2 className="text-lg font-bold text-text-primary">9. Card Container & Phân cấp khối</h2>
            <p className="text-xs text-text-secondary">Cấu trúc Header, Content, Footer tinh gọn</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card interactive>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="available">AVAILABLE</Badge>
                  <span className="text-xs text-text-muted">Sân 1</span>
                </div>
                <CardTitle className="mt-1">Sân Cầu Lông ĐH Nông Lâm</CardTitle>
                <CardDescription>Cách bạn 450m · Mở cửa 06:00 - 22:00</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <MoneyText amount={60000} size="lg" variant="primary" />
                  <span className="text-xs text-text-secondary">/ 1 giờ</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="primary" className="w-full">
                  Đặt & Khóa slot 10'
                </Button>
              </CardFooter>
            </Card>

            <Card interactive>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="accent">F&B GỢI Ý</Badge>
                  <span className="text-xs text-emerald-600 font-medium">Mã CROSS -15%</span>
                </div>
                <CardTitle className="mt-1">Trà Sữa Nhà Ong Thủ Đức</CardTitle>
                <CardDescription>Cách sân 350m · Đang nhận đơn</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-text-secondary">
                  Gợi ý thông minh: Đặt kèm sân cầu lông được miễn phí ship 1km.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="outline" className="w-full" leftIcon={<Coffee className="w-3.5 h-3.5" />}>
                  Xem Thực đơn
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="paid">ESCROW HELD</Badge>
                  <span className="text-xs font-mono text-text-muted">#LB-8823</span>
                </div>
                <CardTitle className="mt-1">Phòng Ghép Cầu Lông #1</CardTitle>
                <CardDescription>4/4 Thành viên đã cọc</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tổng tiền giữ:</span>
                    <MoneyText amount={215000} size="sm" variant="default" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Trạng thái:</span>
                    <span className="text-emerald-600 font-medium">Sẵn sàng Check-in</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary" className="w-full">
                  Xem Chi tiết Bill
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      {/* 8. Interactive Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Xác nhận Khóa Slot & Mở Phòng"
        description="Slot sẽ được giữ tạm thời trong 10 phút theo luật BR-SLT-01"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                alert('Đã xác nhận khóa slot!');
                setIsModalOpen(false);
              }}
            >
              Tiến hành Giữ chỗ
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">
            Bạn đang yêu cầu khóa slot sân cầu lông từ <strong>18:00 đến 19:00</strong>. Sau khi giữ slot, bạn có thể mời bạn bè tham gia và gọi món chung qua giỏ hàng nhóm.
          </p>
          <div className="p-3 rounded-lg bg-bg-app border border-border-default space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Giá sân tạm tính:</span>
              <MoneyText amount={120000} size="sm" />
            </div>
            <div className="flex justify-between">
              <span>Thời gian giữ:</span>
              <span className="font-semibold text-amber-600">10 phút</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
