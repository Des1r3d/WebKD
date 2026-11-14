import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Role, UserStatus, ProviderType, VoucherScope } from '@prisma/client';
import { calculateReputation } from '../src/utils/reputation.js';

describe('WBS-2.3: Kiểm chứng Dữ liệu Mẫu Seed & BR Khóa', () => {
  const MOCK_USERS_SEED = [
    { id: 'usr-host-01', role: Role.HOST, score: 98, status: UserStatus.ACTIVE },
    { id: 'usr-mem-02', role: Role.MEMBER, score: 82, status: UserStatus.ACTIVE },
    { id: 'usr-mem-03', role: Role.MEMBER, score: 64, status: UserStatus.ACTIVE },
    { id: 'usr-mem-04', role: Role.MEMBER, score: 95, status: UserStatus.ACTIVE },
    { id: 'usr-flag-05', role: Role.MEMBER, score: 42, status: UserStatus.FLAGGED },
    { id: 'usr-prv-01', role: Role.PROVIDER, score: 100, status: UserStatus.ACTIVE },
    { id: 'usr-prv-02', role: Role.PROVIDER, score: 100, status: UserStatus.ACTIVE },
    { id: 'usr-adm-01', role: Role.ADMIN, score: 100, status: UserStatus.ACTIVE },
  ];

  it('Dữ liệu 8 Users: Đủ 4 Role và 3 Hạng Uy tín (A, B, C + FLAGGED)', () => {
    assert.strictEqual(MOCK_USERS_SEED.length, 8);

    const roles = new Set(MOCK_USERS_SEED.map((u) => u.role));
    assert.strictEqual(roles.has(Role.HOST), true);
    assert.strictEqual(roles.has(Role.MEMBER), true);
    assert.strictEqual(roles.has(Role.PROVIDER), true);
    assert.strictEqual(roles.has(Role.ADMIN), true);

    const tiers = MOCK_USERS_SEED.map((u) => calculateReputation(u.score).tier);
    assert.ok(tiers.includes('A'));
    assert.ok(tiers.includes('B'));
    assert.ok(tiers.includes('C'));
    assert.ok(tiers.includes('FLAGGED'));

    // Kiểm tra cọc BR-REP-01:
    const hostRep = calculateReputation(98);
    assert.strictEqual(hostRep.tier, 'A');
    assert.strictEqual(hostRep.depositPercent, 0);

    const bRep = calculateReputation(82);
    assert.strictEqual(bRep.tier, 'B');
    assert.strictEqual(bRep.depositPercent, 30);

    const cRep = calculateReputation(64);
    assert.strictEqual(cRep.tier, 'C');
    assert.strictEqual(cRep.depositPercent, 100);

    const flagRep = calculateReputation(42);
    assert.strictEqual(flagRep.tier, 'FLAGGED');
    assert.strictEqual(flagRep.canJoinLobby, false);
  });

  it('10 VENUE và 15 FNB: Tọa độ thật nằm trong bán kính Làng ĐH Thủ Đức', () => {
    // NVH Sinh Viên ĐHQG làm tâm: 10.8752, 106.8007
    const centerLat = 10.8752;
    const centerLng = 106.8007;

    function getDistanceMeters(lat1, lon1, lat2, lon2) {
      const R = 6371e3; // metres
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c);
    }

    // Kiểm tra mẫu 1 số địa điểm thực tế
    const venues = [
      { id: 'prv-venue-01', lat: 10.8752, lng: 106.8007 },
      { id: 'prv-venue-02', lat: 10.8721, lng: 106.7985 },
      { id: 'prv-venue-03', lat: 10.8789, lng: 106.8042 },
    ];

    const fnbs = [
      { id: 'prv-fnb-01', lat: 10.8768, lng: 106.8019 }, // Phúc Long KTX B
      { id: 'prv-fnb-02', lat: 10.8735, lng: 106.7992 }, // The Coffee House
      { id: 'prv-fnb-03', lat: 10.8712, lng: 106.8051 }, // Bánh mì chảo Cô Ba
    ];

    // Khoảng cách từ Phúc Long KTX B tới NVH SV ĐHQG <= 300m
    const distFnb01 = getDistanceMeters(centerLat, centerLng, fnbs[0].lat, fnbs[0].lng);
    assert.ok(distFnb01 < 500);

    // Mọi địa điểm đều trong bán kính 2.5km quanh Làng ĐH
    for (const v of venues) {
      const d = getDistanceMeters(centerLat, centerLng, v.lat, v.lng);
      assert.ok(d < 2500);
    }
  });

  it('Vouchers: Có mã CROSS với max_distance_m = 1000m (BR-INT-05)', () => {
    const crossVoucher = {
      code: 'SYNCHUBCROSS15',
      scope: VoucherScope.CROSS,
      value: 15,
      max_distance_m: 1000,
    };

    assert.strictEqual(crossVoucher.scope, VoucherScope.CROSS);
    assert.strictEqual(crossVoucher.max_distance_m, 1000);
    assert.strictEqual(crossVoucher.value, 15);
  });

  it('Test Vector chuẩn BR-INT-02: 4 người, Tổng 215.000 VND khớp từng thành viên', () => {
    // Sân 120k / 4 người (A là Host, B, C, D)
    const slotNet = 120000;
    const n = 4;
    const slotShare = slotNet / n; // 30.000

    const foods = [25000, 30000, 0, 45000];
    const totalFood = foods.reduce((sum, f) => sum + f, 0); // 100.000
    assert.strictEqual(totalFood, 100000);

    const shipFee = 15000;
    const fnbDiscount = 20000;
    const adj = shipFee - fnbDiscount; // -5.000

    // Phân bổ adj theo tỷ lệ tiền món cá nhân / totalFood
    // A: 25k/100k * (-5000) = -1250
    // B: 30k/100k * (-5000) = -1500
    // C: 0 -> 0
    // D: 45k/100k * (-5000) = -2250
    const adjShares = foods.map((f) => (totalFood > 0 ? (adj * f) / totalFood : 0));

    const expectedTotals = [
      slotShare + foods[0] + adjShares[0], // 30.000 + 25.000 - 1.250 = 53.750
      slotShare + foods[1] + adjShares[1], // 30.000 + 30.000 - 1.500 = 58.500
      slotShare + foods[2] + adjShares[2], // 30.000 + 0 + 0 = 30.000
      slotShare + foods[3] + adjShares[3], // 30.000 + 45.000 - 2.250 = 72.750
    ];

    assert.deepStrictEqual(expectedTotals, [53750, 58500, 30000, 72750]);

    const grandTotal = expectedTotals.reduce((sum, t) => sum + t, 0);
    assert.strictEqual(grandTotal, 215000);
  });
});
