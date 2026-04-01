-- Enable RLS and policies for public tables introduced after the initial RLS rollout.
-- This migration is additive and does not modify previously applied migrations.

-- Enable RLS on remaining public tables
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "household_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "custom_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sync_idempotency_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_item_i18n" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_item_aliases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "catalog_item_tags" ENABLE ROW LEVEL SECURITY;

-- Force RLS on sensitive internal tables to guarantee policy enforcement
ALTER TABLE "refresh_tokens" FORCE ROW LEVEL SECURITY;
ALTER TABLE "sync_idempotency_keys" FORCE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

-- REFRESH_TOKENS (user-scoped)
CREATE POLICY "Users can manage their own refresh tokens" ON "refresh_tokens"
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- HOUSEHOLD_INVITES (household-scoped; creator-scoped writes)
CREATE POLICY "Household members can read invites in their household" ON "household_invites"
  FOR SELECT USING (household_id = get_my_household_id());

CREATE POLICY "Users can create invites in their household" ON "household_invites"
  FOR INSERT WITH CHECK (
    creator_id = auth.uid()
    AND household_id = get_my_household_id()
  );

CREATE POLICY "Invite creators can update invites in their household" ON "household_invites"
  FOR UPDATE USING (
    creator_id = auth.uid()
    AND household_id = get_my_household_id()
  )
  WITH CHECK (
    creator_id = auth.uid()
    AND household_id = get_my_household_id()
  );

CREATE POLICY "Invite creators can delete invites in their household" ON "household_invites"
  FOR DELETE USING (
    creator_id = auth.uid()
    AND household_id = get_my_household_id()
  );

-- CUSTOM_ITEMS (household-scoped)
CREATE POLICY "Household access to custom items" ON "custom_items"
  FOR ALL USING (household_id = get_my_household_id())
  WITH CHECK (household_id = get_my_household_id());

-- SYNC IDEMPOTENCY KEYS (user-scoped)
CREATE POLICY "User access to sync idempotency keys" ON "sync_idempotency_keys"
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- AUDIT_LOGS (read-only for members of the same household; no client writes)
CREATE POLICY "Users can read their household audit logs" ON "audit_logs"
  FOR SELECT USING (
    user_id = auth.uid()
    OR household_id = get_my_household_id()
  );

-- CATALOG TABLES (read-only reference data)
CREATE POLICY "Public read access to catalog i18n" ON "catalog_item_i18n"
  FOR SELECT USING (true);

CREATE POLICY "Public read access to catalog aliases" ON "catalog_item_aliases"
  FOR SELECT USING (true);

CREATE POLICY "Public read access to catalog tags" ON "catalog_tags"
  FOR SELECT USING (true);

CREATE POLICY "Public read access to catalog item tags" ON "catalog_item_tags"
  FOR SELECT USING (true);
