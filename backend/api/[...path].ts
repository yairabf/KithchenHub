import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import * as Sentry from '@sentry/node';

import { AppModule } from '../src/app.module';
import { loadConfiguration } from '../src/config/configuration';
import { RECIPE_IMAGE_MAX_SIZE_BYTES } from '../src/common/constants';

export const config = {
  api: {
    bodyParser: false,
  },
};

let appPromise: Promise<NestFastifyApplication> | null = null;

function initializeSentry(): void {
  const config = loadConfiguration();
  if (!config.sentry?.dsn) return;

  try {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment || config.env,
      tracesSampleRate: config.sentry.tracesSampleRate,
      ignoreTransactions: ['GET /api/health', 'GET /api/health/live'],
    });
  } catch (error) {
    // Sentry is optional; do not fail cold start.
    // eslint-disable-next-line no-console
    console.error('Failed to initialize Sentry:', error);
  }
}

async function getApp(): Promise<NestFastifyApplication> {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    // eslint-disable-next-line no-console -- serverless cold-start log for Vercel runtime visibility
    console.log('[Vercel] Bootstrapping Kitchen Hub API...');
    initializeSentry();

    const fastifyAdapter = new FastifyAdapter();
    await fastifyAdapter.register(multipart, {
      limits: { fileSize: RECIPE_IMAGE_MAX_SIZE_BYTES },
    });

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      fastifyAdapter,
      { logger: ['error', 'warn', 'log'] },
    );

    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    return app;
  })();

  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await getApp();
    const fastifyInstance = app.getHttpAdapter().getInstance();

    // fastifyInstance.routing() is synchronous from the caller's perspective but
    // drives an async pipeline internally.  We wrap it in a Promise that resolves
    // once Node.js finishes writing the response so the Vercel function container
    // is not recycled before the reply is fully sent.
    await new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      // Use fastify.routing() directly instead of server.emit('request').
      // Fastify only registers its 'request' event listener when listen() is
      // called (which we never call in serverless). routing() bypasses the
      // event emitter and invokes Fastify's router directly.
      fastifyInstance.routing(req, res);
    });
  } catch (err) {
    // eslint-disable-next-line no-console -- serverless runtime logs to stdout
    console.error('Vercel handler error:', err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Server bootstrap failed',
    });
  }
}

