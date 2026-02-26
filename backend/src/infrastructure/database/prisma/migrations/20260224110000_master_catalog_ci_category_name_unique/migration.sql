-- Enforce case-insensitive uniqueness for category+name combinations in catalog items.
CREATE UNIQUE INDEX "master_grocery_catalog_category_name_ci_unique"
  ON "master_grocery_catalog" (lower("category"), lower("name"));
