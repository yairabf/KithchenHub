import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

// Mock SentryService module to avoid loading dependency that might be missing in environment
jest.mock('../monitoring/sentry.service', () => ({
    SentryService: class {
        captureException = jest.fn();
    }
}));

import { SentryExceptionFilter } from './sentry-exception.filter';
import { SentryService } from '../monitoring/sentry.service';

describe('SentryExceptionFilter', () => {
    let filter: SentryExceptionFilter;
    let sentryService: SentryService;

    const mockSentryService = {
        captureException: jest.fn(),
    };

    const mockRequest = {
        method: 'POST',
        url: '/test',
        body: { password: 'secret', data: 'public' },
        headers: { 'authorization': 'Bearer token', 'content-type': 'application/json' },
        requestId: 'req-123',
        user: { id: 'user-123', householdId: 'house-123' },
        query: { q: 'search' },
    };

    const mockResponse = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };

    const mockHttpContext = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
    };

    const mockArgumentsHost = {
        switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as unknown as ArgumentsHost;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SentryExceptionFilter,
                {
                    provide: SentryService,
                    useValue: mockSentryService,
                },
            ],
        }).compile();

        filter = module.get<SentryExceptionFilter>(SentryExceptionFilter);
        sentryService = module.get<SentryService>(SentryService);
    });

    it('should be defined', () => {
        expect(filter).toBeDefined();
    });

    it('should catch HttpException and send response without reporting to Sentry for 4xx errors', () => {
        const exception = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Bad Request'
        }));
        expect(sentryService.captureException).not.toHaveBeenCalled();
    });

    it('should catch Error and report to Sentry for 5xx/unknown errors', () => {
        const error = new Error('Database connection failed');

        filter.catch(error, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith(expect.objectContaining({
            success: false,
            error: 'Database connection failed'
        }));
        expect(sentryService.captureException).toHaveBeenCalledWith(
            error,
            expect.objectContaining({
                userId: 'user-123',
                householdId: 'house-123',
                requestId: 'req-123',
                tags: expect.objectContaining({
                    method: 'POST',
                    path: '/test',
                    statusCode: '500'
                }),
                extra: expect.objectContaining({
                    body: expect.objectContaining({
                        password: '[REDACTED]',
                        data: 'public'
                    }),
                    headers: expect.objectContaining({
                        authorization: '[REDACTED]',
                        'content-type': 'application/json'
                    })
                })
            })
        );
    });

    it('should handle HttpException with object response', () => {
        const exception = new HttpException({ message: 'Validation failed' }, HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Validation failed'
        }));
    });

    it('should handle HttpException with array of messages', () => {
        const exception = new HttpException({ message: ['Name is required', 'Email invalid'] }, HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Name is required'
        }));
    });
});
