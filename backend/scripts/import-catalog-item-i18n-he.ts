/**
 * Import Hebrew catalog item translations from CSV into catalog_item_i18n.
 *
 * Reads a CSV with columns: catalog_item_id, lang, en_name, he_name, category.
 * Upserts rows into catalog_item_i18n using catalog_item_id + lang as key.
 * Empty lang is normalized to 'he'. Rows with empty catalog_item_id or he_name are skipped.
 *
 * Usage:
 *   npx ts-node scripts/import-catalog-item-i18n-he.ts
 *   npx ts-node scripts/import-catalog-item-i18n-he.ts --file=/path/to/translated.csv
 *
 * Requires DATABASE_URL (e.g. via .env). Run after export and optional auto-translate.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { parseCsv, rowsToCatalogI18nRows } from './lib/catalog-i18n-csv';

dotenv.config();

const prisma = new PrismaClient();

/** Default path to the CSV template/translated file. */
const DEFAULT_FILE_PATH = path.join(
  __dirname,
  '..',
  'output',
  'catalog_item_i18n_he_template.csv',
);

/** Number of rows per transaction to avoid oversized transactions. */
const IMPORT_CHUNK_SIZE = 250;

/** Supported language code for this import script. */
const SUPPORTED_LANG = 'he';

/**
 * Resolves CSV path from --file= CLI arg or default.
 * Relative paths are resolved against process.cwd().
 */
function getFilePath(): string {
  const arg = process.argv.find((item) => item.startsWith('--file='));
  if (!arg) {
    return DEFAULT_FILE_PATH;
  }
  const value = arg.slice('--file='.length).trim();
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

/**
 * Normalizes lang to supported value. Empty or whitespace becomes 'he'.
 * Invalid values are coerced to 'he' for this Hebrew-only import.
 */
function normalizeLang(lang: string): string {
  const trimmed = lang.trim().toLowerCase();
  return trimmed === SUPPORTED_LANG ? SUPPORTED_LANG : SUPPORTED_LANG;
}

async function main(): Promise<void> {
  const filePath = getFilePath();

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = rowsToCatalogI18nRows(parseCsv(content));

  const toUpsert = parsed
    .map((row) => ({
      catalogItemId: row.catalog_item_id.trim(),
      lang: normalizeLang(row.lang),
      name: row.he_name.trim(),
    }))
    .filter((row) => row.catalogItemId.length > 0 && row.name.length > 0);

  if (toUpsert.length === 0) {
    console.log('No Hebrew names found to import.');
    return;
  }

  let processed = 0;
  for (let i = 0; i < toUpsert.length; i += IMPORT_CHUNK_SIZE) {
    const chunk = toUpsert.slice(i, i + IMPORT_CHUNK_SIZE);
    await prisma.$transaction(
      chunk.map((row) =>
        prisma.catalogItemI18n.upsert({
          where: {
            catalogItemId_lang: {
              catalogItemId: row.catalogItemId,
              lang: row.lang,
            },
          },
          update: { name: row.name },
          create: {
            catalogItemId: row.catalogItemId,
            lang: row.lang,
            name: row.name,
          },
        }),
      ),
    );
    processed += chunk.length;
  }

  console.log(`Imported Hebrew translations: ${processed}`);
}

main()
  .catch((error) => {
    console.error('Failed to import Hebrew translations:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
