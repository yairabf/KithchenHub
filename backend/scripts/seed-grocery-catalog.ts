/**
 * Seed script: rebuild master grocery catalog from CSV or JSON.
 *
 * Default source is catalog-seeder/combined_grocery_items.csv.
 * Supported input formats:
 * - CSV columns: name,category,icon_emoji,image_key
 * - JSON array legacy shape used by previous seeder
 *
 * Behavior:
 * - Deletes existing catalog-linked tables (master + i18n + aliases + item tags)
 * - Inserts fresh normalized records into master_grocery_catalog
 *
 * Usage (from backend/):
 *   npm run db:seed
 *   npm run db:seed -- --file=../catalog-seeder/combined_grocery_items.csv
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { parseCsv } from './lib/catalog-i18n-csv';

dotenv.config();

const DEFAULT_SOURCE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'catalog-seeder',
  'combined_grocery_items.csv',
);

interface GroceryCatalogRecord {
  id: string;
  name: string;
  category: string;
  default_unit?: string | null;
  image_url?: string | null;
  default_quantity?: number | null;
  created_at: string;
  updated_at: string;
}

interface CombinedCsvRecord {
  name: string;
  category: string;
  icon_emoji: string;
  image_key: string;
}

function getSourcePath(): string {
  const arg = process.argv.find((a) => a.startsWith('--file='));
  if (arg) {
    const value = arg.slice('--file='.length).trim();
    return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  }
  return process.env.GROCERY_CATALOG_SOURCE ?? DEFAULT_SOURCE_PATH;
}

function normalizeCategory(category: string): string {
  const value = category.trim().toLowerCase();
  if (!value) {
    return 'Other';
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function makeStableId(name: string, category: string): string {
  const key = `${category.toLowerCase()}::${name.trim().toLowerCase()}`;
  const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12);
  return `gen-${hash}`;
}

function normalizeImageUrlFromKey(imageKey: string): string | null {
  const key = imageKey.trim();
  if (key.length === 0) {
    return null;
  }

  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }

  /** Canonical path prefix for catalog images in DB and storage (MinIO/Supabase). */
  const PREFIX = 'items_images/';

  const ensurePng = (fileName: string) =>
    fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  const toItemsImages = (fileName: string) =>
    `${PREFIX}${ensurePng(fileName.replace(/^\/+|\/+$/g, ''))}`;

  if (key.startsWith('items_images/') || key.startsWith('items_images')) {
    const fileName = key.replace(/^items_images\/?/, '');
    return fileName ? toItemsImages(fileName) : null;
  }

  if (key.startsWith('download_icons/') || key.startsWith('download_icons')) {
    const fileName = key.replace(/^download_icons\/?/, '');
    return fileName ? toItemsImages(fileName) : null;
  }

  if (key.startsWith('downloaded_icons/') || key.startsWith('downloaded_icons')) {
    const fileName = key.replace(/^downloaded_icons\/?/, '');
    return fileName ? toItemsImages(fileName) : null;
  }

  return toItemsImages(key);
}

function toPrismaFromCsv(record: CombinedCsvRecord) {
  const name = record.name.trim();
  const category = normalizeCategory(record.category);
  const imageKey = record.image_key.trim();

  return {
    id: makeStableId(name, category),
    name,
    category,
    icon: record.icon_emoji.trim() || null,
    defaultUnit: null,
    imageUrl: normalizeImageUrlFromKey(imageKey),
    defaultQuantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function loadCsvRecords(content: string): CombinedCsvRecord[] {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((value) => value.trim());
  const headerIndex = new Map(headers.map((header, index) => [header, index]));

  const required = ['name', 'category', 'icon_emoji', 'image_key'];
  for (const key of required) {
    if (!headerIndex.has(key)) {
      throw new Error(`CSV missing required column: ${key}`);
    }
  }

  const records: CombinedCsvRecord[] = [];
  for (const row of rows.slice(1)) {
    const name = row[headerIndex.get('name') ?? -1] ?? '';
    const category = row[headerIndex.get('category') ?? -1] ?? '';
    const icon = row[headerIndex.get('icon_emoji') ?? -1] ?? '';
    const imageKey = row[headerIndex.get('image_key') ?? -1] ?? '';

    if (name.trim().length === 0 || category.trim().length === 0) {
      continue;
    }

    records.push({
      name,
      category,
      icon_emoji: icon,
      image_key: imageKey,
    });
  }

  return records;
}

function mapToPrisma(record: GroceryCatalogRecord) {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    defaultUnit: record.default_unit ?? null,
    imageUrl: record.image_url ?? null,
    defaultQuantity: record.default_quantity ?? 1,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
  };
}

async function main(): Promise<void> {
  const sourcePath = getSourcePath();
  if (!fs.existsSync(sourcePath)) {
    console.error(`File not found: ${sourcePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(sourcePath, 'utf-8');
  const extension = path.extname(sourcePath).toLowerCase();

  const prisma = new PrismaClient();

  try {
    let data:
      | Array<ReturnType<typeof mapToPrisma>>
      | Array<ReturnType<typeof toPrismaFromCsv>>;

    if (extension === '.csv') {
      const csvRecords = loadCsvRecords(raw);
      if (csvRecords.length === 0) {
        throw new Error('CSV must include at least one row with name and category.');
      }

      const seen = new Set<string>();
      data = csvRecords
        .map(toPrismaFromCsv)
        .filter((record) => {
          const key = `${record.category.toLowerCase()}::${record.name.toLowerCase()}`;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
    } else {
      const records: GroceryCatalogRecord[] = JSON.parse(raw);
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('JSON must be a non-empty array of catalog records.');
      }
      data = records.map(mapToPrisma);
    }

    await prisma.$transaction([
      prisma.catalogItemI18n.deleteMany(),
      prisma.catalogItemAlias.deleteMany(),
      prisma.catalogItemTag.deleteMany(),
      prisma.masterGroceryCatalog.deleteMany(),
      prisma.masterGroceryCatalog.createMany({ data }),
    ]);

    console.log(`Rebuilt master_grocery_catalog from: ${sourcePath}`);
    console.log(`Seeded ${data.length} items into master_grocery_catalog.`);
    console.log('Cleared: catalog_item_i18n, catalog_item_aliases, catalog_item_tags.');
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
