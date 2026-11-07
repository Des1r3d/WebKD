import {
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

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
  role: Role;
  reputation_score: number;
  status: UserStatus;
  created_at: Date;
}

export interface ProviderRecord {
  id: string;
  owner_id: string;
  type: ProviderType;
  category: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  open_hours: string;
  bank_code: string;
  bank_account: string;
  commission_rate: number;
  created_at: Date;
}

export interface SlotRecord {
  id: string;
  provider_id: string;
  start_at: Date;
  end_at: Date;
  price: number;
  status: SlotStatus;
  locked_by: string | null;
  locked_until: Date | null;
}

export interface MenuItemRecord {
  id: string;
  provider_id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  order_count: number;
}

export interface VoucherRecord {
  id: string;
  code: string;
  scope: VoucherScope;
  discount_type: DiscountType;
  value: number;
  max_discount: number;
  min_order: number;
  max_distance_m: number;
  valid_from: Date;
  valid_to: Date;
  usage_limit: number;
  used_count: number;
}

export interface GroupLobbyRecord {
  id: string;
  host_id: string;
  slot_id: string;
  fnb_provider_id: string | null;
  invite_code: string;
  status: LobbyStatus;
  deadline_at: Date;
  ship_fee: number;
  voucher_id: string | null;
  locked_at: Date | null;
  created_at: Date;
}

export interface LobbyMemberRecord {
  lobby_id: string;
  user_id: string;
  deposit_required: number;
  deposit_paid: number;
  status: LobbyMemberStatus;
  joined_at: Date;
}

export interface CartItemRecord {
  id: string;
  lobby_id: string;
  user_id: string;
  menu_item_id: string;
  qty: number;
  unit_price_snapshot: number;
  created_at: Date;
}

export interface SplitBillRecord {
  id: string;
  lobby_id: string;
  user_id: string;
  slot_share: number;
  food_amount: number;
  ship_share: number;
  discount_share: number;
  deposit_offset: number;
  total: number;
  vietqr_url: string;
  status: 'PENDING' | 'PAID' | 'REFUNDED';
  paid_at: Date | null;
}

export interface ChatMessageRecord {
  id: string;
  lobby_id: string;
  user_id: string;
  full_name: string;
  text: string;
  created_at: Date;
}

export interface EscrowTransactionRecord {
  id: string;
  lobby_id: string;
  split_bill_id: string | null;
  type: EscrowTxType;
  amount: number;
  platform_fee: number;
  net_amount: number;
  payee_provider_id: string | null;
  status: EscrowStatus;
  idempotency_key: string;
  created_at: Date;
}

export interface DisputeRecord {
  id: string;
  lobby_id: string;
  reporter_id: string;
  target_provider_id: string;
  reason: string;
  evidence_urls: string[];
  status: DisputeStatus;
  refund_amount: number;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_at: Date;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  before: any;
  after: any;
  created_at: Date;
}

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// Hash chuẩn cho 'Password123!'
const DEFAULT_PASSWORD_HASH = '$2b$10$wT332Jq29fCg3xKk12760.3y1U/O6aVp.rI70pA4/eS7eIuU3lqWy';

