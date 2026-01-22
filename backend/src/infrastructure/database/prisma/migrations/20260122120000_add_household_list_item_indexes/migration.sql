-- Add indexes for household and list lookups.
-- Guarded to avoid failure if base tables are not created yet.
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "users_household_id_idx" ON "users"("household_id");
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.shopping_items') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS "shopping_items_list_id_idx" ON "shopping_items"("list_id");
    CREATE INDEX IF NOT EXISTS "shopping_items_list_id_is_checked_idx" ON "shopping_items"("list_id", "is_checked");
  END IF;
END $$;
