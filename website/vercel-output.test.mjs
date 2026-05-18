import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const appStoreUrl = 'https://apps.apple.com/us/app/example/id123';
const googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.example.fullhouse';

describe('create-vercel-output-dir', () => {
  it('renders landing store links from sanitized Vercel environment variables', async () => {
    const result = spawnSync(process.execPath, ['backend/scripts/create-vercel-output-dir.js'], {
      cwd: new URL('..', import.meta.url),
      env: {
        ...process.env,
        FULLHOUSE_APP_STORE_URL: appStoreUrl,
        FULLHOUSE_GOOGLE_PLAY_URL: googlePlayUrl,
      },
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const html = await readFile(new URL('../backend/public/index.html', import.meta.url), 'utf8');
    assert.equal(html.match(new RegExp(`href="${appStoreUrl}"`, 'g'))?.length, 2);
    assert.equal(html.match(new RegExp(`href="${googlePlayUrl.replace('?', '\\?')}"`, 'g'))?.length, 2);
  });
});
