/**
 * migrate-catalog-images-to-public-assets.ts
 *
 * Migrates all files from the standalone `items_images` Supabase Storage bucket
 * to the `public-assets` bucket under the `items_images/` prefix.
 *
 * Why: The backend's CATALOG_ICONS_BASE_URL points to the `public-assets` bucket,
 * so image URLs are constructed as:
 *   https://<project>.supabase.co/storage/v1/object/public/public-assets/items_images/<file>
 *
 * The actual files currently live at:
 *   https://<project>.supabase.co/storage/v1/object/public/items_images/<file>
 *
 * This script closes that gap by copying every file (recursively) to the
 * correct location, then reports a summary.
 *
 * Usage (from backend/):
 *   npm run migrate:catalog-images
 *
 * The original `items_images` bucket is left untouched — delete it manually
 * once you have verified all images load correctly.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SOURCE_BUCKET = 'items_images';
const DESTINATION_BUCKET = 'public-assets';
const DESTINATION_PREFIX = 'items_images';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌  SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Recursively lists every file path inside `bucket` under `folderPath`.
 * Returns plain file paths (no leading slash).
 */
const PAGE_SIZE = 1000;

/**
 * Recursively lists every file path inside `bucket` under `folderPath`.
 * Paginates through all pages so buckets with > 1000 files are fully covered.
 * Returns plain file paths (no leading slash).
 */
async function listAllFiles(
  bucket: string,
  folderPath = '',
): Promise<string[]> {
  const files: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, { limit: PAGE_SIZE, offset });

    if (error) {
      throw new Error(
        `Failed to list "${bucket}/${folderPath}" at offset ${offset}: ${error.message}`,
      );
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const item of data) {
      const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;

      if (item.id == null) {
        // Folder — recurse
        const nested = await listAllFiles(bucket, itemPath);
        files.push(...nested);
      } else {
        // File
        files.push(itemPath);
      }
    }

    if (data.length < PAGE_SIZE) {
      break; // last page
    }

    offset += PAGE_SIZE;
  }

  return files;
}

/**
 * Downloads a file from `sourceBucket/sourcePath` and uploads it to
 * `destinationBucket/destinationPath` if it does not already exist there.
 * Returns `'copied'`, `'skipped'` (already exists), or `'failed'`.
 */
async function copyFile(
  sourcePath: string,
  destinationPath: string,
): Promise<'copied' | 'skipped' | 'failed'> {
  // Check if destination already exists (avoid duplicate uploads)
  const { data: existing } = await supabase.storage
    .from(DESTINATION_BUCKET)
    .list(path.dirname(destinationPath), { search: path.basename(destinationPath) });

  if (existing && existing.some((f) => f.name === path.basename(destinationPath))) {
    return 'skipped';
  }

  // Download from source
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(SOURCE_BUCKET)
    .download(sourcePath);

  if (downloadError || !fileData) {
    console.error(`  ↳ Download failed: ${downloadError?.message}`);
    return 'failed';
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  // Upload to destination
  const { error: uploadError } = await supabase.storage
    .from(DESTINATION_BUCKET)
    .upload(destinationPath, buffer, {
      contentType: fileData.type || 'image/png',
      upsert: false,
    });

  if (uploadError) {
    console.error(`  ↳ Upload failed: ${uploadError.message}`);
    return 'failed';
  }

  return 'copied';
}

async function run(): Promise<void> {
  console.log('📦  Catalog image migration');
  console.log(`   Source:      ${SOURCE_BUCKET}/`);
  console.log(
    `   Destination: ${DESTINATION_BUCKET}/${DESTINATION_PREFIX}/\n`,
  );

  console.log(`🔍  Listing files in "${SOURCE_BUCKET}"...`);
  const files = await listAllFiles(SOURCE_BUCKET);

  if (files.length === 0) {
    console.log('⚠️   No files found in source bucket. Nothing to migrate.');
    return;
  }

  console.log(`   Found ${files.length} file(s).\n`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  const failedPaths: string[] = [];

  for (const [index, filePath] of files.entries()) {
    const destinationPath = `${DESTINATION_PREFIX}/${filePath}`;
    const progress = `[${String(index + 1).padStart(String(files.length).length, ' ')}/${files.length}]`;

    process.stdout.write(`${progress}  ${filePath}  →  ${destinationPath}  `);

    const result = await copyFile(filePath, destinationPath);

    if (result === 'copied') {
      console.log('✅ copied');
      copied++;
    } else if (result === 'skipped') {
      console.log('⏭  skipped (already exists)');
      skipped++;
    } else {
      console.log('❌ failed');
      failed++;
      failedPaths.push(filePath);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`✅  Copied:  ${copied}`);
  console.log(`⏭   Skipped: ${skipped}`);
  console.log(`❌  Failed:  ${failed}`);

  if (failedPaths.length > 0) {
    console.log('\nFailed files:');
    failedPaths.forEach((p) => console.log(`  • ${p}`));

    const artifactPath = path.join(__dirname, '..', 'output', 'migration-failed-files.json');
    fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
    fs.writeFileSync(artifactPath, JSON.stringify({ failedPaths }, null, 2));
    console.log(`\n📄  Failed paths written to: ${artifactPath}`);
    console.log('   Re-run the script to retry only the failed files, or inspect the JSON for manual remediation.');

    process.exit(1);
  }

  console.log(
    `\n✔  Migration complete. The original "${SOURCE_BUCKET}" bucket has NOT been deleted.`,
  );
  console.log(
    '   Verify images load correctly, then delete the bucket from the Supabase dashboard.',
  );
}

run().catch((err) => {
  console.error('❌  Fatal error:', err);
  process.exit(1);
});
