-- Enable RLS on all tables
ALTER TABLE "households" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shopping_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shopping_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "chores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "import_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "import_mappings" ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user's household_id
-- SECURITY DEFINER is used so it can query the users table even if RLS is restrictive
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS text AS $$
  SELECT household_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- HOUSEHOLDS Policies
CREATE POLICY "Users can see their own household" ON "households"
  FOR SELECT USING (id = get_my_household_id());

-- USERS Policies
CREATE POLICY "Users can see themselves and household members" ON "users"
  FOR SELECT USING (id = auth.uid() OR household_id = get_my_household_id());

CREATE POLICY "Users can update themselves" ON "users"
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- SHOPPING_LISTS Policies
CREATE POLICY "Household access to shopping lists" ON "shopping_lists"
  FOR ALL USING (household_id = get_my_household_id())
  WITH CHECK (household_id = get_my_household_id());

-- SHOPPING_ITEMS Policies
-- Items are accessed via their parent list which is gated by household_id
CREATE POLICY "Household access to shopping items via list" ON "shopping_items"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_lists L
      WHERE L.id = list_id AND L.household_id = get_my_household_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists L
      WHERE L.id = list_id AND L.household_id = get_my_household_id()
    )
  );

-- RECIPES Policies
CREATE POLICY "Household access to recipes" ON "recipes"
  FOR ALL USING (household_id = get_my_household_id())
  WITH CHECK (household_id = get_my_household_id());

-- CHORES Policies
CREATE POLICY "Household access to chores" ON "chores"
  FOR ALL USING (household_id = get_my_household_id())
  WITH CHECK (household_id = get_my_household_id());

-- IMPORT_BATCHES Policies
-- These are tied to the specific user, not the household
CREATE POLICY "User access to import batches" ON "import_batches"
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- IMPORT_MAPPINGS Policies
CREATE POLICY "User access to import mappings" ON "import_mappings"
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
