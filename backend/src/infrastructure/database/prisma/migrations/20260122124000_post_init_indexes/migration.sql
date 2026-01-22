-- Post-init index creation to ensure tables exist before applying.
DO $$
BEGIN
  IF to_regclass('public.users') IS NULL THEN
    RAISE EXCEPTION 'Expected base tables to exist before index migration (users missing).';
  END IF;
  IF to_regclass('public.shopping_items') IS NULL THEN
    RAISE EXCEPTION 'Expected base tables to exist before index migration (shopping_items missing).';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "users_household_id_idx" ON "users"("household_id");
CREATE INDEX IF NOT EXISTS "shopping_items_list_id_idx" ON "shopping_items"("list_id");
CREATE INDEX IF NOT EXISTS "shopping_items_list_id_is_checked_idx" ON "shopping_items"("list_id", "is_checked");
