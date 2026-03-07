/**
 * Runs Prisma CLI with env loaded from backend/.env.
 * Use so that prisma:deploy and prisma:generate always see DATABASE_URL/DIRECT_URL from backend/.env.
 */
const path = require('path');
const { config } = require('dotenv');
const { spawnSync } = require('child_process');

const backendRoot = path.join(__dirname, '..');
const envPath = path.join(backendRoot, '.env');

config({ path: envPath });

const args = process.argv.slice(2);
const prismaArgs = args.length
  ? args
  : ['migrate', 'deploy', '--schema=src/infrastructure/database/prisma/schema.prisma'];

const result = spawnSync(
  'npx',
  ['prisma', ...prismaArgs],
  {
    stdio: 'inherit',
    env: { ...process.env },
    cwd: backendRoot,
  }
);

process.exit(result.status ?? 1);
