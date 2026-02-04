-- Drop foreign key constraint from shopping_items
ALTER TABLE "shopping_items" DROP CONSTRAINT IF EXISTS "shopping_items_user_item_id_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "shopping_items_user_item_id_idx";
DROP INDEX IF EXISTS "user_items_user_id_name_idx";
DROP INDEX IF EXISTS "user_items_household_id_idx";

-- Drop foreign key constraints from user_items
ALTER TABLE "user_items" DROP CONSTRAINT IF EXISTS "user_items_user_id_fkey";
ALTER TABLE "user_items" DROP CONSTRAINT IF EXISTS "user_items_household_id_fkey";

-- Drop the old user_items table (clean migration - no data migration)
DROP TABLE IF EXISTS "user_items";

-- Rename column in shopping_items
ALTER TABLE "shopping_items" RENAME COLUMN "user_item_id" TO "custom_item_id";

-- Set all existing custom_item_id values to NULL (clean migration - not preserving old data)
UPDATE "shopping_items" SET "custom_item_id" = NULL WHERE "custom_item_id" IS NOT NULL;

-- Create new custom_items table
CREATE TABLE "custom_items" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_items_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "custom_items_household_id_name_idx" ON "custom_items"("household_id", "name");
CREATE INDEX "custom_items_household_id_idx" ON "custom_items"("household_id");
CREATE INDEX "shopping_items_custom_item_id_idx" ON "shopping_items"("custom_item_id");

-- Add foreign keys
ALTER TABLE "shopping_items" ADD CONSTRAINT "shopping_items_custom_item_id_fkey" 
    FOREIGN KEY ("custom_item_id") REFERENCES "custom_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "custom_items" ADD CONSTRAINT "custom_items_household_id_fkey" 
    FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;
