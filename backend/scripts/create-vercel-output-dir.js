/**
 * create-vercel-output-dir.js
 *
 * Creates the `public/` output directory that vercel.json#outputDirectory
 * expects.  Vercel requires a non-empty output directory; we place a `.keep`
 * sentinel so git and the build step do not complain about an empty folder.
 *
 * Run automatically as part of the `vercel-build` npm script.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const SENTINEL_FILE = path.join(OUTPUT_DIR, '.keep');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(SENTINEL_FILE, '');

console.log(`[vercel-build] Created output directory: ${OUTPUT_DIR}`);
