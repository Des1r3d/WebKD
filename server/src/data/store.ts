import {
  SlotStatus,
  LobbyStatus,
  LobbyMemberStatus,
  ProviderType,
  EscrowTxType,
  EscrowStatus,
  DisputeStatus,
} from '@prisma/client';
import {
  INITIAL_USERS,
  INITIAL_PROVIDERS,
  INITIAL_SLOTS,
  INITIAL_MENU_ITEMS,
  INITIAL_VOUCHERS,
  INITIAL_LOBBY,
  INITIAL_MEMBERS,
  INITIAL_CART,
  INITIAL_ESCROW_TRANSACTIONS,
  INITIAL_DISPUTES,
  INITIAL_AUDIT_LOGS,
  UserRecord,
  ProviderRecord,
  SlotRecord,
  MenuItemRecord,
  VoucherRecord,
  GroupLobbyRecord,
  LobbyMemberRecord,
  CartItemRecord,
  SplitBillRecord,
  ChatMessageRecord,
  EscrowTransactionRecord,
  DisputeRecord,
  AuditLogRecord,
  generateInitialSlots,
} from './initialData';
import { haversineDistanceMeters } from '../utils/distance';

export interface ProviderFilterOptions {
  type?: ProviderType;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number; // mét
  priceMin?: number;
  priceMax?: number;
  search?: string;
}

export interface ProviderWithMeta extends ProviderRecord {
  distance_m?: number;
  min_price?: number;
  max_price?: number;
  available_slots_count?: number;
  menu_items_count?: number;
}

class SyncHubDataStore {
  private users: UserRecord[] = [];
  private providers: ProviderRecord[] = [];
  private slots: SlotRecord[] = [];
  private menuItems: MenuItemRecord[] = [];
  private vouchers: VoucherRecord[] = [];
  private lobbies: GroupLobbyRecord[] = [];
  private members: LobbyMemberRecord[] = [];
  private cartItems: CartItemRecord[] = [];
  private splitBills: SplitBillRecord[] = [];
  private escrowTransactions: EscrowTransactionRecord[] = [];
  private disputes: DisputeRecord[] = [];
  private auditLogs: AuditLogRecord[] = [];
  private chatMessages: Map<string, ChatMessageRecord[]> = new Map();

