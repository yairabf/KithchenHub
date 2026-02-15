-- AlterTable
ALTER TABLE "custom_items" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "custom_items_deleted_at_idx" ON "custom_items"("deleted_at");
