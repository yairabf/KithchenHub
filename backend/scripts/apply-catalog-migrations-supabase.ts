/**
 * Applies catalog-related migration SQL that was marked as applied on Supabase
 * without running (so the tables are missing). Run once against Supabase when
 * migrate resolve --applied was used and tables don't exist.
 *
 * Usage: npx ts-node -r dotenv/config scripts/apply-catalog-migrations-supabase.ts
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrationsDir = path.join(
  __dirname,
  '..',
  'src',
  'infrastructure',
  'database',
  'prisma',
  'migrations',
);

const MIGRATIONS_TO_APPLY = [
  '20260223120000_catalog_aliases_and_tags',
  '20260226090000_catalog_item_i18n',
];

/** Split SQL into single statements (by ; at end of line or DO $$...END $$;). */
function splitSqlStatements(sql: string): string[] {
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: string[] = [];
  let current = '';
  let inDoBlock = false;
  const lines = sql.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') && !inDoBlock) continue;
    if (trimmed.startsWith('DO $$')) inDoBlock = true;
    current += (current ? '\n' : '') + line;
    if (inDoBlock) {
      if (trimmed.includes('END $$;')) {
        inDoBlock = false;
        out.push(current.trim());
        current = '';
      }
    } else if (trimmed.endsWith(';')) {
      out.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.filter((s) => s.length > 0);
}

async function main() {
  const prisma = new PrismaClient();

  for (const name of MIGRATIONS_TO_APPLY) {
    const file = path.join(migrationsDir, name, 'migration.sql');
    if (!fs.existsSync(file)) {
      console.warn(`Skip ${name}: file not found`);
      continue;
    }
    let sql = fs.readFileSync(file, 'utf-8');
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
    const statements = splitSqlStatements(sql);
    console.log(`Applying ${name} (${statements.length} statements)...`);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt || stmt.startsWith('--')) continue;
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (e: unknown) {
        const err = e as { message?: string; code?: string };
        if (
          err.message?.includes('already exists') ||
          err.code === '42P07' ||
          err.code === '42710'
        ) {
          console.log(`  [${i + 1}] already exists, skip`);
        } else {
          console.error(`  [${i + 1}] failed:`, err.message ?? e);
          throw e;
        }
      }
    }
    console.log(`  Done ${name}`);
  }

  await prisma.$disconnect();
  console.log('Catalog migrations applied.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
