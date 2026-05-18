import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = await readFile(path.join(__dirname, 'index.html'), 'utf8');
const css = await readFile(path.join(__dirname, 'styles.css'), 'utf8');

const requiredAssetPaths = [
  'assets/fullhouse_logo_white_cropped.png',
  'assets/screenshots/shopping-list.png',
  'assets/screenshots/recipes.png',
  'assets/screenshots/chores.png',
  'assets/screenshots/household-profile.png',
];

for (const assetPath of requiredAssetPaths) {
  await access(path.join(__dirname, assetPath));
  assert.match(html, new RegExp(assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${assetPath} should be referenced by index.html`);
}

assert.match(html, /<body[^>]*>[\s\S]*?<div class="top">/, 'landing should start with the top-left FullHouse brand header');
assert.match(html, /Your Household\s+manager/, 'hero headline should match the approved mockup');
assert.match(html, /Download on the[\s\S]*App Store/, 'App Store badge copy should be present');
assert.match(html, /GET IT ON[\s\S]*Google Play/, 'Google Play badge copy should be present');
assert.match(html, /TODO_APP_STORE_URL/, 'App Store placeholder constant should be clearly named');
assert.match(html, /TODO_GOOGLE_PLAY_URL/, 'Google Play placeholder constant should be clearly named');
assert.match(html, /href="https:\/\/kithchensync1\.vercel\.app\/privacy"/, 'footer should link to the live Privacy page');
assert.match(html, /href="https:\/\/kithchensync1\.vercel\.app\/terms"/, 'footer should link to the live Terms page');
assert.match(html, /href="https:\/\/kithchensync1\.vercel\.app\/delete-account"/, 'footer should link to the live Delete account page');
assert.match(css, /@media\s*\(max-width:\s*640px\)/, 'mobile layout media query should exist');
assert.match(css, /\.hero\s*\{[\s\S]*min-height:\s*100vh/, 'hero should fill the first viewport like the approved mockup');

console.log('Landing page validation passed.');
