/**
 * Seed script: insert master grocery catalog from generated JSON into the local DB.
 * Uses DATABASE_URL from .env (point at Docker Postgres: postgresql://kitchen_hub:kitchen_hub_dev@localhost:5432/kitchen_hub).
 *
 * Usage (from backend/):
 *   npm run db:seed
 *   npm run db:seed -- --file=../sandbox/final_zero_risk_db.json
 *
 * Prerequisites:
 *   - Local DB running: npm run db:start
 *   - Migrations applied: npm run prisma:migrate (or prisma:deploy)
 *   - JSON file path: default is ../../sandbox/final_zero_risk_db.json from this script's dir
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const DEFAULT_JSON_PATH = path.join(
  __dirname,
  '..',
  '..',
  'sandbox',
  'final_zero_risk_db.json',
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

function getJsonPath(): string {
  const arg = process.argv.find((a) => a.startsWith('--file='));
  if (arg) {
    const value = arg.slice('--file='.length).trim();
    return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  }
  return process.env.GROCERY_CATALOG_JSON ?? DEFAULT_JSON_PATH;
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
  const jsonPath = getJsonPath();
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const records: GroceryCatalogRecord[] = JSON.parse(raw);
  if (!Array.isArray(records) || records.length === 0) {
    console.error('JSON must be a non-empty array of catalog records.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const data = records.map(mapToPrisma);

    await prisma.$transaction([
      prisma.masterGroceryCatalog.deleteMany(),
      prisma.masterGroceryCatalog.createMany({ data }),
    ]);

    console.log(`Seeded ${data.length} items into master_grocery_catalog.`);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
