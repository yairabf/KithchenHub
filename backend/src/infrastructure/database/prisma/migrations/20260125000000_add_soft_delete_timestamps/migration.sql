-- Add deleted_at column to user-owned entities
ALTER TABLE "households" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "shopping_lists" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "shopping_items" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "recipes" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "chores" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Add indexes for efficient filtering of active records
CREATE INDEX "households_deleted_at_idx" ON "households"("deleted_at");
CREATE INDEX "shopping_lists_deleted_at_idx" ON "shopping_lists"("deleted_at");
CREATE INDEX "shopping_items_deleted_at_idx" ON "shopping_items"("deleted_at");
CREATE INDEX "recipes_deleted_at_idx" ON "recipes"("deleted_at");
CREATE INDEX "chores_deleted_at_idx" ON "chores"("deleted_at");

-- Add composite indexes for common queries (household + deleted)
CREATE INDEX "shopping_lists_household_deleted_idx" ON "shopping_lists"("household_id", "deleted_at");
CREATE INDEX "recipes_household_deleted_idx" ON "recipes"("household_id", "deleted_at");
CREATE INDEX "chores_household_deleted_idx" ON "chores"("household_id", "deleted_at");
