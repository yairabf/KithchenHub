CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "catalog_item_aliases_alias_trgm_idx"
  ON "catalog_item_aliases" USING gin ("alias" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "master_grocery_catalog_name_trgm_idx"
  ON "master_grocery_catalog" USING gin ("name" gin_trgm_ops);
