import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
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

  app.setGlobalPrefix('api/v1');

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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kitchen Hub API')
    .setDescription('API documentation for Kitchen Hub backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  
  await SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Kitchen Hub API Docs',
  });

  await app.listen(config.port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${config.port}/api/v1`);
  console.log(`Swagger documentation: http://localhost:${config.port}/api/docs`);
}

void bootstrap();
