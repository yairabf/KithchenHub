/**
 * Auto-translate empty he_name fields in the catalog i18n CSV using Google Translate.
 *
 * Reads the template CSV, calls Google's translate_a/single endpoint for each empty
 * he_name (with deduplication and concurrency), writes a new CSV with he_name filled.
 * Uses an undocumented public endpoint; may be rate-limited or deprecated. For
 * production or high-volume use, consider the official Cloud Translation API and
 * set GOOGLE_TRANSLATE_API_KEY.
 *
 * Usage:
 *   npx ts-node scripts/auto-translate-catalog-item-i18n-he.ts
 *   npx ts-node scripts/auto-translate-catalog-item-i18n-he.ts --file=in.csv --out=out.csv --concurrency=4
 *
 * Input: CSV with columns catalog_item_id, lang, en_name, he_name, category.
 * Output: Same structure with he_name filled where possible. Exits with code 1 if any translation failed.
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseCsv,
  rowsToCatalogI18nRows,
  toCsv,
  type CatalogI18nCsvRow,
} from './lib/catalog-i18n-csv';

dotenv.config();

/** Default path to the template CSV (output of export script). */
const DEFAULT_IN_PATH = path.join(
  __dirname,
  '..',
  'output',
  'catalog_item_i18n_he_template.csv',
);

/** Default path for the translated CSV output. */
const DEFAULT_OUT_PATH = path.join(
  __dirname,
  '..',
  'output',
  'catalog_item_i18n_he_translated.csv',
);

/** Maximum translation attempts per text. */
const TRANSLATE_MAX_ATTEMPTS = 5;

/** Base delay in ms for retry backoff (attempt * TRANSLATE_BACKOFF_MS). */
const TRANSLATE_BACKOFF_MS = 250;

/** Default number of concurrent translation requests. */
const DEFAULT_CONCURRENCY = 8;

/** Maximum allowed concurrency (CLI cap). */
const MAX_CONCURRENCY = 20;

/** Log progress every N completed items. */
const PROGRESS_LOG_INTERVAL = 100;

/**
 * Reads a CLI argument value by name (e.g. --file=path => path).
 */
function getArg(name: string): string | undefined {
  const arg = process.argv.find((item) => item.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3).trim();
}

/**
 * Resolves path: if input is missing or empty returns fallback; otherwise resolves relative to cwd.
 */
function resolvePath(input: string | undefined, fallback: string): string {
  if (!input || input.length === 0) {
    return fallback;
  }
  return path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calls Google Translate undocumented endpoint (en -> he).
 * May be rate-limited or changed without notice; for one-off script use only.
 */
async function translateEnToHe(text: string): Promise<string> {
  const url =
    'https://translate.googleapis.com/translate_a/single?' +
    new URLSearchParams({
      client: 'gtx',
      sl: 'en',
      tl: 'he',
      dt: 't',
      q: text,
    }).toString();

  const response = await fetch(url, {
    headers: { 'User-Agent': 'KitchenHubI18nSeeder/1.0' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected translation response format');
  }

  const parts = data[0] as Array<unknown>;
  const translated = parts
    .map((part) => {
      if (Array.isArray(part) && typeof part[0] === 'string') {
        return part[0];
      }
      return '';
    })
    .join('')
    .trim();

  if (!translated) {
    throw new Error('Empty translation');
  }

  return translated;
}

async function translateWithRetry(text: string): Promise<string> {
  for (let i = 1; i <= TRANSLATE_MAX_ATTEMPTS; i += 1) {
    try {
      return await translateEnToHe(text);
    } catch (error) {
      if (i === TRANSLATE_MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(TRANSLATE_BACKOFF_MS * i);
    }
  }
  throw new Error('Unreachable translation failure');
}

/**
 * Runs a pool of workers over items with limited concurrency.
 */
async function runPool(
  items: Array<{ index: number; text: string }>,
  worker: (item: { index: number; text: string }) => Promise<void>,
  concurrency: number,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: concurrency }).map(async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        break;
      }
      await worker(items[index]);
    }
  });
  await Promise.all(runners);
}

async function main(): Promise<void> {
  const inPath = resolvePath(getArg('file'), DEFAULT_IN_PATH);
  const outPath = resolvePath(getArg('out'), DEFAULT_OUT_PATH);
  const concurrencyArg = Number(
    getArg('concurrency') ?? String(DEFAULT_CONCURRENCY),
  );
  const concurrency = Number.isFinite(concurrencyArg)
    ? Math.min(Math.max(concurrencyArg, 1), MAX_CONCURRENCY)
    : DEFAULT_CONCURRENCY;

  if (!fs.existsSync(inPath)) {
    throw new Error(`Input CSV not found: ${inPath}`);
  }

  const parsed = rowsToCatalogI18nRows(
    parseCsv(fs.readFileSync(inPath, 'utf8')),
  ) as CatalogI18nCsvRow[];
  const cache = new Map<string, string>();
  const targets: Array<{ index: number; text: string }> = [];

  parsed.forEach((row, index) => {
    if (row.he_name.trim().length > 0) return;
    const text = row.en_name.trim();
    if (text.length === 0) return;
    targets.push({ index, text });
  });

  let completed = 0;
  let failed = 0;

  await runPool(
    targets,
    async ({ index, text }) => {
      try {
        let translated = cache.get(text);
        if (!translated) {
          translated = await translateWithRetry(text);
          cache.set(text, translated);
        }
        parsed[index].he_name = translated;
      } catch (error) {
        failed += 1;
        console.error(
          `Translation failed for row index ${index} (en_name="${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"):`,
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        completed += 1;
        if (
          completed % PROGRESS_LOG_INTERVAL === 0 ||
          completed === targets.length
        ) {
          console.log(
            `Progress: ${completed}/${targets.length} translated (failed: ${failed})`,
          );
        }
      }
    },
    concurrency,
  );

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, toCsv(parsed), 'utf8');

  console.log(`Saved translated CSV: ${outPath}`);
  console.log(`Rows translated: ${targets.length - failed}`);
  console.log(`Rows failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Auto-translate failed:', error);
  process.exitCode = 1;
});
