-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HOST', 'MEMBER', 'PROVIDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'FLAGGED', 'BANNED');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('VENUE', 'FNB');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED');

-- CreateEnum
CREATE TYPE "LobbyStatus" AS ENUM ('OPEN', 'LOCKED', 'AWAITING_PAYMENT', 'PAID', 'COMPLETED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LobbyMemberStatus" AS ENUM ('JOINED', 'LEFT', 'NO_SHOW', 'CHECKED_IN');

-- CreateEnum
CREATE TYPE "VoucherScope" AS ENUM ('VENUE', 'FNB', 'CROSS');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "SplitBillStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "EscrowTxType" AS ENUM ('HOLD', 'RELEASE', 'REFUND', 'PENALTY');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('HELD', 'RELEASED', 'REFUNDED', 'FROZEN');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "reputation_score" INTEGER NOT NULL DEFAULT 100,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "type" "ProviderType" NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "open_hours" TEXT NOT NULL DEFAULT '07:00-22:00',
    "bank_code" TEXT NOT NULL DEFAULT 'MB',
    "bank_account" TEXT NOT NULL DEFAULT '0123456789',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "locked_by" TEXT,
    "locked_until" TIMESTAMP(3),

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "order_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_lobbies" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "slot_id" TEXT NOT NULL,
    "fnb_provider_id" TEXT,
    "invite_code" TEXT NOT NULL,
    "status" "LobbyStatus" NOT NULL DEFAULT 'OPEN',
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "ship_fee" INTEGER NOT NULL DEFAULT 15000,
    "voucher_id" TEXT,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_lobbies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lobby_members" (
    "lobby_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deposit_required" INTEGER NOT NULL DEFAULT 0,
    "deposit_paid" INTEGER NOT NULL DEFAULT 0,
    "status" "LobbyMemberStatus" NOT NULL DEFAULT 'JOINED',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lobby_members_pkey" PRIMARY KEY ("lobby_id","user_id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "lobby_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price_snapshot" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scope" "VoucherScope" NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "max_discount" INTEGER NOT NULL,
    "min_order" INTEGER NOT NULL DEFAULT 0,
    "max_distance_m" INTEGER NOT NULL DEFAULT 1000,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER NOT NULL DEFAULT 100,
    "used_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_bills" (
    "id" TEXT NOT NULL,
    "lobby_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slot_share" INTEGER NOT NULL,
    "food_amount" INTEGER NOT NULL,
    "ship_share" INTEGER NOT NULL,
    "discount_share" INTEGER NOT NULL,
    "deposit_offset" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "vietqr_url" TEXT NOT NULL,
    "status" "SplitBillStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "split_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrow_transactions" (
    "id" TEXT NOT NULL,
    "lobby_id" TEXT NOT NULL,
    "split_bill_id" TEXT,
    "type" "EscrowTxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "platform_fee" INTEGER NOT NULL DEFAULT 0,
    "net_amount" INTEGER NOT NULL DEFAULT 0,
    "payee_provider_id" TEXT,
    "status" "EscrowStatus" NOT NULL DEFAULT 'HELD',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "lobby_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "target_provider_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence_urls" TEXT[],
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "refund_amount" INTEGER NOT NULL DEFAULT 0,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "providers_type_category_idx" ON "providers"("type", "category");

-- CreateIndex
CREATE INDEX "providers_lat_lng_idx" ON "providers"("lat", "lng");

-- CreateIndex
CREATE INDEX "slots_status_locked_until_idx" ON "slots"("status", "locked_until");

-- CreateIndex
CREATE UNIQUE INDEX "slots_provider_id_start_at_key" ON "slots"("provider_id", "start_at");

-- CreateIndex
CREATE INDEX "menu_items_provider_id_is_available_idx" ON "menu_items"("provider_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "group_lobbies_slot_id_key" ON "group_lobbies"("slot_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_lobbies_invite_code_key" ON "group_lobbies"("invite_code");

-- CreateIndex
CREATE INDEX "group_lobbies_host_id_status_idx" ON "group_lobbies"("host_id", "status");

-- CreateIndex
CREATE INDEX "lobby_members_user_id_idx" ON "lobby_members"("user_id");

-- CreateIndex
CREATE INDEX "cart_items_lobby_id_user_id_idx" ON "cart_items"("lobby_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE INDEX "split_bills_status_idx" ON "split_bills"("status");

-- CreateIndex
CREATE UNIQUE INDEX "split_bills_lobby_id_user_id_key" ON "split_bills"("lobby_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "escrow_transactions_idempotency_key_key" ON "escrow_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "escrow_transactions_lobby_id_type_status_idx" ON "escrow_transactions"("lobby_id", "type", "status");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_lobby_id_idx" ON "disputes"("lobby_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_lobbies" ADD CONSTRAINT "group_lobbies_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_lobbies" ADD CONSTRAINT "group_lobbies_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_lobbies" ADD CONSTRAINT "group_lobbies_fnb_provider_id_fkey" FOREIGN KEY ("fnb_provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_lobbies" ADD CONSTRAINT "group_lobbies_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby_members" ADD CONSTRAINT "lobby_members_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "group_lobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby_members" ADD CONSTRAINT "lobby_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "group_lobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bills" ADD CONSTRAINT "split_bills_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "group_lobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bills" ADD CONSTRAINT "split_bills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "group_lobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_split_bill_id_fkey" FOREIGN KEY ("split_bill_id") REFERENCES "split_bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_transactions" ADD CONSTRAINT "escrow_transactions_payee_provider_id_fkey" FOREIGN KEY ("payee_provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_lobby_id_fkey" FOREIGN KEY ("lobby_id") REFERENCES "group_lobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_target_provider_id_fkey" FOREIGN KEY ("target_provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

