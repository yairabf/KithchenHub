CREATE TABLE "catalog_item_i18n" (
    "catalog_item_id" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalog_item_i18n_pkey" PRIMARY KEY ("catalog_item_id", "lang"),
    CONSTRAINT "catalog_item_i18n_catalog_item_id_fkey"
      FOREIGN KEY ("catalog_item_id") REFERENCES "master_grocery_catalog"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "catalog_item_i18n_lang_catalog_item_id_idx"
  ON "catalog_item_i18n"("lang", "catalog_item_id");

CREATE INDEX "catalog_item_i18n_lang_name_idx"
  ON "catalog_item_i18n"("lang", "name");

INSERT INTO "catalog_item_i18n" (
  "catalog_item_id",
  "lang",
  "name",
  "created_at",
  "updated_at"
)
SELECT
  mgc."id" AS "catalog_item_id",
  'en' AS "lang",
  mgc."name" AS "name",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "master_grocery_catalog" mgc
WHERE trim(mgc."name") <> ''
ON CONFLICT ("catalog_item_id", "lang") DO NOTHING;

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Skipping pg_trgm extension setup due to insufficient privileges';
  END;

  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_trgm'
  ) THEN
    CREATE INDEX IF NOT EXISTS "catalog_item_i18n_name_trgm_idx"
      ON "catalog_item_i18n" USING gin ("name" gin_trgm_ops);
  END IF;
END $$;
