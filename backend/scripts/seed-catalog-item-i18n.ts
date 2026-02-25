/**
 * Seed catalog_item_i18n from master_grocery_catalog and optional catalog_item_aliases.
 *
 * 1. Inserts/updates English rows from master_grocery_catalog (name -> en).
 * 2. If catalog_item_aliases exists, inserts/updates Hebrew from primary Hebrew alias per item.
 * 3. Prints counts and Hebrew coverage.
 *
 * Usage:
 *   npx ts-node scripts/seed-catalog-item-i18n.ts
 *
 * Requires DATABASE_URL. Run migrations first (npm run prisma:deploy).
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

type CountRow = { count: bigint };

/**
 * Returns whether a table exists in the public schema (for safe raw SQL).
 * @param tableName - e.g. 'public.catalog_item_i18n'
 */
async function tableExists(tableName: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ regclassText: string | null }>>`
    SELECT to_regclass(${tableName})::text AS "regclassText"
  `;
  return rows[0]?.regclassText != null;
}

/**
 * Upserts English translations from master_grocery_catalog into catalog_item_i18n.
 */
async function seedEnglishTranslations(): Promise<void> {
  await prisma.$executeRawUnsafe(`
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
    ON CONFLICT ("catalog_item_id", "lang")
    DO UPDATE SET
      "name" = EXCLUDED."name",
      "updated_at" = CURRENT_TIMESTAMP
  `);
}

/**
 * Upserts Hebrew translations from catalog_item_aliases (primary alias per item).
 */
async function seedHebrewFromAliases(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    WITH ranked_hebrew_aliases AS (
      SELECT
        cia."catalog_item_id",
        cia."alias",
        ROW_NUMBER() OVER (
          PARTITION BY cia."catalog_item_id"
          ORDER BY
            cia."is_primary" DESC,
            cia."updated_at" DESC,
            cia."created_at" DESC,
            cia."alias" ASC
        ) AS rn
      FROM "catalog_item_aliases" cia
      WHERE cia."lang" = 'he'
        AND trim(cia."alias") <> ''
    )
    INSERT INTO "catalog_item_i18n" (
      "catalog_item_id",
      "lang",
      "name",
      "created_at",
      "updated_at"
    )
    SELECT
      rha."catalog_item_id",
      'he' AS "lang",
      rha."alias" AS "name",
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM ranked_hebrew_aliases rha
    WHERE rha.rn = 1
    ON CONFLICT ("catalog_item_id", "lang")
    DO UPDATE SET
      "name" = EXCLUDED."name",
      "updated_at" = CURRENT_TIMESTAMP
  `);
}

/**
 * Logs catalog item count and en/he translation counts and Hebrew coverage.
 */
async function printSummary(): Promise<void> {
  const [catalogRows] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count FROM "master_grocery_catalog"
  `;
  const [enRows] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "catalog_item_i18n"
    WHERE "lang" = 'en'
  `;
  const [heRows] = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "catalog_item_i18n"
    WHERE "lang" = 'he'
  `;

  const catalogCount = Number(catalogRows?.count ?? 0n);
  const enCount = Number(enRows?.count ?? 0n);
  const heCount = Number(heRows?.count ?? 0n);
  const heCoverage = catalogCount === 0 ? 0 : (heCount / catalogCount) * 100;

  console.log('catalog_item_i18n seeding complete');
  console.log(`- catalog items: ${catalogCount}`);
  console.log(`- en translations: ${enCount}`);
  console.log(`- he translations: ${heCount}`);
  console.log(`- he coverage: ${heCoverage.toFixed(2)}%`);
}

async function main(): Promise<void> {
  const i18nTable = await tableExists('public.catalog_item_i18n');
  if (!i18nTable) {
    throw new Error(
      'catalog_item_i18n table not found. Run migrations first: npm run prisma:deploy',
    );
  }

  await seedEnglishTranslations();

  const aliasesTable = await tableExists('public.catalog_item_aliases');
  if (aliasesTable) {
    await seedHebrewFromAliases();
  } else {
    console.warn(
      'catalog_item_aliases table not found; skipped Hebrew seed from aliases.',
    );
  }

  await printSummary();
}

main()
  .catch((error) => {
    console.error('Failed to seed catalog_item_i18n:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
