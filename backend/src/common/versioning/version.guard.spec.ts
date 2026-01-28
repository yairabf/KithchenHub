import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { VersionGuard } from './version.guard';
import {
  SUPPORTED_API_VERSIONS,
  DEPRECATED_API_VERSIONS,
  SUNSET_API_VERSIONS,
} from './api-version.constants';
import { VersionedRequest } from './version.utils';

describe('VersionGuard', () => {
  let guard: VersionGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VersionGuard],
    }).compile();

    guard = module.get<VersionGuard>(VersionGuard);
  });

  const createMockExecutionContext = (url: string): ExecutionContext => {
    const request: VersionedRequest = {
      url,
      version: url.match(/\/v(\d+)\//)?.[1] || null,
    } as VersionedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it.each(SUPPORTED_API_VERSIONS.map((v) => [`/api/v${v}/auth/sync`, v]))(
      'should allow requests for supported version %s',
      (url) => {
        const context = createMockExecutionContext(url);
        expect(() => guard.canActivate(context)).not.toThrow();
        expect(guard.canActivate(context)).toBe(true);
      },
    );

    it('should throw NotFoundException for unknown/unsupported versions', () => {
      const context = createMockExecutionContext('/api/v999/auth/sync');
      expect(() => guard.canActivate(context)).toThrow(NotFoundException);
      try {
        guard.canActivate(context);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'API version 999 is not supported',
        );
      }
    });

    it.each(
      SUNSET_API_VERSIONS.length > 0
        ? SUNSET_API_VERSIONS.map((v) => [`/api/v${v}/auth/sync`, v])
        : [['/api/v999/auth/sync', '999']], // Dummy test when no sunset versions
    )('should throw GoneException for sunset version %s', (url, version) => {
      // Skip test if no sunset versions exist
      if (SUNSET_API_VERSIONS.length === 0) {
        return;
      }
      const context = createMockExecutionContext(url);
      expect(() => guard.canActivate(context)).toThrow(GoneException);
      expect(() => guard.canActivate(context)).toThrow(
        expect.stringContaining(`API version ${version} has been sunset`),
      );
    });

    it('should throw NotFoundException for requests without version in URL', () => {
      const context = createMockExecutionContext('/api/auth/sync');
      expect(() => guard.canActivate(context)).toThrow(NotFoundException);
      try {
        guard.canActivate(context);
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toContain(
          'API version is required',
        );
      }
    });

    it('should allow deprecated versions (deprecation headers added by interceptor)', () => {
      DEPRECATED_API_VERSIONS.forEach((version) => {
        const context = createMockExecutionContext(
          `/api/v${version}/auth/sync`,
        );
        expect(() => guard.canActivate(context)).not.toThrow();
        expect(guard.canActivate(context)).toBe(true);
      });
    });
  });
});
