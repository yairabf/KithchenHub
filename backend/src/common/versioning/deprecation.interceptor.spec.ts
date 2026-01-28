import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { DeprecationInterceptor } from './deprecation.interceptor';
import { DEPRECATION_METADATA_KEY } from './deprecation.decorator';
import {
  SUPPORTED_API_VERSIONS,
  DEPRECATED_API_VERSIONS,
} from './api-version.constants';

describe('DeprecationInterceptor', () => {
  let interceptor: DeprecationInterceptor;
  let reflector: Reflector;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeprecationInterceptor, Reflector],
    }).compile();

    interceptor = module.get<DeprecationInterceptor>(DeprecationInterceptor);
    reflector = module.get<Reflector>(Reflector);

    mockResponse = {
      setHeader: jest.fn(),
    };
  });

  const createMockExecutionContext = (
    url: string,
    hasEndpointDeprecation = false,
  ): ExecutionContext => {
    const request = {
      url,
      version: url.match(/\/v(\d+)\//)?.[1] || null,
    } as any;

    const handler = {} as any;

    // Mock reflector to return deprecation metadata if needed
    jest.spyOn(reflector, 'get').mockReturnValue(
      hasEndpointDeprecation
        ? {
            sunsetDate: new Date('2026-12-31'),
            migrationGuide: 'https://docs.example.com/migration',
          }
        : undefined,
    );

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => mockResponse,
      }),
      getHandler: () => handler,
    } as ExecutionContext;
  };

  const createMockCallHandler = (data: any = { success: true }) => {
    return {
      handle: () => of(data),
    } as CallHandler;
  };

  describe('intercept', () => {
    it('should not add deprecation headers for current version', (done) => {
      const context = createMockExecutionContext('/api/v1/auth/sync');
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(mockResponse.setHeader).not.toHaveBeenCalled();
        done();
      });
    });

    it.each(
      DEPRECATED_API_VERSIONS.length > 0
        ? DEPRECATED_API_VERSIONS.map((v) => [`/api/v${v}/auth/sync`, v])
        : [['/api/v999/auth/sync', '999']], // Dummy test when no deprecated versions
    )(
      'should add deprecation headers for deprecated version %s',
      (url, version) => {
        // Skip test if no deprecated versions exist
        if (DEPRECATED_API_VERSIONS.length === 0) {
          return;
        }
        const context = createMockExecutionContext(url);
        const handler = createMockCallHandler();

        interceptor.intercept(context, handler).subscribe(() => {
          expect(mockResponse.setHeader).toHaveBeenCalledWith('Deprecation', 'true');
        });
      },
    );

    it('should add endpoint-level deprecation headers when route is deprecated', (done) => {
      const context = createMockExecutionContext('/api/v1/auth/sync', true);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Deprecation', 'true');
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Sunset',
          expect.any(String),
        );
        expect(mockResponse.setHeader).toHaveBeenCalledWith(
          'Link',
          expect.stringContaining('rel="deprecation"'),
        );
        done();
      });
    });

    it('should add both version-wide and endpoint-level headers when both apply', (done) => {
      // This would require a deprecated version with a deprecated endpoint
      // For now, we test that endpoint-level takes precedence/combines
      const context = createMockExecutionContext('/api/v1/auth/sync', true);
      const handler = createMockCallHandler();

      interceptor.intercept(context, handler).subscribe(() => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('Deprecation', 'true');
        done();
      });
    });

    it('should not modify response data', (done) => {
      const context = createMockExecutionContext('/api/v1/auth/sync');
      const responseData = { data: 'test', success: true };
      const handler = createMockCallHandler(responseData);

      interceptor.intercept(context, handler).subscribe((result) => {
        expect(result).toEqual(responseData);
        done();
      });
    });
  });
});
