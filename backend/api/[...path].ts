import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';
import * as Sentry from '@sentry/node';
import type { RouteOptions } from 'fastify';
import type { InjectOptions } from 'light-my-request';

import { AppModule } from '../src/app.module';
import { loadConfiguration } from '../src/config/configuration';
import { RECIPE_IMAGE_MAX_SIZE_BYTES } from '../src/common/constants';

export const config = {
  api: {
    bodyParser: false,
  },
};

let appPromise: Promise<NestFastifyApplication> | null = null;

function normalizeRequestHeaders(req: VercelRequest): void {
  const entries = Object.entries(req.headers ?? {});
  const normalizedHeaders: Record<string, string | string[] | undefined> = {};

  for (const [headerName, headerValue] of entries) {
    normalizedHeaders[headerName.toLowerCase()] = headerValue;
  }

  req.headers = normalizedHeaders;
}

function normalizeRequestUrl(req: VercelRequest): void {
  const requestUrl = req.url ?? '/';
  if (requestUrl.startsWith('/api')) {
    return;
  }

  req.url = requestUrl.startsWith('/')
    ? `/api${requestUrl}`
    : `/api/${requestUrl}`;
}

async function readRequestPayload(req: VercelRequest): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks);
}

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
    // @fastify/multipart registers preParsing hooks; ensure each route has an array so
    // Fastify can merge plugin + route hooks without treating `undefined` as iterable.
    fastifyAdapter.getInstance().addHook('onRoute', (routeOptions: RouteOptions) => {
      if (routeOptions.preParsing === undefined) {
        routeOptions.preParsing = [];
      }
    });
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
    normalizeRequestHeaders(req);
    normalizeRequestUrl(req);
    const app = await getApp();
    const fastifyInstance = app.getHttpAdapter().getInstance();
    const payload = await readRequestPayload(req);

    const injectOptions: InjectOptions = {
      method: (req.method ?? 'GET') as NonNullable<InjectOptions['method']>,
      url: req.url ?? '/',
      headers: req.headers,
      payload,
    };
    const response = await fastifyInstance.inject(injectOptions);

    for (const [headerName, headerValue] of Object.entries(response.headers)) {
      if (headerValue !== undefined) {
        res.setHeader(headerName, headerValue);
      }
    }

    res.status(response.statusCode).send(response.rawPayload);
  } catch (err) {
    // eslint-disable-next-line no-console -- serverless runtime logs to stdout
    console.error('Vercel handler error:', err);
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : 'Server bootstrap failed',
    });
  }
}

