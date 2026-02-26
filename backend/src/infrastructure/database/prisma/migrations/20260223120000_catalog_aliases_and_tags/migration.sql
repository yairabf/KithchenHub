-- Add alias and tag infrastructure for catalog search and future localization.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "catalog_item_aliases" (
    "id" TEXT NOT NULL,
    "catalog_item_id" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalog_item_aliases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "catalog_item_aliases_catalog_item_id_fkey"
      FOREIGN KEY ("catalog_item_id") REFERENCES "master_grocery_catalog"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "catalog_item_aliases_catalog_item_id_lang_normalized_alias_key"
      UNIQUE ("catalog_item_id", "lang", "normalized_alias")
);

CREATE TABLE "catalog_tags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalog_tags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "catalog_tags_kind_key_key" UNIQUE ("kind", "key")
);

CREATE TABLE "catalog_item_tags" (
    "id" TEXT NOT NULL,
    "catalog_item_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalog_item_tags_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "catalog_item_tags_catalog_item_id_fkey"
      FOREIGN KEY ("catalog_item_id") REFERENCES "master_grocery_catalog"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "catalog_item_tags_tag_id_fkey"
      FOREIGN KEY ("tag_id") REFERENCES "catalog_tags"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "catalog_item_tags_catalog_item_id_tag_id_key"
      UNIQUE ("catalog_item_id", "tag_id")
);

CREATE INDEX "catalog_item_aliases_lang_normalized_alias_idx"
  ON "catalog_item_aliases"("lang", "normalized_alias");
CREATE INDEX "catalog_item_aliases_catalog_item_id_lang_idx"
  ON "catalog_item_aliases"("catalog_item_id", "lang");
CREATE INDEX "catalog_tags_kind_idx"
  ON "catalog_tags"("kind");
CREATE INDEX "catalog_item_tags_tag_id_idx"
  ON "catalog_item_tags"("tag_id");
CREATE INDEX "catalog_item_tags_catalog_item_id_is_primary_idx"
  ON "catalog_item_tags"("catalog_item_id", "is_primary");

CREATE INDEX "master_grocery_catalog_name_trgm_idx"
  ON "master_grocery_catalog" USING gin ("name" gin_trgm_ops);
CREATE INDEX "catalog_item_aliases_alias_trgm_idx"
  ON "catalog_item_aliases" USING gin ("alias" gin_trgm_ops);

-- Backfill CATEGORY tags from existing catalog categories.
INSERT INTO "catalog_tags" ("id", "key", "kind", "created_at", "updated_at")
SELECT
  'tag_' || md5('CATEGORY:' || lower(trim(mgc."category"))) AS "id",
  lower(trim(mgc."category")) AS "key",
  'CATEGORY' AS "kind",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "master_grocery_catalog" mgc
WHERE trim(mgc."category") <> ''
GROUP BY lower(trim(mgc."category"))
ON CONFLICT ("kind", "key") DO NOTHING;

-- Backfill category links for each catalog item.
INSERT INTO "catalog_item_tags" (
  "id",
  "catalog_item_id",
  "tag_id",
  "is_primary",
  "created_at",
  "updated_at"
)
SELECT
  'item_tag_' || md5(mgc."id" || ':' || ct."id") AS "id",
  mgc."id" AS "catalog_item_id",
  ct."id" AS "tag_id",
  true AS "is_primary",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "master_grocery_catalog" mgc
JOIN "catalog_tags" ct
  ON ct."kind" = 'CATEGORY'
 AND ct."key" = lower(trim(mgc."category"))
WHERE trim(mgc."category") <> ''
ON CONFLICT ("catalog_item_id", "tag_id") DO NOTHING;

-- Backfill primary English alias from canonical item name.
INSERT INTO "catalog_item_aliases" (
  "id",
  "catalog_item_id",
  "lang",
  "alias",
  "normalized_alias",
  "is_primary",
  "created_at",
  "updated_at"
)
SELECT
  'alias_' || md5(mgc."id" || ':en:' || lower(trim(mgc."name"))) AS "id",
  mgc."id" AS "catalog_item_id",
  'en' AS "lang",
  mgc."name" AS "alias",
  lower(trim(mgc."name")) AS "normalized_alias",
  true AS "is_primary",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "master_grocery_catalog" mgc
WHERE trim(mgc."name") <> ''
ON CONFLICT ("catalog_item_id", "lang", "normalized_alias") DO NOTHING;
