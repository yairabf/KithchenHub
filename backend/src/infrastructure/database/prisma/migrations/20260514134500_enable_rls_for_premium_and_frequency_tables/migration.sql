-- Enable RLS for public tables flagged by the Supabase database linter.
-- These tables are exposed through the public schema, so PostgREST should not
-- allow unrestricted access with the anon/authenticated roles.

ALTER TABLE "household_entitlement_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_provider_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "household_item_frequency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "household_subscriptions" ENABLE ROW LEVEL SECURITY;

-- Household-scoped read policies for user-visible state. Backend/server writes
-- continue to use the configured database role; direct PostgREST clients can
-- only read rows for their own household.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'household_entitlement_overrides'
      AND policyname = 'Household members can read entitlement overrides'
  ) THEN
    CREATE POLICY "Household members can read entitlement overrides"
      ON "household_entitlement_overrides"
      FOR SELECT
      USING ("household_id" = get_my_household_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'household_item_frequency'
      AND policyname = 'Household members can read item frequencies'
  ) THEN
    CREATE POLICY "Household members can read item frequencies"
      ON "household_item_frequency"
      FOR SELECT
      USING ("household_id" = get_my_household_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'household_subscriptions'
      AND policyname = 'Household members can read subscriptions'
  ) THEN
    CREATE POLICY "Household members can read subscriptions"
      ON "household_subscriptions"
      FOR SELECT
      USING ("household_id" = get_my_household_id());
  END IF;
END $$;

-- No client-facing policy is intentionally created for billing_provider_events.
-- Provider webhook payloads can contain sensitive billing metadata and should
-- remain inaccessible through PostgREST. The backend uses server-side database
-- credentials for billing event ingestion/processing.
