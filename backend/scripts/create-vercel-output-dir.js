/**
 * create-vercel-output-dir.js
 *
 * Creates the `public/` output directory that vercel.json#outputDirectory
 * expects. Vercel requires a non-empty output directory; we place a `.keep`
 * sentinel and copy tracked static assets from `static-web/` (e.g. privacy
 * policy for App Store / Play URLs).
 *
 * Run automatically as part of the `vercel-build` npm script.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const STATIC_WEB_DIR = path.join(__dirname, '..', 'static-web');
const SENTINEL_FILE = path.join(OUTPUT_DIR, '.keep');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(SENTINEL_FILE, '');

if (fs.existsSync(STATIC_WEB_DIR)) {
  for (const name of fs.readdirSync(STATIC_WEB_DIR)) {
    const src = path.join(STATIC_WEB_DIR, name);
    const dest = path.join(OUTPUT_DIR, name);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
  console.log(`[vercel-build] Copied static-web → public`);
}

console.log(`[vercel-build] Created output directory: ${OUTPUT_DIR}`);
