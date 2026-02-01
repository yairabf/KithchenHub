-- DropIndex
DROP INDEX "chores_deleted_at_idx";

-- DropIndex
DROP INDEX "chores_household_deleted_idx";

-- DropIndex
DROP INDEX "households_deleted_at_idx";

-- DropIndex
DROP INDEX "recipes_deleted_at_idx";

-- DropIndex
DROP INDEX "recipes_household_deleted_idx";

-- DropIndex
DROP INDEX "shopping_items_deleted_at_idx";

-- DropIndex
DROP INDEX "shopping_lists_deleted_at_idx";

-- DropIndex
DROP INDEX "shopping_lists_household_deleted_idx";

-- AlterTable
ALTER TABLE "shopping_items" ADD COLUMN     "user_item_id" TEXT;

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "household_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_idempotency_keys" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "request_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_items_user_id_name_idx" ON "user_items"("user_id", "name");

-- CreateIndex
CREATE INDEX "user_items_household_id_idx" ON "user_items"("household_id");

-- CreateIndex
CREATE INDEX "sync_idempotency_keys_user_id_entity_type_entity_id_idx" ON "sync_idempotency_keys"("user_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "sync_idempotency_keys_processed_at_idx" ON "sync_idempotency_keys"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "sync_idempotency_keys_user_id_key_key" ON "sync_idempotency_keys"("user_id", "key");

-- CreateIndex
CREATE INDEX "shopping_items_user_item_id_idx" ON "shopping_items"("user_item_id");

-- AddForeignKey
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_user_item_id_fkey" FOREIGN KEY ("user_item_id") REFERENCES "user_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_idempotency_keys" ADD CONSTRAINT "sync_idempotency_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