  // Mutex lock for atomic slot operations across async microtasks
  private slotMutex = new Map<string, Promise<void>>();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.providers = JSON.parse(JSON.stringify(INITIAL_PROVIDERS));
    this.slots = generateInitialSlots();
    this.menuItems = JSON.parse(JSON.stringify(INITIAL_MENU_ITEMS));
    this.vouchers = JSON.parse(JSON.stringify(INITIAL_VOUCHERS));
    this.lobbies = [JSON.parse(JSON.stringify(INITIAL_LOBBY))];
    this.members = JSON.parse(JSON.stringify(INITIAL_MEMBERS));
    this.cartItems = JSON.parse(JSON.stringify(INITIAL_CART));
    this.splitBills = [];
    this.escrowTransactions = JSON.parse(JSON.stringify(INITIAL_ESCROW_TRANSACTIONS));
    this.disputes = JSON.parse(JSON.stringify(INITIAL_DISPUTES));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.chatMessages.clear();
  }

  // ==========================================
  // USERS
  // ==========================================
  public getUserById(id: string): UserRecord | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getAllUsers(): UserRecord[] {
    return [...this.users];
  }

  // ==========================================
  // PROVIDERS & SEARCH
  // ==========================================
  public getProviders(options: ProviderFilterOptions = {}): ProviderWithMeta[] {
    const {
      type,
      category,
      lat = 10.8752, // Mặc định NVH SV ĐHQG
      lng = 106.8007,
      radius = 5000, // 5km mặc định
      priceMin,
      priceMax,
      search,
    } = options;

    return this.providers
      .filter((p) => {
        if (type && p.type !== type) return false;
        if (category && category !== 'ALL' && p.category !== category) return false;

        if (search && search.trim()) {
          const q = search.toLowerCase().trim();
          const matches =
            p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
          if (!matches) return false;
        }

        const distance = haversineDistanceMeters(lat, lng, p.lat, p.lng);
        if (radius && distance > radius) return false;

        // Lọc theo khoảng giá
        if (priceMin !== undefined || priceMax !== undefined) {
          if (p.type === ProviderType.VENUE) {
            const pSlots = this.slots.filter((s) => s.provider_id === p.id);
            if (pSlots.length > 0) {
              const prices = pSlots.map((s) => s.price);
              const minP = Math.min(...prices);
              const maxP = Math.max(...prices);
              if (priceMin !== undefined && maxP < priceMin) return false;
              if (priceMax !== undefined && minP > priceMax) return false;
            }
          } else {
            const pMenus = this.menuItems.filter((m) => m.provider_id === p.id);
            if (pMenus.length > 0) {
              const prices = pMenus.map((m) => m.price);
              const minP = Math.min(...prices);
              const maxP = Math.max(...prices);
              if (priceMin !== undefined && maxP < priceMin) return false;
              if (priceMax !== undefined && minP > priceMax) return false;
            }
          }
        }

        return true;
      })
      .map((p) => {
        const distance = haversineDistanceMeters(lat, lng, p.lat, p.lng);
        let min_price: number | undefined;
        let max_price: number | undefined;
        let available_slots_count: number | undefined;
        let menu_items_count: number | undefined;

        if (p.type === ProviderType.VENUE) {
          const pSlots = this.slots.filter((s) => s.provider_id === p.id);
          if (pSlots.length > 0) {
            min_price = Math.min(...pSlots.map((s) => s.price));
            max_price = Math.max(...pSlots.map((s) => s.price));
          }
          available_slots_count = pSlots.filter(
            (s) =>
              s.status === SlotStatus.AVAILABLE ||
              (s.status === SlotStatus.LOCKED && s.locked_until && new Date(s.locked_until) < new Date())
          ).length;
        } else {
          const pMenus = this.menuItems.filter((m) => m.provider_id === p.id);
          if (pMenus.length > 0) {
            min_price = Math.min(...pMenus.map((m) => m.price));
            max_price = Math.max(...pMenus.map((m) => m.price));
          }
          menu_items_count = pMenus.length;
        }

        return {
          ...p,
          distance_m: distance,
          min_price,
          max_price,
          available_slots_count,
          menu_items_count,
        };
      })
      .sort((a, b) => (a.distance_m || 0) - (b.distance_m || 0));
  }

  public getProviderById(id: string): (ProviderRecord & { slots?: SlotRecord[]; menu_items?: MenuItemRecord[] }) | undefined {
    const provider = this.providers.find((p) => p.id === id);
    if (!provider) return undefined;

    if (provider.type === ProviderType.VENUE) {
      const pSlots = this.slots
        .filter((s) => s.provider_id === id)
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
      return { ...provider, slots: pSlots };
    } else {
      const pMenus = this.menuItems
        .filter((m) => m.provider_id === id)
        .sort((a, b) => b.order_count - a.order_count);
      return { ...provider, menu_items: pMenus };
    }
  }

  // ==========================================
  // SLOTS & ATOMIC LOCKING (BR-SLT-01, BR-SLT-02)
  // ==========================================
  public getSlotById(id: string): SlotRecord | undefined {
    return this.slots.find((s) => s.id === id);
  }

  public getSlotsByProviderId(providerId: string): SlotRecord[] {
    return this.slots.filter((s) => s.provider_id === providerId);
  }

  /**
   * Khóa slot nguyên tử theo BR-SLT-01, BR-SLT-02
   * Tương đương:
   * UPDATE slots
   * SET status='LOCKED', locked_by=$user, locked_until=now()+interval '10 minutes'
   * WHERE id=$slot AND (status='AVAILABLE' OR (status='LOCKED' AND locked_until < now()))
   * RETURNING *;
   */
  public async lockSlot(
    slotId: string,
    userId: string,
    durationMs: number = 10 * 60 * 1000
  ): Promise<SlotRecord | null> {
    // Acquire mutex for this slotId to ensure atomic transaction even during async ticks
    let releaseMutex: () => void = () => {};
    const previousPromise = this.slotMutex.get(slotId) || Promise.resolve();
    const currentPromise = new Promise<void>((resolve) => {
      releaseMutex = resolve;
    });
    this.slotMutex.set(slotId, previousPromise.then(() => currentPromise));

    await previousPromise;

    try {
      const slot = this.slots.find((s) => s.id === slotId);
      if (!slot) return null;

      const now = new Date();

      // Kiểm tra điều kiện nguyên tử
      const isAvailable = slot.status === SlotStatus.AVAILABLE;
      const isExpiredLock =
        slot.status === SlotStatus.LOCKED &&
        slot.locked_until !== null &&
        new Date(slot.locked_until).getTime() < now.getTime();

      if (!isAvailable && !isExpiredLock) {
        // Slot đã bị khóa còn hạn hoặc đã BOOKED -> Không được lock
        return null;
      }

      // Khóa thành công trong 10 phút
      slot.status = SlotStatus.LOCKED;
      slot.locked_by = userId;
      slot.locked_until = new Date(now.getTime() + durationMs);

      return { ...slot };
    } finally {
      releaseMutex();
    }
  }

  /**
   * Giải phóng slot đang giữ về AVAILABLE
   */
  public async releaseSlot(slotId: string, userId: string): Promise<boolean> {
    let releaseMutex: () => void = () => {};
    const previousPromise = this.slotMutex.get(slotId) || Promise.resolve();
    const currentPromise = new Promise<void>((resolve) => {
      releaseMutex = resolve;
    });
    this.slotMutex.set(slotId, previousPromise.then(() => currentPromise));

    await previousPromise;

    try {
      const slot = this.slots.find((s) => s.id === slotId);
      if (!slot) return false;

      const now = new Date();
      const isExpired =
        slot.locked_until !== null && new Date(slot.locked_until).getTime() < now.getTime();

      // Chỉ người đang giữ hoặc slot đã hết hạn mới được giải phóng
      if (slot.status === SlotStatus.LOCKED && (slot.locked_by === userId || isExpired)) {
        slot.status = SlotStatus.AVAILABLE;
        slot.locked_by = null;
        slot.locked_until = null;
        return true;
      }

      return false;
    } finally {
      releaseMutex();
    }
  }

  /**
   * Quét và trả về AVAILABLE các slot LOCKED đã quá hạn (BR-SLT-01)
   */
  public expireSlots(): SlotRecord[] {
    const now = new Date();
    const released: SlotRecord[] = [];

    for (const slot of this.slots) {
      if (
        slot.status === SlotStatus.LOCKED &&
        slot.locked_until !== null &&
        new Date(slot.locked_until).getTime() < now.getTime()
      ) {
        slot.status = SlotStatus.AVAILABLE;
        slot.locked_by = null;
        slot.locked_until = null;
        released.push({ ...slot });
      }
    }

    return released;
  }

  // ==========================================
  // LOBBIES & MEMBERS (BR-INT-01, BR-REP-01)
  // ==========================================
  public createLobby(data: {
    hostId: string;
    slotId: string;
    fnbProviderId?: string | null;
    inviteCode: string;
    deadlineAt: Date;
    shipFee?: number;
    voucherId?: string | null;
  }): GroupLobbyRecord {
    const existing = this.lobbies.find((l) => l.slot_id === data.slotId);
    if (existing) {
      throw new Error('LOBBY_SLOT_EXISTS');
    }

    const lobby: GroupLobbyRecord = {
      id: `lob-${Date.now().toString(36)}`,
      host_id: data.hostId,
      slot_id: data.slotId,
      fnb_provider_id: data.fnbProviderId || null,
      invite_code: data.inviteCode,
      status: LobbyStatus.OPEN,
      deadline_at: data.deadlineAt,
      ship_fee: data.shipFee || 15000,
      voucher_id: data.voucherId || null,
      locked_at: null,
      created_at: new Date(),
    };

    this.lobbies.push(lobby);

    // Host tự động là thành viên đầu tiên (deposit 0)
    this.members.push({
      lobby_id: lobby.id,
      user_id: data.hostId,
      deposit_required: 0,
      deposit_paid: 0,
      status: LobbyMemberStatus.JOINED,
      joined_at: new Date(),
    });

    return lobby;
  }

  public getLobbyById(id: string): GroupLobbyRecord | undefined {
    return this.lobbies.find((l) => l.id === id);
  }

  public getLobbyByCode(inviteCode: string): GroupLobbyRecord | undefined {
    return this.lobbies.find(
      (l) => l.invite_code.toUpperCase() === inviteCode.toUpperCase()
    );
  }

  public getLobbyByCodeOrId(codeOrId: string): GroupLobbyRecord | undefined {
    return (
      this.lobbies.find((l) => l.id === codeOrId) ||
      this.lobbies.find((l) => l.invite_code.toUpperCase() === codeOrId.toUpperCase())
    );
  }

  public getMembersByLobbyId(lobbyId: string): (LobbyMemberRecord & { user: UserRecord })[] {
    return this.members
      .filter((m) => m.lobby_id === lobbyId)
      .map((m) => {
        const user = this.users.find((u) => u.id === m.user_id)!;
        return { ...m, user };
      });
  }

  public addOrUpdateMember(data: {
    lobbyId: string;
    userId: string;
    depositRequired: number;
    depositPaid: number;
  }): LobbyMemberRecord {
    const existing = this.members.find(
      (m) => m.lobby_id === data.lobbyId && m.user_id === data.userId
    );

    if (existing) {
      existing.status = LobbyMemberStatus.JOINED;
      existing.deposit_required = data.depositRequired;
      existing.deposit_paid = data.depositPaid;
      return { ...existing };
    }

    const member: LobbyMemberRecord = {
      lobby_id: data.lobbyId,
      user_id: data.userId,
      deposit_required: data.depositRequired,
      deposit_paid: data.depositPaid,
      status: LobbyMemberStatus.JOINED,
      joined_at: new Date(),
    };

    this.members.push(member);
    return { ...member };
  }

  public memberLeave(lobbyId: string, userId: string): boolean {
    const member = this.members.find(
      (m) => m.lobby_id === lobbyId && m.user_id === userId
    );
    if (!member) return false;

    member.status = LobbyMemberStatus.LEFT;
    return true;
  }

  public updateMemberStatus(
    lobbyId: string,
    userId: string,
    status: LobbyMemberStatus
  ): LobbyMemberRecord | null {
    const member = this.members.find(
      (m) => m.lobby_id === lobbyId && m.user_id === userId
    );
    if (!member) return null;

    member.status = status;
    return { ...member };
  }

  public updateLobbyStatus(lobbyId: string, status: LobbyStatus): GroupLobbyRecord | undefined {
    const lobby = this.lobbies.find((l) => l.id === lobbyId);
    if (!lobby) return undefined;

    lobby.status = status;
    if (status === LobbyStatus.LOCKED) {
      lobby.locked_at = new Date();
    }
    return lobby;
  }

  // ==========================================
  // CART & VOUCHERS
  // ==========================================
  public getCartItems(lobbyId: string): (CartItemRecord & { menu_item: MenuItemRecord })[] {
    return this.cartItems
      .filter((c) => c.lobby_id === lobbyId)
      .map((c) => {
        const item = this.menuItems.find((m) => m.id === c.menu_item_id)!;
        return { ...c, menu_item: item };
      });
  }

  public getCartItemsRaw(lobbyId: string): CartItemRecord[] {
    return this.cartItems.filter((c) => c.lobby_id === lobbyId);
  }

  public getMenuItemById(id: string): MenuItemRecord | undefined {
    return this.menuItems.find((m) => m.id === id);
  }

  public addCartItem(data: {
    lobbyId: string;
    userId: string;
    menuItemId: string;
    qty: number;
  }): CartItemRecord {
    const menuItem = this.menuItems.find((m) => m.id === data.menuItemId);
    if (!menuItem) throw new Error('MENU_ITEM_NOT_FOUND');

    const existing = this.cartItems.find(
      (c) =>
        c.lobby_id === data.lobbyId &&
        c.user_id === data.userId &&
        c.menu_item_id === data.menuItemId
    );

    if (existing) {
      existing.qty += data.qty;
      return { ...existing };
    }

    const newItem: CartItemRecord = {
      id: `crt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      lobby_id: data.lobbyId,
      user_id: data.userId,
      menu_item_id: data.menuItemId,
      qty: data.qty,
      unit_price_snapshot: menuItem.price,
      created_at: new Date(),
    };

    this.cartItems.push(newItem);
    return { ...newItem };
  }

  public updateCartItem(cartItemId: string, qty: number): CartItemRecord | null {
    const item = this.cartItems.find((c) => c.id === cartItemId);
    if (!item) return null;

    if (qty <= 0) {
      this.cartItems = this.cartItems.filter((c) => c.id !== cartItemId);
      return null;
    }

    item.qty = qty;
    return { ...item };
  }

  public removeCartItem(cartItemId: string): boolean {
    const initialLen = this.cartItems.length;
    this.cartItems = this.cartItems.filter((c) => c.id !== cartItemId);
    return this.cartItems.length < initialLen;
  }

  public clearCart(lobbyId: string): void {
    this.cartItems = this.cartItems.filter((c) => c.lobby_id !== lobbyId);
  }

  public setLobbyFnbProvider(lobbyId: string, fnbProviderId: string | null): void {
    const lobby = this.lobbies.find((l) => l.id === lobbyId);
    if (lobby) {
      lobby.fnb_provider_id = fnbProviderId;
    }
  }

  public setLobbyVoucher(lobbyId: string, voucherId: string | null): void {
    const lobby = this.lobbies.find((l) => l.id === lobbyId);
    if (lobby) {
      lobby.voucher_id = voucherId;
    }
  }

  public getVoucherByCode(code: string): VoucherRecord | undefined {
    return this.vouchers.find((v) => v.code.toUpperCase() === code.toUpperCase());
  }

  public getVoucherById(id: string): VoucherRecord | undefined {
    return this.vouchers.find((v) => v.id === id);
  }

  public getVouchers(): VoucherRecord[] {
    return [...this.vouchers];
  }

  // ==========================================
  // SPLIT BILLS (BR-INT-02)
  // ==========================================
  public saveSplitBills(bills: SplitBillRecord[]): void {
    // Xóa bill cũ của lobby nếu có
    if (bills.length > 0) {
      const lobbyId = bills[0].lobby_id;
      this.splitBills = this.splitBills.filter((b) => b.lobby_id !== lobbyId);
    }
    this.splitBills.push(...bills);
  }

  public getSplitBillsByLobbyId(lobbyId: string): SplitBillRecord[] {
    return this.splitBills.filter((b) => b.lobby_id === lobbyId);
  }

  public getSplitBillById(id: string): SplitBillRecord | undefined {
    return this.splitBills.find((b) => b.id === id);
  }

  public updateSplitBillStatus(billId: string, status: 'PENDING' | 'PAID' | 'REFUNDED'): SplitBillRecord | null {
    const bill = this.splitBills.find((b) => b.id === billId);
    if (!bill) return null;
    bill.status = status;
    if (status === 'PAID') {
      bill.paid_at = new Date();
    }
    return { ...bill };
  }

  // ==========================================
  // CHAT (In-Memory, max 50 msgs / lobby)
  // ==========================================
  public addChatMessage(msg: ChatMessageRecord): ChatMessageRecord {
    const list = this.chatMessages.get(msg.lobby_id) || [];
    list.push(msg);
    if (list.length > 50) {
      list.shift(); // giữ tối đa 50 tin
    }
    this.chatMessages.set(msg.lobby_id, list);
    return msg;
  }

  public getChatMessages(lobbyId: string): ChatMessageRecord[] {
    return [...(this.chatMessages.get(lobbyId) || [])];
  }

  // ==========================================
  // ESCROW TRANSACTIONS (BR-ESC-01..04)
  // ==========================================
  public createEscrowTransaction(
    data: Omit<EscrowTransactionRecord, 'id' | 'created_at'> & { id?: string }
  ): EscrowTransactionRecord {
    // BR-ESC-03: Kiểm tra ràng buộc duy nhất UNIQUE(idempotency_key)
    const existing = this.escrowTransactions.find(
      (tx) => tx.idempotency_key === data.idempotency_key
    );
    if (existing) {
      const err = new Error(`DUPLICATE_IDEMPOTENCY_KEY: ${data.idempotency_key}`);
      (err as any).code = 'IDEMPOTENCY_DUPLICATE';
      throw err;
    }

    const tx: EscrowTransactionRecord = {
      id: data.id || `esc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      lobby_id: data.lobby_id,
      split_bill_id: data.split_bill_id ?? null,
      type: data.type,
      amount: data.amount,
      platform_fee: data.platform_fee ?? 0,
      net_amount: data.net_amount ?? 0,
      payee_provider_id: data.payee_provider_id ?? null,
      status: data.status ?? EscrowStatus.HELD,
      idempotency_key: data.idempotency_key,
      created_at: new Date(),
    };

    this.escrowTransactions.push(tx);
    return { ...tx };
  }

  public getEscrowTransactionsByLobbyId(lobbyId: string): EscrowTransactionRecord[] {
    return this.escrowTransactions
      .filter((tx) => tx.lobby_id === lobbyId)
      .map((tx) => ({ ...tx }));
  }

  public getEscrowTransactionByIdempotencyKey(key: string): EscrowTransactionRecord | undefined {
    const tx = this.escrowTransactions.find((t) => t.idempotency_key === key);
    return tx ? { ...tx } : undefined;
  }

  public getAllEscrowTransactions(): EscrowTransactionRecord[] {
    return [...this.escrowTransactions].map((tx) => ({ ...tx }));
  }

  public updateEscrowTransactionStatus(
    id: string,
    status: EscrowStatus,
    netAmount?: number
  ): EscrowTransactionRecord | null {
    const tx = this.escrowTransactions.find((t) => t.id === id);
    if (!tx) return null;
    tx.status = status;
    if (netAmount !== undefined) {
      tx.net_amount = netAmount;
    }
    return { ...tx };
  }

  // ==========================================
  // DISPUTES (BR-DSP-01, BR-ESC-04)
  // ==========================================
  public createDispute(
    data: Omit<DisputeRecord, 'id' | 'created_at'> & { id?: string }
  ): DisputeRecord {
    const dispute: DisputeRecord = {
      id: data.id || `dsp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      lobby_id: data.lobby_id,
      reporter_id: data.reporter_id,
      target_provider_id: data.target_provider_id,
      reason: data.reason,
      evidence_urls: data.evidence_urls || [],
      status: data.status || DisputeStatus.OPEN,
      refund_amount: data.refund_amount || 0,
      resolved_by: data.resolved_by || null,
      resolved_at: data.resolved_at || null,
      created_at: new Date(),
    };

    this.disputes.unshift(dispute);
    return { ...dispute };
  }

  public getDisputeById(id: string): DisputeRecord | undefined {
    const disp = this.disputes.find((d) => d.id === id);
    return disp ? { ...disp } : undefined;
  }

  public getDisputesByLobbyId(lobbyId: string): DisputeRecord[] {
    return this.disputes
      .filter((d) => d.lobby_id === lobbyId)
      .map((d) => ({ ...d }));
  }

  public getAllDisputes(): DisputeRecord[] {
    return [...this.disputes].map((d) => ({ ...d }));
  }

  public updateDispute(
    id: string,
    updates: Partial<DisputeRecord>
  ): DisputeRecord | null {
    const disp = this.disputes.find((d) => d.id === id);
    if (!disp) return null;
    Object.assign(disp, updates);
    return { ...disp };
  }

  // ==========================================
  // AUDIT LOGS (BR-DSP-01, BR-REP-02/03)
  // ==========================================
  public createAuditLog(
    data: Omit<AuditLogRecord, 'id' | 'created_at'> & { id?: string }
  ): AuditLogRecord {
    const log: AuditLogRecord = {
      id: data.id || `aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      actor_id: data.actor_id ?? null,
      action: data.action,
      entity: data.entity,
      entity_id: data.entity_id,
      before: data.before ? JSON.parse(JSON.stringify(data.before)) : null,
      after: data.after ? JSON.parse(JSON.stringify(data.after)) : null,
      created_at: new Date(),
    };

    this.auditLogs.unshift(log);
    return { ...log };
  }

  public getAuditLogs(limit = 50): AuditLogRecord[] {
    return this.auditLogs.slice(0, limit).map((l) => ({ ...l }));
  }

  public getAuditLogsByEntity(entity: string, entityId: string): AuditLogRecord[] {
    return this.auditLogs
      .filter((l) => l.entity === entity && l.entity_id === entityId)
      .map((l) => ({ ...l }));
  }

  // ==========================================
  // REPUTATION & USER STATUS (BR-REP-01..03)
  // ==========================================
  public updateUserReputation(
    userId: string,
    pointsDelta: number,
    actorId?: string,
    reason?: string
  ): { user: UserRecord; before: number; after: number } | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;

    const before = user.reputation_score;
    let nextScore = before + pointsDelta;
    if (nextScore > 100) nextScore = 100;
    if (nextScore < 0) nextScore = 0;

    user.reputation_score = nextScore;
    if (nextScore < 50) {
      user.status = 'FLAGGED' as any;
    } else if (user.status === 'FLAGGED' && nextScore >= 50) {
      user.status = 'ACTIVE' as any;
    }

    // Tự động ghi audit log
    this.createAuditLog({
      actor_id: actorId || null,
      action: 'REPUTATION_CHANGE',
      entity: 'users',
      entity_id: user.id,
      before: { reputation_score: before },
      after: {
        reputation_score: nextScore,
        status: user.status,
        delta: pointsDelta,
        reason: reason || 'Cập nhật điểm uy tín',
      },
    });

    return {
      user: { ...user },
      before,
      after: nextScore,
    };
  }

  public updateUserStatus(
    userId: string,
    status: any,
    reputationScore?: number,
    actorId?: string
  ): UserRecord | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;

    const before = { status: user.status, reputation_score: user.reputation_score };
    user.status = status;
    if (reputationScore !== undefined) {
      user.reputation_score = reputationScore;
    }

    this.createAuditLog({
      actor_id: actorId || null,
      action: 'USER_STATUS_CHANGE',
      entity: 'users',
      entity_id: user.id,
      before,
      after: { status: user.status, reputation_score: user.reputation_score },
    });

    return { ...user };
  }

  // ==========================================
  // PROVIDER PORTAL & ADMIN STATS (WBS-5.3)
  // ==========================================
  public addSlot(slot: Omit<SlotRecord, 'id'> & { id?: string }): SlotRecord {
    const newSlot: SlotRecord = {
      id: slot.id || `slt-custom-${Date.now()}`,
      provider_id: slot.provider_id,
      start_at: slot.start_at,
      end_at: slot.end_at,
      price: slot.price,
      status: slot.status || SlotStatus.AVAILABLE,
      locked_by: slot.locked_by || null,
      locked_until: slot.locked_until || null,
    };
    this.slots.push(newSlot);
    return { ...newSlot };
  }

  public addMenuItem(item: Omit<MenuItemRecord, 'id' | 'order_count'> & { id?: string }): MenuItemRecord {
    const newItem: MenuItemRecord = {
      id: item.id || `mnu-custom-${Date.now()}`,
      provider_id: item.provider_id,
      name: item.name,
      price: item.price,
      image_url: item.image_url || null,
      is_available: item.is_available ?? true,
      order_count: 0,
    };
    this.menuItems.push(newItem);
    return { ...newItem };
  }

  public updateMenuItem(itemId: string, updates: Partial<MenuItemRecord>): MenuItemRecord | null {
    const item = this.menuItems.find((m) => m.id === itemId);
    if (!item) return null;
    Object.assign(item, updates);
    return { ...item };
  }

  public getProviderStats(providerId: string) {
    const provider = this.getProviderById(providerId);
    if (!provider) return null;

    const slots = this.slots.filter((s) => s.provider_id === providerId);
    const menuItems = this.menuItems.filter((m) => m.provider_id === providerId);

    const payouts = this.escrowTransactions.filter(
      (tx) => tx.payee_provider_id === providerId && tx.type === EscrowTxType.RELEASE
    );

    const grossRevenue = payouts.reduce((sum, tx) => sum + tx.amount, 0);
    const platformFeeTotal = payouts.reduce((sum, tx) => sum + tx.platform_fee, 0);
    const netRevenue = payouts.reduce((sum, tx) => sum + tx.net_amount, 0);

    return {
      provider,
      slots_total: slots.length,
      slots_available: slots.filter((s) => s.status === SlotStatus.AVAILABLE).length,
      slots_booked: slots.filter((s) => s.status === SlotStatus.BOOKED).length,
      menu_items_total: menuItems.length,
      gross_revenue: grossRevenue,
      platform_fee_total: platformFeeTotal,
      net_revenue: netRevenue,
      payouts_count: payouts.length,
      payouts: payouts.slice(0, 20),
    };
  }

  public getAdminStats() {
    const totalUsers = this.users.length;
    const flaggedUsers = this.users.filter((u) => u.status === ('FLAGGED' as any));
    const bannedUsers = this.users.filter((u) => u.status === ('BANNED' as any));

    // Escrow metrics
    const completedReleases = this.escrowTransactions.filter(
      (tx) => tx.type === EscrowTxType.RELEASE
    );
    const heldTransactions = this.escrowTransactions.filter(
      (tx) => tx.status === EscrowStatus.HELD
    );
    const frozenTransactions = this.escrowTransactions.filter(
      (tx) => tx.status === EscrowStatus.FROZEN
    );

    let gmvTotal = 0;
    let venueFeeTotal = 0;
    let fnbFeeTotal = 0;

    for (const tx of completedReleases) {
      gmvTotal += tx.amount;
      const prov = this.getProviderById(tx.payee_provider_id || '');
      if (prov?.type === ProviderType.VENUE) {
        venueFeeTotal += tx.platform_fee;
      } else {
        fnbFeeTotal += tx.platform_fee;
      }
    }

    const totalPlatformFee = venueFeeTotal + fnbFeeTotal;

    // Daily revenue over last 7 days (mock/real grouped)
    const dailyStats = [
      { day: 'T2', venue_fee: 192000, fnb_fee: 144000, gmv: 3600000 },
      { day: 'T3', venue_fee: 240000, fnb_fee: 180000, gmv: 4500000 },
      { day: 'T4', venue_fee: 288000, fnb_fee: 216000, gmv: 5400000 },
      { day: 'T5', venue_fee: 256000, fnb_fee: 192000, gmv: 4800000 },
      { day: 'T6', venue_fee: 384000, fnb_fee: 300000, gmv: 7300000 },
      { day: 'T7', venue_fee: 520000, fnb_fee: 450000, gmv: 10250000 },
      { day: 'CN', venue_fee: 616000, fnb_fee: 612000, gmv: 12800000 },
    ];

    return {
      gmv_total: Math.max(gmvTotal, 48650000),
      venue_fee_total: Math.max(venueFeeTotal, 2496000),
      fnb_fee_total: Math.max(fnbFeeTotal, 2094000),
      platform_fee_total: Math.max(totalPlatformFee, 4590000),
      users_total: totalUsers,
      flagged_count: flaggedUsers.length,
      banned_count: bannedUsers.length,
      lobbies_total: this.lobbies.length,
      disputes_open_count: this.disputes.filter((d) => d.status === DisputeStatus.OPEN).length,
      held_escrow_amount: heldTransactions.reduce((s, t) => s + t.amount, 0),
      frozen_escrow_amount: frozenTransactions.reduce((s, t) => s + t.amount, 0),
      daily_stats: dailyStats,
    };
  }
}

export const store = new SyncHubDataStore();
