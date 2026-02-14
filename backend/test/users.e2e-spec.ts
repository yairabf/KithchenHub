import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { TEST_CONSTANTS } from './utils/test-constants';
import * as request from 'supertest';

/**
 * E2E tests for users module (account deletion and data export).
 * Tests authentication requirements and basic response codes.
 */
describe('Users API E2E', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /v1/users/me/export', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`${TEST_CONSTANTS.API_URL}/users/me/export`)
        .expect(401);

      expect(response.body).toBeDefined();
    });
  });

  describe('DELETE /v1/users/me', () => {
    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .delete(`${TEST_CONSTANTS.API_URL}/users/me`)
        .expect(401);
    });
  });
});
