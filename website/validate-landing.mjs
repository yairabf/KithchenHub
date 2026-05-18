import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { getPublicStoreUrls, renderStoreLinks } = require('./store-links.cjs');

const html = renderStoreLinks(await readFile(path.join(__dirname, 'index.html'), 'utf8'));
const css = await readFile(path.join(__dirname, 'styles.css'), 'utf8');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
assert.doesNotMatch(html, /TODO_APP_STORE_URL|TODO_GOOGLE_PLAY_URL/, 'store badge placeholders should not ship');
const { appStore: appStoreUrl, googlePlay: googlePlayUrl } = getPublicStoreUrls();
assert.equal(html.match(new RegExp(`href="${escapeRegex(appStoreUrl)}"`, 'g'))?.length, 2, 'both App Store badges should link to the live listing');
assert.equal(html.match(new RegExp(`href="${escapeRegex(googlePlayUrl)}"`, 'g'))?.length, 2, 'both Google Play badges should link to the live listing');
assert.match(html, /<footer[\s\S]*href="\/privacy"/, 'footer should link to the same-site Privacy route');
assert.match(html, /<footer[\s\S]*href="\/terms"/, 'footer should link to the same-site Terms route');
assert.match(html, /<footer[\s\S]*href="\/delete-account"/, 'footer should link to the same-site Delete account route');
for (const legalPage of ['privacy.html', 'terms.html', 'delete-account.html', 'support.html']) {
  await access(path.join(__dirname, legalPage));
}
for (const assetPath of [
  'assets/legal/delete-account/01-open-settings.jpg',
  'assets/legal/delete-account/02-scroll-to-delete-account.jpg',
  'assets/legal/delete-account/03-confirm-delete-account.jpg',
]) {
  await access(path.join(__dirname, assetPath));
}
assert.match(css, /@media\s*\(max-width:\s*640px\)/, 'mobile layout media query should exist');
assert.match(css, /\.hero\s*\{[\s\S]*min-height:\s*100vh/, 'hero should fill the first viewport like the approved mockup');

console.log('Landing page validation passed.');
