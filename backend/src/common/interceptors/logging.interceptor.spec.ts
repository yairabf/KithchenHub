import { Test, TestingModule } from '@nestjs/testing';
import { LoggingInterceptor } from './logging.interceptor';
import { StructuredLoggerService } from '../logger/structured-logger.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
    let interceptor: LoggingInterceptor;
    let loggerService: StructuredLoggerService;

    const mockLoggerService = {
        logWithContext: jest.fn(),
    };

    const mockRequest = {
        method: 'GET',
        url: '/test',
        requestId: 'req-123',
        user: { id: 'user-123' },
    };

    const mockResponse = {
        statusCode: 200,
    };

    const mockHttpContext = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
    };

    const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
        handle: jest.fn().mockReturnValue(of('response data')),
    } as unknown as CallHandler;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoggingInterceptor,
                {
                    provide: StructuredLoggerService,
                    useValue: mockLoggerService,
                },
            ],
        }).compile();

        interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
        loggerService = module.get<StructuredLoggerService>(StructuredLoggerService);
    });

    it('should be defined', () => {
        expect(interceptor).toBeDefined();
    });

    it('should log incoming request', (done) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
            next: () => {
                expect(loggerService.logWithContext).toHaveBeenCalledWith(
                    'info',
                    'Incoming request',
                    expect.objectContaining({
                        requestId: 'req-123',
                        method: 'GET',
                        url: '/test',
                        userId: 'user-123',
                    }),
                );
                done();
            },
            error: (err) => done(err),
        });
    });

    it('should log request completion on success', (done) => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
            next: () => {
                expect(loggerService.logWithContext).toHaveBeenCalledWith(
                    'info',
                    'Request completed',
                    expect.objectContaining({
                        requestId: 'req-123',
                        method: 'GET',
                        url: '/test',
                        statusCode: 200,
                        responseTime: expect.any(Number),
                        userId: 'user-123',
                    }),
                );
                done();
            },
            error: (err) => done(err),
        });
    });

    it('should log request failure on error', (done) => {
        const error = new Error('Test error');
        const mockErrorCallHandler = {
            handle: jest.fn().mockReturnValue(throwError(() => error)),
        } as unknown as CallHandler;

        mockResponse.statusCode = 500;

        interceptor.intercept(mockExecutionContext, mockErrorCallHandler).subscribe({
            next: () => {
                done(new Error('Should have thrown error'));
            },
            error: (err) => {
                expect(err).toBe(error);
                expect(loggerService.logWithContext).toHaveBeenCalledWith(
                    'error',
                    'Request failed',
                    expect.objectContaining({
                        requestId: 'req-123',
                        method: 'GET',
                        url: '/test',
                        statusCode: 500,
                        error: 'Test error',
                    })
                );
                done();
            }
        });
    });

    it('should handle missing request ID and user', (done) => {
        const minimalRequest = {
            method: 'POST',
            url: '/api/v1/auth',
        };

        const minimalHttpContext = {
            getRequest: jest.fn().mockReturnValue(minimalRequest),
            getResponse: jest.fn().mockReturnValue(mockResponse),
        };

        const minimalExecutionContext = {
            switchToHttp: jest.fn().mockReturnValue(minimalHttpContext),
        } as unknown as ExecutionContext;

        interceptor.intercept(minimalExecutionContext, mockCallHandler).subscribe({
            next: () => {
                expect(loggerService.logWithContext).toHaveBeenCalledWith(
                    'info',
                    'Incoming request',
                    expect.objectContaining({
                        requestId: 'unknown',
                        method: 'POST',
                        userId: undefined,
                    })
                );
                done();
            }
        });
    });
});