export const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr-host-01',
    email: 'dat.dt@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Đào Tiến Đạt (Host)',
    phone: '0901234567',
    role: Role.HOST,
    reputation_score: 98,
    status: UserStatus.ACTIVE,
    created_at: now,
  },
  {
    id: 'usr-mem-02',
    email: 'minh.b@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Trần Quang Minh',
    phone: '0902234567',
    role: Role.MEMBER,
    reputation_score: 82,
    status: UserStatus.ACTIVE,
    created_at: now,
  },
  {
    id: 'usr-mem-03',
    email: 'linh.c@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Lê Hoàng Linh',
    phone: '0903234567',
    role: Role.MEMBER,
    reputation_score: 64,
    status: UserStatus.ACTIVE,
    created_at: now,
  },
  {
    id: 'usr-mem-04',
    email: 'kiet.d@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Nguyễn Tuấn Kiệt',
    phone: '0904234567',
    role: Role.MEMBER,
    reputation_score: 95,
    status: UserStatus.ACTIVE,
    created_at: now,
  },
  {
    id: 'usr-flag-05',
    email: 'hung.flag@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Phạm Gia Hưng',
    phone: '0905234567',
    role: Role.MEMBER,
    reputation_score: 42,
    status: UserStatus.FLAGGED,
    created_at: now,
  },
  {
    id: 'usr-prv-01',
    email: 'thang.venue@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Hoàng Văn Thắng (Chủ Sân Venue)',
    phone: '0906234567',
    role: Role.PROVIDER,
    reputation_score: 100,
    status: UserStatus.ACTIVE,
    created_at: now,
  },
  {
    id: 'usr-prv-02',
    email: 'thao.fnb@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Mai Thị Thảo (Chủ Quán FNB)',
    phone: '0907234567',
    role: Role.PROVIDER,
    reputation_score: 100,
    status: UserStatus.ACTIVE,
    created_at: now,
  },
  {
    id: 'usr-adm-01',
    email: 'admin@synchub.vn',
    password_hash: DEFAULT_PASSWORD_HASH,
    full_name: 'Nguyễn Minh Anh (System Admin)',
    phone: '0908234567',
    role: Role.ADMIN,
    reputation_score: 100,
    status: UserStatus.ACTIVE,
    created_at: now,
  },
];

export const INITIAL_PROVIDERS: ProviderRecord[] = [
  // 10 VENUE
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
  },

  // 15 FNB
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
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
    created_at: now,
  },
];

export const INITIAL_MENU_ITEMS: MenuItemRecord[] = [
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

export function generateInitialSlots(): SlotRecord[] {
  const slots: SlotRecord[] = [];

  // Slot ngày hôm nay cho prv-venue-01
  slots.push(
    {
      id: 'slt-01',
      provider_id: 'prv-venue-01',
      start_at: new Date(today.getTime() + 17 * 3600 * 1000),
      end_at: new Date(today.getTime() + 18 * 3600 * 1000),
      price: 100000,
      status: SlotStatus.BOOKED,
      locked_by: null,
      locked_until: null,
    },
    {
      id: 'slt-02',
      provider_id: 'prv-venue-01',
      start_at: new Date(today.getTime() + 18 * 3600 * 1000),
      end_at: new Date(today.getTime() + 19 * 3600 * 1000),
      price: 120000,
      status: SlotStatus.AVAILABLE,
      locked_by: null,
      locked_until: null,
    },
    {
      id: 'slt-03',
      provider_id: 'prv-venue-01',
      start_at: new Date(today.getTime() + 19 * 3600 * 1000),
      end_at: new Date(today.getTime() + 20 * 3600 * 1000),
      price: 120000,
      status: SlotStatus.LOCKED,
      locked_by: 'usr-host-01',
      locked_until: new Date(Date.now() + 10 * 60 * 1000),
    },
    {
      id: 'slt-04',
      provider_id: 'prv-venue-01',
      start_at: new Date(today.getTime() + 20 * 3600 * 1000),
      end_at: new Date(today.getTime() + 21 * 3600 * 1000),
      price: 120000,
      status: SlotStatus.AVAILABLE,
      locked_by: null,
      locked_until: null,
    },
    {
      id: 'slt-05',
      provider_id: 'prv-venue-01',
      start_at: new Date(today.getTime() + 21 * 3600 * 1000),
      end_at: new Date(today.getTime() + 22 * 3600 * 1000),
      price: 100000,
      status: SlotStatus.AVAILABLE,
      locked_by: null,
      locked_until: null,
    }
  );

  // Sinh slot 7 ngày cho 10 venues
  let slotCounter = 6;
  const timeFrames = [
    { startH: 7, endH: 9, priceOffset: -20000 },
    { startH: 9, endH: 11, priceOffset: -10000 },
    { startH: 15, endH: 17, priceOffset: 0 },
    { startH: 17, endH: 19, priceOffset: 20000 },
    { startH: 19, endH: 21, priceOffset: 30000 },
  ];

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const targetDate = new Date(today.getTime() + dayOffset * 24 * 3600 * 1000);

    for (const venue of INITIAL_PROVIDERS.filter((p) => p.type === ProviderType.VENUE)) {
      const basePrice =
        venue.category === 'badminton'
          ? 110000
          : venue.category === 'study_room'
          ? 90000
          : 220000;

      for (const tf of timeFrames) {
        const startAt = new Date(targetDate.getTime() + tf.startH * 3600 * 1000);
        const endAt = new Date(targetDate.getTime() + tf.endH * 3600 * 1000);

        slots.push({
          id: `slt-gen-${slotCounter++}`,
          provider_id: venue.id,
          start_at: startAt,
          end_at: endAt,
          price: basePrice + tf.priceOffset,
          status: SlotStatus.AVAILABLE,
          locked_by: null,
          locked_until: null,
        });
      }
    }
  }

  return slots;
}

