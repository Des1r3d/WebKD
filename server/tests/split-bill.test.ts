import { describe, it, expect } from 'vitest';
import { calculateSplitBills } from '../src/services/splitBill';

describe('BR-INT-02: Dịch vụ chia bill splitBill.ts (Largest Remainder)', () => {
  it('1. Chuẩn hóa ca kiểm thử 215.000 VND (4 người, món cá nhân, ship + voucher FNB)', () => {
    // Sân 120.000/4 người (A host, B, C, D); Món: A 25k, B 30k, C 0, D 45k; Ship 15k; Voucher FNB -20k
    const now = new Date();
    const result = calculateSplitBills({
      lobbyId: 'lob-test-01',
      inviteCode: 'SYNC01',
      slotPrice: 120000,
      venueOrCrossDiscount: 0,
      shipFee: 15000,
      fnbDiscount: 20000,
      members: [
        { userId: 'usr-a', isHost: true, joinedAt: new Date(now.getTime() - 4000), depositPaid: 0 },
        { userId: 'usr-b', isHost: false, joinedAt: new Date(now.getTime() - 3000), depositPaid: 0 },
        { userId: 'usr-c', isHost: false, joinedAt: new Date(now.getTime() - 2000), depositPaid: 0 },
        { userId: 'usr-d', isHost: false, joinedAt: new Date(now.getTime() - 1000), depositPaid: 0 },
      ],
      cartItems: [
        { userId: 'usr-a', qty: 1, unitPrice: 25000 },
        { userId: 'usr-b', qty: 1, unitPrice: 30000 },
        { userId: 'usr-d', qty: 1, unitPrice: 45000 },
      ],
    });

    expect(result.slotNet).toBe(120000);
    expect(result.totalFood).toBe(100000);
    expect(result.adj).toBe(-5000); // 15.000 - 20.000
    expect(result.grandTotal).toBe(215000);

    const billA = result.bills.find((b) => b.user_id === 'usr-a')!;
    const billB = result.bills.find((b) => b.user_id === 'usr-b')!;
    const billC = result.bills.find((b) => b.user_id === 'usr-c')!;
    const billD = result.bills.find((b) => b.user_id === 'usr-d')!;

    // A (Host): Sân 30.000 + Món 25.000 - 1.250 = 53.750 VND
    expect(billA.slot_share).toBe(30000);
    expect(billA.food_amount).toBe(25000);
    expect(billA.ship_share).toBe(3750);
    expect(billA.discount_share).toBe(5000);
    expect(billA.total).toBe(53750);

    // B: Sân 30.000 + Món 30.000 - 1.500 = 58.500 VND
    expect(billB.slot_share).toBe(30000);
    expect(billB.food_amount).toBe(30000);
    expect(billB.ship_share).toBe(4500);
    expect(billB.discount_share).toBe(6000);
    expect(billB.total).toBe(58500);

    // C: Sân 30.000 + Món 0 + Adj 0 = 30.000 VND
    expect(billC.slot_share).toBe(30000);
    expect(billC.food_amount).toBe(0);
    expect(billC.ship_share).toBe(0);
    expect(billC.discount_share).toBe(0);
    expect(billC.total).toBe(30000);

    // D: Sân 30.000 + Món 45.000 - 2.250 = 72.750 VND
    expect(billD.slot_share).toBe(30000);
    expect(billD.food_amount).toBe(45000);
    expect(billD.ship_share).toBe(6750);
    expect(billD.discount_share).toBe(9000);
    expect(billD.total).toBe(72750);

    // Bất biến: Tổng hóa đơn các cá nhân đúng bằng 215.000 VND
    const sum = result.bills.reduce((acc, b) => acc + b.total, 0);
    expect(sum).toBe(215000);
  });

  it('2. Ca biên: 1 thành viên duy nhất chịu 100% chi phí phòng', () => {
    const result = calculateSplitBills({
      lobbyId: 'lob-solo',
      inviteCode: 'SOLO01',
      slotPrice: 100000,
      venueOrCrossDiscount: 10000,
      shipFee: 15000,
      fnbDiscount: 5000,
      members: [
        { userId: 'usr-solo', isHost: true, joinedAt: new Date(), depositPaid: 0 },
      ],
      cartItems: [
        { userId: 'usr-solo', qty: 2, unitPrice: 20000 }, // 40k
      ],
    });

    // slotNet = 90k, food = 40k, adj = 15k - 5k = 10k -> grandTotal = 140k
    expect(result.grandTotal).toBe(140000);
    expect(result.bills.length).toBe(1);
    expect(result.bills[0].total).toBe(140000);
  });

  it('3. Ca biên: Không ai gọi đồ ăn (Sigma food = 0), chia đều và dồn số dư cho Host', () => {
    // Sân 100.000 VND / 3 người -> mỗi người 33.333 VND, dư 1 VND dồn cho Host (A)
    const now = new Date();
    const result = calculateSplitBills({
      lobbyId: 'lob-nofood',
      inviteCode: 'NOFOOD',
      slotPrice: 100000,
      venueOrCrossDiscount: 0,
      shipFee: 15000,
      fnbDiscount: 20000,
      members: [
        { userId: 'usr-a', isHost: true, joinedAt: new Date(now.getTime() - 3000), depositPaid: 0 },
        { userId: 'usr-b', isHost: false, joinedAt: new Date(now.getTime() - 2000), depositPaid: 0 },
        { userId: 'usr-c', isHost: false, joinedAt: new Date(now.getTime() - 1000), depositPaid: 0 },
      ],
      cartItems: [],
    });

    expect(result.totalFood).toBe(0);
    expect(result.adj).toBe(0); // Không gọi món thì không tính ship/voucher fnb
    expect(result.grandTotal).toBe(100000);

    const billA = result.bills.find((b) => b.user_id === 'usr-a')!;
    const billB = result.bills.find((b) => b.user_id === 'usr-b')!;
    const billC = result.bills.find((b) => b.user_id === 'usr-c')!;

    // Host A nhận phần dư +1 VND -> 33.334 VND
    expect(billA.total).toBe(33334);
    expect(billB.total).toBe(33333);
    expect(billC.total).toBe(33333);

    expect(billA.total + billB.total + billC.total).toBe(100000);
  });

  it('4. Phân phối phần dư Largest Remainder theo phân số lớn nhất (Hamilton Method)', () => {
    // 3 người, sân 100.000 / 3 người.
    // Món A: 10.000 (1/6 tổng món 60k)
    // Món B: 20.000 (2/6 tổng món 60k)
    // Món C: 30.000 (3/6 tổng món 60k)
    // Ship 10.000, Voucher 0 -> adj = +10.000
    // Sân mỗi người = 33333.333
    // Ship: A = 10000 * 1/6 = 1666.666; B = 3333.333; C = 5000
    // Raw A = 33333.333 + 10000 + 1666.666 = 45000.000 -> frac = 0
    // Raw B = 33333.333 + 20000 + 3333.333 = 56666.666 -> frac = 0.666
    // Raw C = 33333.333 + 30000 + 5000.000 = 68333.333 -> frac = 0.333
    // Floor A = 45000, B = 56666, C = 68333. Sum floor = 170000 - 1 = 169999.
    // GrandTotal = 100k + 60k + 10k = 170.000. Delta = 1.
    // B có frac lớn nhất (0.666) -> B nhận +1 VND!
    const now = new Date();
    const result = calculateSplitBills({
      lobbyId: 'lob-remainder',
      inviteCode: 'REMAIND',
      slotPrice: 100000,
      venueOrCrossDiscount: 0,
      shipFee: 10000,
      fnbDiscount: 0,
      members: [
        { userId: 'usr-a', isHost: true, joinedAt: new Date(now.getTime() - 3000), depositPaid: 0 },
        { userId: 'usr-b', isHost: false, joinedAt: new Date(now.getTime() - 2000), depositPaid: 0 },
        { userId: 'usr-c', isHost: false, joinedAt: new Date(now.getTime() - 1000), depositPaid: 0 },
      ],
      cartItems: [
        { userId: 'usr-a', qty: 1, unitPrice: 10000 },
        { userId: 'usr-b', qty: 1, unitPrice: 20000 },
        { userId: 'usr-c', qty: 1, unitPrice: 30000 },
      ],
    });

    expect(result.grandTotal).toBe(170000);
    const billB = result.bills.find((b) => b.user_id === 'usr-b')!;
    expect(billB.total).toBe(56667); // 56666 + 1
    const sum = result.bills.reduce((acc, b) => acc + b.total, 0);
    expect(sum).toBe(170000);
  });

  it('5. Khấu trừ tiền cọc đã nộp (deposit_offset) khi tính tổng payable', () => {
    // Member C có cọc 30.000 VND
    const now = new Date();
    const result = calculateSplitBills({
      lobbyId: 'lob-deposit',
      inviteCode: 'DEP01',
      slotPrice: 120000,
      venueOrCrossDiscount: 0,
      shipFee: 0,
      fnbDiscount: 0,
      members: [
        { userId: 'usr-a', isHost: true, joinedAt: new Date(now.getTime() - 2000), depositPaid: 0 },
        { userId: 'usr-c', isHost: false, joinedAt: new Date(now.getTime() - 1000), depositPaid: 30000 },
      ],
      cartItems: [],
    });

    const billC = result.bills.find((b) => b.user_id === 'usr-c')!;
    expect(billC.deposit_offset).toBe(30000);
    expect(billC.total).toBe(30000); // 60.000 - 30.000 = 30.000
  });

  it('6. Sinh mã VietQR URL chuẩn cấu trúc MB/img.vietqr.io với addInfo SYNCHUB', () => {
    const result = calculateSplitBills({
      lobbyId: 'lob-qr',
      inviteCode: 'SYNC88',
      slotPrice: 60000,
      venueOrCrossDiscount: 0,
      shipFee: 0,
      fnbDiscount: 0,
      members: [
        { userId: 'usr-host-01', isHost: true, joinedAt: new Date(), depositPaid: 0 },
      ],
      cartItems: [],
    });

    const bill = result.bills[0];
    expect(bill.vietqr_url).toContain('https://img.vietqr.io/image/');
    expect(bill.vietqr_url).toContain('amount=60000');
    expect(bill.vietqr_url).toContain('SYNCHUB%20SYNC88%20usr-ho');
  });

  it('7. Áp dụng voucher CROSS giảm trừ vào tiền sân ròng', () => {
    const result = calculateSplitBills({
      lobbyId: 'lob-cross',
      inviteCode: 'CROSS01',
      slotPrice: 120000,
      venueOrCrossDiscount: 20000, // Voucher CROSS 20k
      shipFee: 0,
      fnbDiscount: 0,
      members: [
        { userId: 'usr-1', isHost: true, joinedAt: new Date(), depositPaid: 0 },
        { userId: 'usr-2', isHost: false, joinedAt: new Date(), depositPaid: 0 },
      ],
      cartItems: [],
    });

    expect(result.slotNet).toBe(100000); // 120k - 20k
    expect(result.grandTotal).toBe(100000);
    expect(result.bills[0].total).toBe(50000);
    expect(result.bills[1].total).toBe(50000);
  });
});
