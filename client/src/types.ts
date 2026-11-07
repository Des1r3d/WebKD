export const Role = {
  HOST: 'HOST',
  MEMBER: 'MEMBER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  FLAGGED: 'FLAGGED',
  BANNED: 'BANNED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ProviderType = {
  VENUE: 'VENUE',
  FNB: 'FNB',
} as const;
export type ProviderType = (typeof ProviderType)[keyof typeof ProviderType];

export const SlotStatus = {
  AVAILABLE: 'AVAILABLE',
  LOCKED: 'LOCKED',
  BOOKED: 'BOOKED',
} as const;
export type SlotStatus = (typeof SlotStatus)[keyof typeof SlotStatus];

export const LobbyStatus = {
  OPEN: 'OPEN',
  LOCKED: 'LOCKED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  DISPUTED: 'DISPUTED',
  CANCELLED: 'CANCELLED',
} as const;
export type LobbyStatus = (typeof LobbyStatus)[keyof typeof LobbyStatus];

export const LobbyMemberStatus = {
  JOINED: 'JOINED',
  LEFT: 'LEFT',
  NO_SHOW: 'NO_SHOW',
  CHECKED_IN: 'CHECKED_IN',
} as const;
export type LobbyMemberStatus = (typeof LobbyMemberStatus)[keyof typeof LobbyMemberStatus];

export const VoucherScope = {
  VENUE: 'VENUE',
  FNB: 'FNB',
  CROSS: 'CROSS',
} as const;
export type VoucherScope = (typeof VoucherScope)[keyof typeof VoucherScope];

export const DiscountType = {
  PERCENT: 'PERCENT',
  FIXED: 'FIXED',
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const SplitBillStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const;
export type SplitBillStatus = (typeof SplitBillStatus)[keyof typeof SplitBillStatus];

export const EscrowTxType = {
  HOLD: 'HOLD',
  RELEASE: 'RELEASE',
  REFUND: 'REFUND',
  PENALTY: 'PENALTY',
} as const;
export type EscrowTxType = (typeof EscrowTxType)[keyof typeof EscrowTxType];

export const EscrowStatus = {
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  FROZEN: 'FROZEN',
} as const;
export type EscrowStatus = (typeof EscrowStatus)[keyof typeof EscrowStatus];

export const DisputeStatus = {
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: Role;
  reputation_score: number;
  status: UserStatus;
}

export interface Provider {
  id: string;
  owner_id: string;
  type: ProviderType;
  category: 'badminton' | 'study_room' | 'football' | 'milk_tea' | 'coffee' | 'snack';
  name: string;
  address: string;
  lat: number;
  lng: number;
  open_hours: string;
  bank_code: string;
  bank_account: string;
  commission_rate: number;
  distance_m?: number;
  rating?: number;
  min_price?: number;
  has_cross_voucher?: boolean;
}

export interface Slot {
  id: string;
  provider_id: string;
  start_at: string;
  end_at: string;
  price: number;
  status: SlotStatus;
  locked_by?: string | null;
  locked_until?: string | null;
}

export interface MenuItem {
  id: string;
  provider_id: string;
  name: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  order_count: number;
}

export interface GroupLobby {
  id: string;
  host_id: string;
  slot_id: string;
  fnb_provider_id?: string | null;
  invite_code: string;
  status: LobbyStatus;
  deadline_at: string;
  ship_fee: number;
  voucher_id?: string | null;
  locked_at?: string | null;
}

export interface LobbyMember {
  lobby_id: string;
  user_id: string;
  full_name: string;
  reputation_score: number;
  is_host?: boolean;
  deposit_required: number;
  deposit_paid: number;
  status: LobbyMemberStatus;
}

export interface CartItem {
  id: string;
  lobby_id: string;
  user_id: string;
  user_name: string;
  menu_item_id: string;
  item_name: string;
  qty: number;
  unit_price_snapshot: number;
}

export interface Voucher {
  id: string;
  code: string;
  scope: VoucherScope;
  discount_type: DiscountType;
  value: number;
  max_discount: number;
  min_order: number;
  max_distance_m: number;
}

export interface SplitBill {
  id: string;
  lobby_id: string;
  user_id: string;
  user_name: string;
  is_host?: boolean;
  slot_share: number;
  food_amount: number;
  ship_share: number;
  discount_share: number;
  deposit_offset: number;
  total: number;
  vietqr_url: string;
  status: SplitBillStatus;
}

export interface EscrowTransaction {
  id: string;
  lobby_id: string;
  split_bill_id?: string | null;
  type: EscrowTxType;
  amount: number;
  platform_fee: number;
  net_amount: number;
  payee_provider_id?: string | null;
  payee_name?: string;
  status: EscrowStatus;
  idempotency_key: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  lobby_id: string;
  reporter_id: string;
  reporter_name: string;
  target_provider_id: string;
  target_provider_name: string;
  reason: string;
  evidence_urls: string[];
  status: DisputeStatus;
  refund_amount: number;
  resolved_by?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_name: string;
  action: string;
  entity: string;
  entity_id: string;
  detail: string;
  created_at: string;
}
