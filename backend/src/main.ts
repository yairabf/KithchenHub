import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { loadConfiguration } from './config/configuration';

/**
 * Initialize Sentry before NestJS bootstrap to capture early errors.
 */
function initializeSentry(config: ReturnType<typeof loadConfiguration>): void {
  if (!config.sentry?.dsn) {
    // Sentry is optional - gracefully degrade if not configured
    return;
  }

  try {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.sentry.environment || config.env,
      tracesSampleRate: config.sentry.tracesSampleRate,
      // HTTP request tracing is automatically enabled in Sentry v8
      // Filter out health check endpoints from performance monitoring
      ignoreTransactions: ['GET /api/health', 'GET /api/health/live'],
    });
  } catch (error) {
    // Log error but don't fail application startup
    console.error('Failed to initialize Sentry:', error);
  }
}

async function bootstrap(): Promise<void> {
  try {
    console.log('🚀 Starting Kitchen Hub Backend API...');
    const config = loadConfiguration();
    console.log(
      `📋 Configuration loaded - Port: ${config.port}, Env: ${config.env}`,
    );

    // Initialize Sentry early to capture bootstrap errors
    initializeSentry(config);

    console.log('🔨 Creating NestJS application...');
    const fastifyAdapter = new FastifyAdapter();
    await fastifyAdapter.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    });

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      fastifyAdapter,
    );
    console.log('✅ NestJS application created');

    // Set global prefix to 'api' (version will be in path: /api/v1, /api/v2, etc.)
    console.log('🔧 Setting global prefix to "api"...');
    app.setGlobalPrefix('api');

    // Enable URI-based versioning
    // No defaultVersion - require explicit /api/v1/* or /api/v2/* URLs
    // This ensures canonical URLs and prevents /api/* ambiguity
    console.log('🔧 Enabling URI-based versioning...');
    app.enableVersioning({
      type: VersioningType.URI,
    });

    console.log('🔧 Enabling CORS...');
    app.enableCors({
      origin: true,
      credentials: true,
    });

    console.log('🔧 Setting up global pipes...');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Global filters and interceptors are configured in AppModule
    // via APP_FILTER and APP_INTERCEPTOR providers

    // Create Swagger document for v1
    // Note: NestJS Swagger automatically filters routes by version when versioning is enabled.
    // Since all controllers are marked with version: '1', only v1 routes will be included.
    // When v2 is added, create a separate document with version: '2' filter.
    // Swagger setup - temporarily disabled due to @fastify/static dependency issue
    // TODO: Install @fastify/static package or configure Swagger differently
    console.log(
      '📚 Skipping Swagger setup (requires @fastify/static package)...',
    );
    // Uncomment when @fastify/static is installed:
    /*
    try {
      const swaggerConfigV1 = new DocumentBuilder()
        .setTitle('Kitchen Hub API')
        .setDescription('API documentation for Kitchen Hub backend - Version 1')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const documentV1 = SwaggerModule.createDocument(app, swaggerConfigV1, {
        operationIdFactory: (controllerKey: string, methodKey: string) =>
          methodKey,
      });

      await SwaggerModule.setup('api/docs/v1', app, documentV1, {
        customSiteTitle: 'Kitchen Hub API Docs - v1',
      });
      console.log('✅ Swagger documentation setup complete');
    } catch (swaggerError) {
      console.warn('⚠️ Swagger setup failed (non-critical):', swaggerError);
    }
    */

    // Optional: Create index page for docs (future: can list all versions)
    // For now, just document v1

    // Bind to process.env.PORT on 0.0.0.0 for cloud platforms (e.g. Cloud Run) and local.
    console.log(`🌐 Starting server on port ${config.port}...`);
    await app.listen(config.port, '0.0.0.0');
    console.log('✅ Server started successfully!');
    console.log(
      `\n🎉 Application is running on: http://localhost:${config.port}/api/v1`,
    );
    console.log('📖 Swagger documentation: disabled (missing @fastify/static)');
    console.log(
      `🔍 Version discovery: http://localhost:${config.port}/api/version`,
    );
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Unhandled error in bootstrap:', error);
  process.exit(1);
});
