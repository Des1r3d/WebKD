import 'dotenv/config';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PrismaClient,
  Role,
  UserStatus,
  ProviderType,
  SlotStatus,
  LobbyStatus,
  LobbyMemberStatus,
  VoucherScope,
  DiscountType,
  EscrowTxType,
  EscrowStatus,
  DisputeStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

export const prisma = new PrismaClient();

let cachedPasswordHash = null;

export async function seed(opts) {
  const client = opts?.client ?? prisma;
  const log = (...args) => {
    if (!opts?.silent) console.log(...args);
  };
  log('🌱 [SyncHub Seed] Bắt đầu khởi tạo dữ liệu mẫu...');

  // 1. Xóa dữ liệu cũ theo thứ tự quan hệ khóa ngoại (ngược chiều FK)
  if (opts?.clearExisting !== false) {
    await client.auditLog.deleteMany({});
    await client.dispute.deleteMany({});
    await client.escrowTransaction.deleteMany({});
    await client.splitBill.deleteMany({});
    await client.cartItem.deleteMany({});
    await client.lobbyMember.deleteMany({});
    await client.groupLobby.deleteMany({});
    await client.voucher.deleteMany({});
    await client.menuItem.deleteMany({});
    await client.slot.deleteMany({});
    await client.provider.deleteMany({});
    await client.user.deleteMany({});
    log('  🧹 Đã dọn sạch dữ liệu cũ');
  }

  // Mật khẩu chung: Password123!
  const passwordHash = cachedPasswordHash || (cachedPasswordHash = await bcrypt.hash('Password123!', 10));

  // ==========================================
  // 1. TẠO NGƯỜI DÙNG MẪU
  // ==========================================
  const usersData = [
    {
      id: 'usr-dat-01',
      email: 'dat.dt@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Đào Tiến Đạt',
      phone: '0909234567',
      role: Role.HOST,
      reputation_score: 98,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'usr-host-01',
      email: 'nguyen.minh.phat@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Nguyễn Minh Phát',
      phone: '0901234567',
      role: Role.HOST,
      reputation_score: 98, // Hạng A: cọc 0%
      status: UserStatus.ACTIVE,
    },
    {
      id: 'usr-mem-02',
      email: 'khuong.thao.vy@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Khương Thảo Vy',
      phone: '0902234567',
      role: Role.MEMBER,
      reputation_score: 82, // Hạng B: cọc 30%
      status: UserStatus.ACTIVE,
    },
    {
      id: 'usr-mem-03',
      email: 'tran.minh.quang@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Trần Minh Quang',
      phone: '0903234567',
      role: Role.MEMBER,
      reputation_score: 64, // Hạng C: cọc 100%
      status: UserStatus.ACTIVE,
    },
    {
      id: 'usr-mem-04',
      email: 'tran.quang.bao@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Trần Quang Bảo',
      phone: '0904234567',
      role: Role.MEMBER,
      reputation_score: 95, // Hạng A: cọc 0%
      status: UserStatus.ACTIVE,
    },
    {
      id: 'usr-flag-05',
      email: 'hung.flag@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Phạm Gia Hưng',
      phone: '0905234567',
      role: Role.MEMBER,
      reputation_score: 42, // Dưới 50: FLAGGED (bị chặn tham gia phòng)
      status: UserStatus.FLAGGED,
    },
    {
      id: 'usr-prv-01',
      email: 'thang.venue@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Hoàng Văn Thắng (Chủ Sân Venue)',
      phone: '0906234567',
      role: Role.PROVIDER,
      reputation_score: 100,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'usr-prv-02',
      email: 'thao.fnb@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Mai Thị Thảo (Chủ Quán FNB)',
      phone: '0907234567',
      role: Role.PROVIDER,
      reputation_score: 100,
      status: UserStatus.ACTIVE,
    },
    {
      id: 'usr-adm-01',
      email: 'admin@synchub.vn',
      password_hash: passwordHash,
      full_name: 'Nguyễn Minh Anh (System Admin)',
      phone: '0908234567',
      role: Role.ADMIN,
      reputation_score: 100,
      status: UserStatus.ACTIVE,
    },
  ];

  await client.user.createMany({ data: usersData });
  log(`  👤 Đã tạo ${usersData.length} người dùng mẫu`);

  // ==========================================
  // 2. TẠO 10 SÂN/PHÒNG HỌC (VENUE) QUANH LÀNG ĐH
  // Hoa hồng mặc định = 0.08 (8%)
  // ==========================================
  const venuesData = [
    {
      id: 'prv-venue-01',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'badminton',
      name: 'Sân Cầu Lông Nhà Văn Hóa Sinh Viên ĐHQG',
      address: 'Lưu Hữu Phước, Đông Hòa, Dĩ An (Làng ĐH Thủ Đức)',
      lat: 10.8752,
      lng: 106.8007,
      open_hours: '05:30-22:30',
      bank_code: 'MB',
      bank_account: '090123456789',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-02',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'study_room',
      name: 'iSpace Study Hub — Phòng Họp Nhóm A6',
      address: 'Khu phố 6, Linh Trung, TP. Thủ Đức',
      lat: 10.8721,
      lng: 106.7985,
      open_hours: '07:00-23:00',
      bank_code: 'VCB',
      bank_account: '1029384756',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-03',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'football',
      name: 'Sân Bóng Đá Mini Bách Khoa Thủ Đức',
      address: 'Đường Tạ Quang Bửu, KTX Khu A, TP. Thủ Đức',
      lat: 10.8789,
      lng: 106.8042,
      open_hours: '06:00-23:00',
      bank_code: 'ACB',
      bank_account: '88997766',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-04',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'badminton',
      name: 'CLB Cầu Lông KTX Khu B ĐHQG',
      address: 'Đường Tô Vĩnh Diện, KTX Khu B, Đông Hòa, Dĩ An',
      lat: 10.8765,
      lng: 106.8023,
      open_hours: '06:00-22:00',
      bank_code: 'MB',
      bank_account: '0906234504',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-05',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'study_room',
      name: 'The Library Space — Phòng Học Tự Học Thông Minh',
      address: 'Đường Võ Trường Toản, Trường ĐH Quốc Tế ĐHQG',
      lat: 10.8705,
      lng: 106.7958,
      open_hours: '07:30-22:30',
      bank_code: 'BIDV',
      bank_account: '65010001234567',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-06',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'badminton',
      name: 'Sân Cầu Lông Nắng Mai Làng ĐH',
      address: 'Đường Vành Đai ĐHQG, Phường Đông Hòa, Dĩ An',
      lat: 10.8795,
      lng: 106.8015,
      open_hours: '05:00-22:00',
      bank_code: 'TCB',
      bank_account: '190334455667',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-07',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'football',
      name: 'Sân Bóng Đá Cỏ Nhân Tạo KTX Khu A',
      address: 'Cổng KTX Khu A, Đường Lê Quý Đôn, Linh Trung, Thủ Đức',
      lat: 10.8745,
      lng: 106.7972,
      open_hours: '06:00-22:30',
      bank_code: 'MB',
      bank_account: '0906234507',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-08',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'study_room',
      name: 'StudyZone Co-working & Team Meeting ĐHQG',
      address: 'Đường Trần Đại Nghĩa, KTX Khu B, Đông Hòa, Dĩ An',
      lat: 10.8732,
      lng: 106.8038,
      open_hours: '08:00-23:00',
      bank_code: 'VPB',
      bank_account: '2233445566',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-09',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'badminton',
      name: 'Sân Cầu Lông Đại Học Thể Dục Thể Thao',
      address: 'Khu phố 6, P. Linh Trung, TP. Thủ Đức',
      lat: 10.8668,
      lng: 106.7942,
      open_hours: '06:00-21:30',
      bank_code: 'Agribank',
      bank_account: '5900205123456',
      commission_rate: 0.08,
    },
    {
      id: 'prv-venue-10',
      owner_id: 'usr-prv-01',
      type: ProviderType.VENUE,
      category: 'football',
      name: 'Sân Bóng Đá & Cầu Lông Sinh Viên Dĩ An',
      address: 'Đường Nguyễn Du, Phường Đông Hòa, Dĩ An, Bình Dương',
      lat: 10.8812,
      lng: 106.8065,
      open_hours: '06:00-23:00',
      bank_code: 'MB',
      bank_account: '0906234510',
      commission_rate: 0.08,
    },
  ];

  await client.provider.createMany({ data: venuesData });
  log(`  🏟️  Đã tạo ${venuesData.length} sân/phòng học (VENUE)`);

  // ==========================================
  // 3. TẠO 15 QUÁN ĂN/UỐNG (FNB) QUANH LÀNG ĐH
  // Hoa hồng mặc định = 0.12 (12%)
  // ==========================================
  const fnbData = [
    {
      id: 'prv-fnb-01',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'milk_tea',
      name: 'Trà Sữa & Nước Ép Phúc Long KTX Khu B',
      address: 'Đối diện Cổng B2, Đông Hòa, Dĩ An',
      lat: 10.8768,
      lng: 106.8019,
      open_hours: '07:00-22:30',
      bank_code: 'TCB',
      bank_account: '19034567890',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-02',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'coffee',
      name: 'The Coffee House — Thư Viện Trung Tâm',
      address: 'Quảng trường Sáng Tạo, ĐHQG TP.HCM',
      lat: 10.8735,
      lng: 106.7992,
      open_hours: '06:30-22:00',
      bank_code: 'VPB',
      bank_account: '6677889900',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-03',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'snack',
      name: 'Bánh Mì Chảo & Đồ Ăn Vặt Cô Ba Làng ĐH',
      address: 'Chợ Đêm Làng Đại Học, Linh Trung, Thủ Đức',
      lat: 10.8712,
      lng: 106.8051,
      open_hours: '08:00-23:00',
      bank_code: 'MB',
      bank_account: '0987654321',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-04',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'milk_tea',
      name: 'Trà Sữa TocoToco Khu A ĐHQG',
      address: 'Cổng 1 KTX Khu A, Đường Lê Quý Đôn, Thủ Đức',
      lat: 10.8755,
      lng: 106.7981,
      open_hours: '08:00-22:30',
      bank_code: 'MB',
      bank_account: '0907234504',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-05',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'coffee',
      name: 'Highlands Coffee Nhà Văn Hóa Sinh Viên',
      address: 'Sảnh Trệt NVH Sinh Viên, Lưu Hữu Phước, Dĩ An',
      lat: 10.8749,
      lng: 106.8009,
      open_hours: '06:30-22:00',
      bank_code: 'VCB',
      bank_account: '0071000987654',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-06',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'snack',
      name: 'Trà Đào Dầm & Sinh Tố Bác Ba Phi',
      address: 'Đường Quảng Trường Sáng Tạo, Làng ĐH Thủ Đức',
      lat: 10.8778,
      lng: 106.8032,
      open_hours: '09:00-23:00',
      bank_code: 'MB',
      bank_account: '0907234506',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-07',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'milk_tea',
      name: 'Quán Trà Sữa & Kem Mixue KTX Khu B',
      address: 'Cổng B1 KTX Khu B, Đông Hòa, Dĩ An',
      lat: 10.8762,
      lng: 106.8045,
      open_hours: '08:30-22:30',
      bank_code: 'ACB',
      bank_account: '9988776655',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-08',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'coffee',
      name: 'Katinat Saigon Kafe — Chi Nhánh Làng ĐH',
      address: 'Đường Nguyễn Du, Phường Đông Hòa, Dĩ An',
      lat: 10.8718,
      lng: 106.7965,
      open_hours: '07:00-22:30',
      bank_code: 'TCB',
      bank_account: '19038877665',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-09',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'snack',
      name: 'Xiên Que Nướng & Gà Rán Lắc Phô Mai Chợ Đêm',
      address: 'Khu ẩm thực Chợ Đêm ĐHQG, Linh Trung, Thủ Đức',
      lat: 10.8708,
      lng: 106.8062,
      open_hours: '15:00-23:30',
      bank_code: 'MB',
      bank_account: '0907234509',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-10',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'milk_tea',
      name: 'Trà Sữa Gong Cha Cổng Trường KHTN',
      address: 'Đường Nội Bộ ĐHQG, Linh Trung, Thủ Đức',
      lat: 10.8759,
      lng: 106.7948,
      open_hours: '08:00-22:00',
      bank_code: 'BIDV',
      bank_account: '6501000998877',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-11',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'coffee',
      name: 'Trung Nguyên E-Coffee KTX Khu A',
      address: 'Đường Tạ Quang Bửu, Phường Linh Trung, Thủ Đức',
      lat: 10.8742,
      lng: 106.7988,
      open_hours: '06:30-22:00',
      bank_code: 'MB',
      bank_account: '0907234511',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-12',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'snack',
      name: 'Nem Nướng Nha Trang Cô Út ĐHQG',
      address: 'Đường Chu Văn An, Khu Phố 6, Linh Trung, Thủ Đức',
      lat: 10.8725,
      lng: 106.8021,
      open_hours: '09:00-21:30',
      bank_code: 'Agribank',
      bank_account: '5900205889900',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-13',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'milk_tea',
      name: 'Trà Sữa Chicha San Chen Sinh Viên',
      address: 'Đường Vành Đai ĐHQG, Đông Hòa, Dĩ An',
      lat: 10.8785,
      lng: 106.8011,
      open_hours: '08:30-22:00',
      bank_code: 'VPB',
      bank_account: '8877665544',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-14',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'coffee',
      name: 'Milano Coffee Đường Vành Đai ĐHQG',
      address: 'Đường Vành Đai, KTX Khu B, Đông Hòa, Dĩ An',
      lat: 10.8798,
      lng: 106.8055,
      open_hours: '06:00-22:00',
      bank_code: 'MB',
      bank_account: '0907234514',
      commission_rate: 0.12,
    },
    {
      id: 'prv-fnb-15',
      owner_id: 'usr-prv-02',
      type: ProviderType.FNB,
      category: 'snack',
      name: 'Tiệm Trà Chanh & Ăn Vặt 1989 Làng ĐH',
      address: 'Gần ĐH Khoa Học Xã Hội & Nhân Văn ĐHQG, Thủ Đức',
      lat: 10.8695,
      lng: 106.7979,
      open_hours: '14:00-23:00',
      bank_code: 'TCB',
      bank_account: '19036655443',
      commission_rate: 0.12,
    },
  ];

  await client.provider.createMany({ data: fnbData });
  log(`  🧋 Đã tạo ${fnbData.length} quán ăn/uống (FNB)`);

  // ==========================================
  // 4. TẠO MENU ITEMS CHO CÁC QUÁN FNB
  // Đặc biệt prv-fnb-01 chứa các món test vector BR-INT-02: 25k, 30k, 45k
  // ==========================================
  const menuItemsData = [
    // prv-fnb-01: Phúc Long KTX Khu B
    {
      id: 'mnu-01',
      provider_id: 'prv-fnb-01',
      name: 'Trà Đào Cam Sả Size L (Ít đường)',
      price: 25000,
      image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&q=80',
      is_available: true,
      order_count: 342,
    },
    {
      id: 'mnu-02',
      provider_id: 'prv-fnb-01',
      name: 'Hồng Trà Sữa Trân Châu Hoàng Kim',
      price: 30000,
      image_url: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
      is_available: true,
      order_count: 289,
    },
    {
      id: 'mnu-03',
      provider_id: 'prv-fnb-01',
      name: 'Combo Nước Ép Cam Nguyên Chất + Bánh Ngọt',
      price: 45000,
      image_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&q=80',
      is_available: true,
      order_count: 198,
    },
    {
      id: 'mnu-04',
      provider_id: 'prv-fnb-01',
      name: 'Nước Điện Giải Revive Chanh Muối Ướp Lạnh',
      price: 15000,
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80',
      is_available: true,
      order_count: 510,
    },

    // prv-fnb-02: The Coffee House
    {
      id: 'mnu-05',
      provider_id: 'prv-fnb-02',
      name: 'Cà Phê Sữa Đá Sài Gòn Đậm Đà',
      price: 32000,
      image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80',
      is_available: true,
      order_count: 420,
    },
    {
      id: 'mnu-06',
      provider_id: 'prv-fnb-02',
      name: 'Bạc Xỉu Đá 3 Tầng Kem Sữa',
      price: 35000,
      image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&q=80',
      is_available: true,
      order_count: 360,
    },
    {
      id: 'mnu-07',
      provider_id: 'prv-fnb-02',
      name: 'Trà Oolong Hạt Sen Thơm Mát',
      price: 42000,
      image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
      is_available: true,
      order_count: 240,
    },

    // prv-fnb-03: Bánh Mì Chảo Cô Ba
    {
      id: 'mnu-08',
      provider_id: 'prv-fnb-03',
      name: 'Bánh Mì Chảo Đặc Biệt 2 Trứng Xúc Xích Pâté',
      price: 35000,
      image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80',
      is_available: true,
      order_count: 512,
    },
    {
      id: 'mnu-09',
      provider_id: 'prv-fnb-03',
      name: 'Bánh Tráng Nướng Đà Lạt Mỡ Hành',
      price: 20000,
      image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&q=80',
      is_available: true,
      order_count: 670,
    },
    {
      id: 'mnu-10',
      provider_id: 'prv-fnb-03',
      name: 'Trà Tắc Xí Muội Khổng Lồ 1 Lít',
      price: 18000,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80',
      is_available: true,
      order_count: 810,
    },

    // prv-fnb-04: TocoToco Khu A
    {
      id: 'mnu-11',
      provider_id: 'prv-fnb-04',
      name: 'Trà Sữa Ba Anh Em Size L',
      price: 32000,
      image_url: 'https://images.unsplash.com/photo-1558857563-b371f31ca704?w=500&q=80',
      is_available: true,
      order_count: 275,
    },
    {
      id: 'mnu-12',
      provider_id: 'prv-fnb-04',
      name: 'Trà Xanh Xoài Kem Phô Mai Macchiato',
      price: 38000,
      image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&q=80',
      is_available: true,
      order_count: 195,
    },

    // prv-fnb-05: Highlands Coffee NVH Sinh Viên
    {
      id: 'mnu-13',
      provider_id: 'prv-fnb-05',
      name: 'Freeze Trà Xanh Cỡ Lớn Kèm Thạch',
      price: 55000,
      image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80',
      is_available: true,
      order_count: 480,
    },
    {
      id: 'mnu-14',
      provider_id: 'prv-fnb-05',
      name: 'Phin Sữa Đá Cỡ Vừa Chuẩn Vị',
      price: 29000,
      image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80',
      is_available: true,
      order_count: 620,
    },

    // prv-fnb-07: Mixue KTX B
    {
      id: 'mnu-15',
      provider_id: 'prv-fnb-07',
      name: 'Kem Vani Cây Ốc Quế Giòn Rụm',
      price: 10000,
      image_url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=500&q=80',
      is_available: true,
      order_count: 1250,
    },
    {
      id: 'mnu-16',
      provider_id: 'prv-fnb-07',
      name: 'Trà Chanh Tươi Mát Lạnh Cỡ Đại',
      price: 20000,
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80',
      is_available: true,
      order_count: 980,
    },

    // prv-fnb-09: Xiên Que Nướng Chợ Đêm
    {
      id: 'mnu-17',
      provider_id: 'prv-fnb-09',
      name: 'Combo 5 Xiên Bò Cuộn Nấm Kim Châm Nướng Sốt',
      price: 45000,
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80',
      is_available: true,
      order_count: 310,
    },
    {
      id: 'mnu-18',
      provider_id: 'prv-fnb-09',
      name: 'Khoai Tây Lắc Phô Mai Béo Ngậy',
      price: 25000,
      image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80',
      is_available: true,
      order_count: 440,
    },
  ];

  await client.menuItem.createMany({ data: menuItemsData });
  log(`  📋 Đã tạo ${menuItemsData.length} món trong thực đơn FNB`);

  // ==========================================
  // 5. TẠO SLOTS TRONG 7 NGÀY TỚI CHO 10 VENUES
  // ==========================================
  const now = new Date();
  const slotsToCreate
= [];

  // Tạo slot cho prv-venue-01 ngày hôm nay (khung giờ mẫu theo CONTEXT test vector)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Slot 01: 17:00-18:00 (BOOKED)
  const slt01Start = new Date(today.getTime() + 17 * 3600 * 1000);
  const slt01End = new Date(today.getTime() + 18 * 3600 * 1000);
  slotsToCreate.push({
    id: 'slt-01',
    provider_id: 'prv-venue-01',
    start_at: slt01Start,
    end_at: slt01End,
    price: 100000,
    status: SlotStatus.BOOKED,
  });

  // Slot 02: 18:00-19:00 (AVAILABLE)
  const slt02Start = new Date(today.getTime() + 18 * 3600 * 1000);
  const slt02End = new Date(today.getTime() + 19 * 3600 * 1000);
  slotsToCreate.push({
    id: 'slt-02',
    provider_id: 'prv-venue-01',
    start_at: slt02Start,
    end_at: slt02End,
    price: 120000,
    status: SlotStatus.AVAILABLE,
  });

  // Slot 03: 19:00-20:00 (LOCKED bởi Host — Sân 120k / 4 người cho ca BR-INT-02)
  const slt03Start = new Date(today.getTime() + 19 * 3600 * 1000);
  const slt03End = new Date(today.getTime() + 20 * 3600 * 1000);
  slotsToCreate.push({
    id: 'slt-03',
    provider_id: 'prv-venue-01',
    start_at: slt03Start,
    end_at: slt03End,
    price: 120000,
    status: SlotStatus.LOCKED,
    locked_by: 'usr-host-01',
    locked_until: new Date(Date.now() + 10 * 60 * 1000), // 10 phút giữ chỗ BR-SLT-01
  });

  // Slot 04: 20:00-21:00 (AVAILABLE)
  const slt04Start = new Date(today.getTime() + 20 * 3600 * 1000);
  const slt04End = new Date(today.getTime() + 21 * 3600 * 1000);
  slotsToCreate.push({
    id: 'slt-04',
    provider_id: 'prv-venue-01',
    start_at: slt04Start,
    end_at: slt04End,
    price: 120000,
    status: SlotStatus.AVAILABLE,
  });

  // Slot 05: 21:00-22:00 (AVAILABLE)
  const slt05Start = new Date(today.getTime() + 21 * 3600 * 1000);
  const slt05End = new Date(today.getTime() + 22 * 3600 * 1000);
  slotsToCreate.push({
    id: 'slt-05',
    provider_id: 'prv-venue-01',
    start_at: slt05Start,
    end_at: slt05End,
    price: 100000,
    status: SlotStatus.AVAILABLE,
  });

  // Sinh các slot cho 7 ngày tới cho toàn bộ 10 sân
  let slotCounter = 6;
  const timeFrames = [
    { startH: 7, endH: 9, priceOffset: -20000 },
    { startH: 9, endH: 11, priceOffset: -10000 },
    { startH: 15, endH: 17, priceOffset: 0 },
    { startH: 17, endH: 19, priceOffset: 20000 },
    { startH: 19, endH: 21, priceOffset: 30000 },
  ];

  const maxDays = opts?.fast ? 1 : 7;
  for (let dayOffset = 1; dayOffset <= maxDays; dayOffset++) {
    const targetDate = new Date(today.getTime() + dayOffset * 24 * 3600 * 1000);

    for (const venue of venuesData) {
      const basePrice =
        venue.category === 'badminton'
          ? 110000
          : venue.category === 'study_room'
          ? 90000
          : 220000;

      for (const tf of timeFrames) {
        const startAt = new Date(targetDate.getTime() + tf.startH * 3600 * 1000);
        const endAt = new Date(targetDate.getTime() + tf.endH * 3600 * 1000);

        slotsToCreate.push({
          id: `slt-gen-${slotCounter++}`,
          provider_id: venue.id,
          start_at: startAt,
          end_at: endAt,
          price: basePrice + tf.priceOffset,
          status: SlotStatus.AVAILABLE,
        });
      }
    }
  }

  await client.slot.createMany({ data: slotsToCreate });
  log(`  ⏰ Đã tạo ${slotsToCreate.length} khung giờ slot trong ${maxDays} ngày tới cho 10 sân`);

  // ==========================================
  // 6. TẠO VOUCHERS (VENUE / FNB / CROSS) (BR-INT-05)
  // ==========================================
  const validFrom = new Date(now.getTime() - 24 * 3600 * 1000);
  const validTo = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const vouchersData = [
    {
      id: 'vch-cross-15',
      code: 'SYNCHUBCROSS15',
      scope: VoucherScope.CROSS,
      discount_type: DiscountType.PERCENT,
      value: 15, // 15%
      max_discount: 30000,
      min_order: 80000,
      max_distance_m: 1000, // BR-INT-05: bán kính tối đa 1000m
      valid_from: validFrom,
      valid_to: validTo,
      usage_limit: 500,
      used_count: 18,
    },
    {
      id: 'vch-fnb-20k',
      code: 'FNBLANGDH20K',
      scope: VoucherScope.FNB,
      discount_type: DiscountType.FIXED,
      value: 20000, // 20.000 VND
      max_discount: 20000,
      min_order: 80000,
      max_distance_m: 1000,
      valid_from: validFrom,
      valid_to: validTo,
      usage_limit: 300,
      used_count: 45,
    },
    {
      id: 'vch-venue-10',
      code: 'SANLANGDH10',
      scope: VoucherScope.VENUE,
      discount_type: DiscountType.PERCENT,
      value: 10, // 10%
      max_discount: 50000,
      min_order: 100000,
      max_distance_m: 1000,
      valid_from: validFrom,
      valid_to: validTo,
      usage_limit: 200,
      used_count: 12,
    },
    {
      id: 'vch-cross-combo',
      code: 'COMBOBANBE25',
      scope: VoucherScope.CROSS,
      discount_type: DiscountType.FIXED,
      value: 25000,
      max_discount: 25000,
      min_order: 120000,
      max_distance_m: 1500,
      valid_from: validFrom,
      valid_to: validTo,
      usage_limit: 150,
      used_count: 8,
    },
  ];

  await client.voucher.createMany({ data: vouchersData });
  log(`  🎟️  Đã tạo ${vouchersData.length} mã voucher (có mã CROSS và FNB)`);

  // ==========================================
  // 7. TẠO 1 GROUP LOBBY MẪU (CHUẨN TEST VECTOR BR-INT-02)
  // Sân 120k / 4 người (A, B, C, D); Quán Phúc Long (cách sân 280m)
  // Món: A 25k, B 30k, C 0k, D 45k -> Tổng món: 100k
  // Ship: 15k, Voucher FNB: -20k -> adj = -5.000
  // ==========================================
  const lobby01 = await client.groupLobby.create({
    data: {
      id: 'lob-01',
      host_id: 'usr-host-01',
      slot_id: 'slt-03',
      fnb_provider_id: 'prv-fnb-01',
      invite_code: 'SYNC01',
      status: LobbyStatus.OPEN,
      deadline_at: new Date(Date.now() + 45 * 60 * 1000),
      ship_fee: 15000,
      voucher_id: 'vch-fnb-20k',
    },
  });

  // 4 Thành viên theo BR-REP-01:
  // A: Host (Hạng A, score 98) -> deposit 0
  // B: Member (Hạng B, score 82) -> cọc 30% phần sân 30.000 = 9.000 VND
  // C: Member (Hạng C, score 64) -> cọc 100% phần sân 30.000 = 30.000 VND
  // D: Member (Hạng A, score 95) -> deposit 0
  const membersData = [
    {
      lobby_id: lobby01.id,
      user_id: 'usr-host-01',
      deposit_required: 0,
      deposit_paid: 0,
      status: LobbyMemberStatus.JOINED,
    },
    {
      lobby_id: lobby01.id,
      user_id: 'usr-mem-02',
      deposit_required: 9000,
      deposit_paid: 9000,
      status: LobbyMemberStatus.JOINED,
    },
    {
      lobby_id: lobby01.id,
      user_id: 'usr-mem-03',
      deposit_required: 30000,
      deposit_paid: 30000,
      status: LobbyMemberStatus.JOINED,
    },
    {
      lobby_id: lobby01.id,
      user_id: 'usr-mem-04',
      deposit_required: 0,
      deposit_paid: 0,
      status: LobbyMemberStatus.JOINED,
    },
  ];

  await client.lobbyMember.createMany({ data: membersData });

  // Giỏ hàng cá nhân cho ca chia bill chuẩn 215.000 VND (BR-INT-02):
  // A: 25.000 (Trà đào cam sả)
  // B: 30.000 (Hồng trà sữa trân châu)
  // C: 0 (không đặt món)
  // D: 45.000 (Combo nước ép + bánh)
  const cartItemsData = [
    {
      id: 'crt-01',
      lobby_id: lobby01.id,
      user_id: 'usr-host-01',
      menu_item_id: 'mnu-01',
      qty: 1,
      unit_price_snapshot: 25000,
    },
    {
      id: 'crt-02',
      lobby_id: lobby01.id,
      user_id: 'usr-mem-02',
      menu_item_id: 'mnu-02',
      qty: 1,
      unit_price_snapshot: 30000,
    },
    {
      id: 'crt-03',
      lobby_id: lobby01.id,
      user_id: 'usr-mem-04',
      menu_item_id: 'mnu-03',
      qty: 1,
      unit_price_snapshot: 45000,
    },
  ];

  await client.cartItem.createMany({ data: cartItemsData });
  log(`  👥 Đã tạo Group Lobby mẫu (SYNC01) kèm 4 thành viên và giỏ hàng chuẩn 100k`);

  // ==========================================
  // 8. TẠO PHÒNG MẪU ĐÃ HOÀN THÀNH (lob-00-prev) ĐỂ SEED 2 KỊCH BẢN WBS-5.2
  // Kịch bản (a): Bùng kèo -15 điểm + mất cọc PENALTY
  // Kịch bản (b): Quán giao thiếu nước -> Admin hoàn tiền từ Escrow
  // ==========================================
  const lobby00 = await client.groupLobby.create({
    data: {
      id: 'lob-00-prev',
      host_id: 'usr-host-01',
      slot_id: 'slt-01',
      fnb_provider_id: 'prv-fnb-01',
      invite_code: 'SYNC00',
      status: LobbyStatus.COMPLETED,
      deadline_at: new Date(now.getTime() - 25 * 3600 * 1000),
      ship_fee: 15000,
    },
  });

  // Thành viên phòng cũ: có usr-flag-05 bị NO_SHOW
  await client.lobbyMember.createMany({
    data: [
      {
        lobby_id: lobby00.id,
        user_id: 'usr-host-01',
        deposit_required: 0,
        deposit_paid: 0,
        status: LobbyMemberStatus.CHECKED_IN,
      },
      {
        lobby_id: lobby00.id,
        user_id: 'usr-mem-02',
        deposit_required: 0,
        deposit_paid: 0,
        status: LobbyMemberStatus.CHECKED_IN,
      },
      {
        lobby_id: lobby00.id,
        user_id: 'usr-flag-05',
        deposit_required: 30000,
        deposit_paid: 30000,
        status: LobbyMemberStatus.NO_SHOW, // Kịch bản (a)
      },
    ],
  });

  // Escrow transactions cho phòng cũ
  await client.escrowTransaction.createMany({
    data: [
      {
        id: 'esc-tx-prev-venue',
        lobby_id: lobby00.id,
        type: EscrowTxType.RELEASE,
        amount: 100000,
        platform_fee: 8000, // 8%
        net_amount: 92000,
        payee_provider_id: 'prv-venue-01',
        status: EscrowStatus.RELEASED,
        idempotency_key: 'release:lob-00-prev:prv-venue-01',
      },
      {
        id: 'esc-tx-prev-fnb',
        lobby_id: lobby00.id,
        type: EscrowTxType.RELEASE,
        amount: 95000,
        platform_fee: 11400, // 12%
        net_amount: 83600,
        payee_provider_id: 'prv-fnb-01',
        status: EscrowStatus.RELEASED,
        idempotency_key: 'release:lob-00-prev:prv-fnb-01',
      },
      // Kịch bản (a): Phạt cọc bùng kèo 30k chuyển cho chủ sân
      {
        id: 'esc-tx-penalty-01',
        lobby_id: lobby00.id,
        type: EscrowTxType.PENALTY,
        amount: 30000,
        platform_fee: 0,
        net_amount: 30000,
        payee_provider_id: 'prv-venue-01',
        status: EscrowStatus.RELEASED,
        idempotency_key: 'penalty:lob-00-prev:usr-flag-05',
      },
      // Kịch bản (b): Hoàn tiền khiếu nại 25.000đ từ Escrow
      {
        id: 'esc-tx-refund-01',
        lobby_id: lobby00.id,
        type: EscrowTxType.REFUND,
        amount: 25000,
        platform_fee: 0,
        net_amount: 25000,
        status: EscrowStatus.REFUNDED,
        idempotency_key: 'refund:lob-00-prev:dsp-01',
      },
    ],
  });

  // Kịch bản (b): Khiếu nại quán giao thiếu nước -> Admin hoàn tiền
  await client.dispute.create({
    data: {
      id: 'dsp-01',
      lobby_id: lobby00.id,
      reporter_id: 'usr-mem-02',
      target_provider_id: 'prv-fnb-01',
      reason: 'Quán giao thiếu 1 ly Trà đào cam sả so với giỏ hàng đã thanh toán',
      evidence_urls: [
        'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
      ],
      status: DisputeStatus.RESOLVED,
      refund_amount: 25000,
      resolved_by: 'usr-adm-01',
      resolved_at: new Date(now.getTime() - 20 * 3600 * 1000),
    },
  });

  // ==========================================
  // 9. TẠO CÁC DÒNG AUDIT LOG MẪU (BR-DSP-01, BR-REP-02)
  // ==========================================
  await client.auditLog.createMany({
    data: [
      {
        actor_id: 'usr-host-01',
        action: 'LOBBY_CREATED',
        entity: 'group_lobbies',
        entity_id: lobby01.id,
        after: {
          invite_code: 'SYNC01',
          slot_id: 'slt-03',
          status: 'OPEN',
        },
      },
      {
        actor_id: 'usr-host-01',
        action: 'REPUTATION_CHANGE',
        entity: 'users',
        entity_id: 'usr-flag-05',
        before: { reputation_score: 57 },
        after: {
          reputation_score: 42,
          status: 'FLAGGED',
          delta: -15,
          reason: 'Bùng kèo không check-in phòng SYNC00 (BR-REP-02)',
        },
      },
      {
        actor_id: 'usr-adm-01',
        action: 'DISPUTE_RESOLVE',
        entity: 'disputes',
        entity_id: 'dsp-01',
        before: { status: 'OPEN', refund_amount: 25000 },
        after: {
          status: 'RESOLVED',
          refund_amount: 25000,
          resolver: 'usr-adm-01',
        },
      },
    ],
  });

  log('✅ [SyncHub Seed] Hoàn thành khởi tạo dữ liệu mẫu thành công!');
}

// Chạy trực tiếp nếu file được thực thi độc lập
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seed()
    .catch((e) => {
      console.error('❌ [SyncHub Seed] Lỗi khởi tạo dữ liệu:', e);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
