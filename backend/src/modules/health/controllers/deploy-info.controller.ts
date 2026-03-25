import { Controller, Get } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { Public } from '../../../common/decorators/public.decorator';

type DeployInfoResponse = {
  gitSha?: string;
  deploymentId?: string;
  environment?: string;
  appVersion?: string;
};

function readVersionJsonFromRepoRoot(): string | undefined {
  const candidates = [
    path.resolve(process.cwd(), 'version.json'),
    path.resolve(process.cwd(), '..', 'version.json'),
    path.resolve(__dirname, '../../../../../version.json'),
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        version?: unknown;
      };
      if (typeof parsed.version === 'string' && parsed.version.trim()) {
        return parsed.version.trim();
      }
    } catch {
      // best-effort only; do not fail health endpoints
    }
  }

  return undefined;
}

function resolveAppVersion(): string | undefined {
  const fromEnv = process.env.APP_VERSION;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv.trim();

  return readVersionJsonFromRepoRoot();
}

function resolveGitSha(): string | undefined {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.GIT_SHA;
  return typeof sha === 'string' && sha.trim() ? sha.trim() : undefined;
}

/**
 * Deployment metadata endpoint.
 *
 * This endpoint is intentionally public and intentionally separate from API-version discovery
 * so external deployment tooling can compare "what is deployed" against `main`.
 */
@Controller({ path: 'deploy-info', version: '1' })
@Public()
export class DeployInfoController {
  @Get()
  getDeployInfo(): DeployInfoResponse {
    const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
    const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV;

    return {
      gitSha: resolveGitSha(),
      deploymentId:
        typeof deploymentId === 'string' && deploymentId.trim()
          ? deploymentId.trim()
          : undefined,
      environment:
        typeof environment === 'string' && environment.trim()
          ? environment.trim()
          : undefined,
      appVersion: resolveAppVersion(),
    };
  }
}