export const INITIAL_SLOTS = generateInitialSlots();

export const INITIAL_VOUCHERS: VoucherRecord[] = [
  {
    id: 'vch-cross-15',
    code: 'SYNCHUBCROSS15',
    scope: VoucherScope.CROSS,
    discount_type: DiscountType.PERCENT,
    value: 15,
    max_discount: 30000,
    min_order: 80000,
    max_distance_m: 1000,
    valid_from: new Date(now.getTime() - 24 * 3600 * 1000),
    valid_to: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
    usage_limit: 500,
    used_count: 18,
  },
  {
    id: 'vch-fnb-20k',
    code: 'FNBLANGDH20K',
    scope: VoucherScope.FNB,
    discount_type: DiscountType.FIXED,
    value: 20000,
    max_discount: 20000,
    min_order: 80000,
    max_distance_m: 1000,
    valid_from: new Date(now.getTime() - 24 * 3600 * 1000),
    valid_to: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
    usage_limit: 300,
    used_count: 45,
  },
  {
    id: 'vch-venue-10',
    code: 'SANLANGDH10',
    scope: VoucherScope.VENUE,
    discount_type: DiscountType.PERCENT,
    value: 10,
    max_discount: 50000,
    min_order: 100000,
    max_distance_m: 1000,
    valid_from: new Date(now.getTime() - 24 * 3600 * 1000),
    valid_to: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
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
    valid_from: new Date(now.getTime() - 24 * 3600 * 1000),
    valid_to: new Date(now.getTime() + 30 * 24 * 3600 * 1000),
    usage_limit: 150,
    used_count: 8,
  },
];

export const INITIAL_LOBBY: GroupLobbyRecord = {
  id: 'lob-01',
  host_id: 'usr-host-01',
  slot_id: 'slt-03',
  fnb_provider_id: 'prv-fnb-01',
  invite_code: 'SYNC01',
  status: LobbyStatus.OPEN,
  deadline_at: new Date(Date.now() + 45 * 60 * 1000),
  ship_fee: 15000,
  voucher_id: 'vch-fnb-20k',
  locked_at: null,
  created_at: now,
};

export const INITIAL_MEMBERS: LobbyMemberRecord[] = [
  {
    lobby_id: 'lob-01',
    user_id: 'usr-host-01',
    deposit_required: 0,
    deposit_paid: 0,
    status: LobbyMemberStatus.JOINED,
    joined_at: new Date(now.getTime() - 20 * 60 * 1000),
  },
  {
    lobby_id: 'lob-01',
    user_id: 'usr-mem-02',
    deposit_required: 9000,
    deposit_paid: 9000,
    status: LobbyMemberStatus.JOINED,
    joined_at: new Date(now.getTime() - 15 * 60 * 1000),
  },
  {
    lobby_id: 'lob-01',
    user_id: 'usr-mem-03',
    deposit_required: 30000,
    deposit_paid: 30000,
    status: LobbyMemberStatus.JOINED,
    joined_at: new Date(now.getTime() - 10 * 60 * 1000),
  },
  {
    lobby_id: 'lob-01',
    user_id: 'usr-mem-04',
    deposit_required: 0,
    deposit_paid: 0,
    status: LobbyMemberStatus.JOINED,
    joined_at: new Date(now.getTime() - 5 * 60 * 1000),
  },
];

