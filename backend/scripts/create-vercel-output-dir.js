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

const { renderStoreLinks } = require('../../website/store-links.cjs');

const OUTPUT_DIR = path.join(__dirname, '..', 'public');
const REPO_ROOT = path.join(__dirname, '..', '..');
const STATIC_LEGAL_DIR = path.join(REPO_ROOT, 'static-legal');
const WEBSITE_DIR = path.join(REPO_ROOT, 'website');
const LEGACY_STATIC_WEB_DIR = path.join(__dirname, '..', 'static-web');
const SENTINEL_FILE = path.join(OUTPUT_DIR, '.keep');

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(SENTINEL_FILE, '');

const sourceDir = fs.existsSync(STATIC_LEGAL_DIR)
  ? STATIC_LEGAL_DIR
  : LEGACY_STATIC_WEB_DIR;

function copyStaticAsset(src, dest, options = {}) {
  const {
    skipNames = new Set(),
    allowedExtensions = /\.(html|css|js|mjs|png|jpe?g|webp|svg)$/i,
    transformContent,
  } = options;
  const stat = fs.statSync(src);
  const baseName = path.basename(src);

  if (skipNames.has(baseName) || baseName.includes('.test.')) {
    return;
  }

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      if (child.startsWith('.')) {
        continue;
      }
      copyStaticAsset(path.join(src, child), path.join(dest, child), options);
    }
    return;
  }

  if (!allowedExtensions.test(src)) {
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const content = transformContent?.(src, fs.readFileSync(src));
  if (content !== undefined) {
    fs.writeFileSync(dest, content);
    return;
  }

  fs.copyFileSync(src, dest);
}

if (fs.existsSync(sourceDir)) {
  for (const name of fs.readdirSync(sourceDir)) {
    if (name.startsWith('.')) {
      continue;
    }
    copyStaticAsset(path.join(sourceDir, name), path.join(OUTPUT_DIR, name));
  }
  console.log(`[vercel-build] Copied ${path.relative(REPO_ROOT, sourceDir)} → public`);
} else {
  console.warn(
    '[vercel-build] No static-legal/ or static-web/ directory found; public/ only has .keep',
  );
}

if (fs.existsSync(WEBSITE_DIR)) {
  for (const name of fs.readdirSync(WEBSITE_DIR)) {
    if (name.startsWith('.')) {
      continue;
    }
    copyStaticAsset(path.join(WEBSITE_DIR, name), path.join(OUTPUT_DIR, name), {
      skipNames: new Set(['README.md', 'store-links.cjs', 'validate-landing.mjs', 'vercel.json']),
      transformContent: (src, content) => {
        if (path.basename(src) !== 'index.html') {
          return undefined;
        }

        return renderStoreLinks(content.toString('utf8'));
      },
    });
  }
  console.log(`[vercel-build] Copied ${path.relative(REPO_ROOT, WEBSITE_DIR)} → public`);
}

console.log(`[vercel-build] Created output directory: ${OUTPUT_DIR}`);
