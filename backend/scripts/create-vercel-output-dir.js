/**
 * create-vercel-output-dir.js
 *
 * Creates the `public/` output directory that vercel.json#outputDirectory
 * expects. Vercel requires a non-empty output directory; we place a `.keep`
 * sentinel and copy tracked static assets from the monorepo `static-legal/`
 * folder (privacy policy for App Store / Play URLs). Falls back to legacy
 * `backend/static-web/` if `static-legal/` is missing.
 *
 * Run automatically as part of the `vercel-build` npm script.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const REPO_ROOT = path.join(__dirname, '..', '..');
const STATIC_LEGAL_DIR = path.join(REPO_ROOT, 'static-legal');
const LEGACY_STATIC_WEB_DIR = path.join(__dirname, '..', 'static-web');
const SENTINEL_FILE = path.join(OUTPUT_DIR, '.keep');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(SENTINEL_FILE, '');

const sourceDir = fs.existsSync(STATIC_LEGAL_DIR)
  ? STATIC_LEGAL_DIR
  : LEGACY_STATIC_WEB_DIR;

if (fs.existsSync(sourceDir)) {
  for (const name of fs.readdirSync(sourceDir)) {
    if (name.startsWith('.')) {
      continue;
    }
    const src = path.join(sourceDir, name);
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      continue;
    }
    if (!name.endsWith('.html')) {
      continue;
    }
    const dest = path.join(OUTPUT_DIR, name);
    fs.copyFileSync(src, dest);
  }
  console.log(`[vercel-build] Copied ${path.relative(REPO_ROOT, sourceDir)} → public`);
} else {
  console.warn(
    '[vercel-build] No static-legal/ or static-web/ directory found; public/ only has .keep',
  );
}

console.log(`[vercel-build] Created output directory: ${OUTPUT_DIR}`);