export const INITIAL_CART: CartItemRecord[] = [
  {
    id: 'crt-01',
    lobby_id: 'lob-01',
    user_id: 'usr-host-01',
    menu_item_id: 'mnu-01', // 25k
    qty: 1,
    unit_price_snapshot: 25000,
    created_at: now,
  },
  {
    id: 'crt-02',
    lobby_id: 'lob-01',
    user_id: 'usr-mem-02',
    menu_item_id: 'mnu-02', // 30k
    qty: 1,
    unit_price_snapshot: 30000,
    created_at: now,
  },
  {
    id: 'crt-03',
    lobby_id: 'lob-01',
    user_id: 'usr-mem-04',
    menu_item_id: 'mnu-03', // 45k
    qty: 1,
    unit_price_snapshot: 45000,
    created_at: now,
  },
];

export const INITIAL_ESCROW_TRANSACTIONS: EscrowTransactionRecord[] = [
  {
    id: 'esc-tx-01',
    lobby_id: 'lob-00-prev',
    split_bill_id: null,
    type: EscrowTxType.RELEASE,
    amount: 120000,
    platform_fee: 9600, // 8% của 120k
    net_amount: 110400,
    payee_provider_id: 'prv-venue-01',
    status: EscrowStatus.RELEASED,
    idempotency_key: 'release:lob-00-prev:prv-venue-01',
    created_at: new Date(now.getTime() - 24 * 3600 * 1000),
  },
  {
    id: 'esc-tx-02',
    lobby_id: 'lob-00-prev',
    split_bill_id: null,
    type: EscrowTxType.RELEASE,
    amount: 95000,
    platform_fee: 11400, // 12% của 95k
    net_amount: 83600,
    payee_provider_id: 'prv-fnb-01',
    status: EscrowStatus.RELEASED,
    idempotency_key: 'release:lob-00-prev:prv-fnb-01',
    created_at: new Date(now.getTime() - 24 * 3600 * 1000),
  },
  {
    id: 'esc-tx-penalty-01',
    lobby_id: 'lob-00-prev',
    split_bill_id: null,
    type: EscrowTxType.PENALTY,
    amount: 30000,
    platform_fee: 0,
    net_amount: 30000,
    payee_provider_id: 'prv-venue-01',
    status: EscrowStatus.RELEASED,
    idempotency_key: 'penalty:lob-00-prev:usr-flag-05',
    created_at: new Date(now.getTime() - 24 * 3600 * 1000),
  },
];

export const INITIAL_DISPUTES: DisputeRecord[] = [
  {
    id: 'dsp-01',
    lobby_id: 'lob-00-prev',
    reporter_id: 'usr-mem-02',
    target_provider_id: 'prv-fnb-01',
    reason: 'Quán giao thiếu 1 ly Trà đào cam sả so với giỏ hàng đã thanh toán',
    evidence_urls: [
      'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
    ],
    status: DisputeStatus.OPEN,
    refund_amount: 25000,
    resolved_by: null,
    resolved_at: null,
    created_at: new Date(now.getTime() - 20 * 3600 * 1000),
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'aud-01',
    actor_id: 'usr-host-01',
    action: 'LOBBY_CREATED',
    entity: 'group_lobbies',
    entity_id: 'lob-01',
    before: null,
    after: { invite_code: 'SYNC01', slot_id: 'slt-03', status: 'OPEN' },
    created_at: new Date(now.getTime() - 30 * 60 * 1000),
  },
  {
    id: 'aud-02',
    actor_id: 'usr-mem-03',
    action: 'REPUTATION_CHANGE',
    entity: 'users',
    entity_id: 'usr-mem-03',
    before: { reputation_score: 64 },
    after: { reputation_score: 64, deposit_required: 30000, rule: 'BR-REP-01' },
    created_at: new Date(now.getTime() - 25 * 60 * 1000),
  },
  {
    id: 'aud-03',
    actor_id: 'usr-adm-01',
    action: 'DISPUTE_FREEZE',
    entity: 'escrow_transactions',
    entity_id: 'esc-tx-02',
    before: { status: 'HELD' },
    after: { status: 'FROZEN', reason: 'Dispute dsp-01 opened against prv-fnb-01' },
    created_at: new Date(now.getTime() - 19 * 3600 * 1000),
  },
];
