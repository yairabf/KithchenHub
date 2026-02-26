/**
 * Export a CSV template for Hebrew catalog item translations.
 *
 * Fetches all master_grocery_catalog rows and existing Hebrew catalog_item_i18n.
 * Writes a CSV with columns: catalog_item_id, lang, en_name, he_name, category.
 * Pre-fills he_name where translations exist so translators can fill the rest.
 *
 * Usage:
 *   npx ts-node scripts/export-catalog-item-i18n-he-template.ts
 *   npx ts-node scripts/export-catalog-item-i18n-he-template.ts --out=/path/to/output.csv
 *
 * Requires DATABASE_URL (e.g. via .env). Run before manual translation or auto-translate.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { csvEscape } from './lib/catalog-i18n-csv';

dotenv.config();

const prisma = new PrismaClient();

/** Default output path for the template CSV. */
const DEFAULT_OUT_PATH = path.join(
  __dirname,
  '..',
  'output',
  'catalog_item_i18n_he_template.csv',
);

/**
 * Resolves output path from --out= CLI arg or default.
 * Relative paths are resolved against process.cwd().
 */
function getOutPath(): string {
  const arg = process.argv.find((item) => item.startsWith('--out='));
  if (!arg) {
    return DEFAULT_OUT_PATH;
  }
  const value = arg.slice('--out='.length).trim();
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

type CatalogItem = {
  id: string;
  name: string;
  category: string;
};

type HebrewTranslation = {
  catalogItemId: string;
  name: string;
};

async function main(): Promise<void> {
  const outPath = getOutPath();

  const [items, existingHebrew] = await Promise.all([
    prisma.masterGroceryCatalog.findMany({
      select: { id: true, name: true, category: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.catalogItemI18n.findMany({
      where: { lang: 'he' },
      select: { catalogItemId: true, name: true },
    }),
  ]);

  const heMap = new Map<string, string>(
    (existingHebrew as HebrewTranslation[]).map((row) => [
      row.catalogItemId,
      row.name,
    ]),
  );

  const header = ['catalog_item_id', 'lang', 'en_name', 'he_name', 'category'];
  const lines: string[] = [header.join(',')];

  for (const item of items as CatalogItem[]) {
    const heName = heMap.get(item.id) ?? '';
    lines.push(
      [item.id, 'he', item.name, heName, item.category]
        .map((value) => csvEscape(value))
        .join(','),
    );
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Exported template: ${outPath}`);
  console.log(`Rows: ${items.length}`);
  console.log(`Pre-filled Hebrew rows: ${existingHebrew.length}`);
  console.log('Fill the he_name column, then import with:');
  console.log('npm run db:import:i18n-he -- --file=<path-to-csv>');
}

main()
  .catch((error) => {
    console.error('Failed to export Hebrew template:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
