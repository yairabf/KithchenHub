import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadConfiguration } from './config/configuration';
import { HttpExceptionFilter } from './common/filters';
import { TransformInterceptor } from './common/interceptors';

async function bootstrap(): Promise<void> {
  const config = loadConfiguration();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Set global prefix to 'api' (version will be in path: /api/v1, /api/v2, etc.)
  app.setGlobalPrefix('api');

  // Enable URI-based versioning
  // No defaultVersion - require explicit /api/v1/* or /api/v2/* URLs
  // This ensures canonical URLs and prevents /api/* ambiguity
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Create Swagger document for v1
  // Note: NestJS Swagger automatically filters routes by version when versioning is enabled.
  // Since all controllers are marked with version: '1', only v1 routes will be included.
  // When v2 is added, create a separate document with version: '2' filter.
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

  // Optional: Create index page for docs (future: can list all versions)
  // For now, just document v1

  await app.listen(config.port, '0.0.0.0');
  console.log(
    `Application is running on: http://localhost:${config.port}/api/v1`,
  );
  console.log(
    `Swagger documentation (v1): http://localhost:${config.port}/api/docs/v1`,
  );
  console.log(
    `Version discovery: http://localhost:${config.port}/api/version`,
  );
}

void bootstrap();
