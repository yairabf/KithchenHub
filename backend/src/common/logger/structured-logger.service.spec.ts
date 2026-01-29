import { StructuredLoggerService } from './structured-logger.service';
import { AppConfig } from '../../config/configuration';
import pino from 'pino';

// Define the mock logger functions
const mockLoggerFunctions = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Mock pino with support for default import
jest.mock('pino', () => {
  const mPino = jest.fn(() => mockLoggerFunctions);
  const wrapper = mPino;
  // Add properties to the functions to act as namespace if needed
  (wrapper as any).stdTimeFunctions = { isoTime: jest.fn() };
  (wrapper as any).default = mPino; // For ES default import
  return wrapper;
});

describe('StructuredLoggerService', () => {
  let service: StructuredLoggerService;
  let mockConfig: AppConfig;

  beforeEach(() => {
    mockConfig = {
      env: 'production',
      logging: {
        level: 'info',
        format: 'json',
      },
    } as AppConfig;

    jest.clearAllMocks();

    // Create service instance
    service = new StructuredLoggerService(mockConfig);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize pino with correct options for production', () => {
      // Cast to jest.Mock to avoid TS errors
      expect(pino as unknown as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          timestamp: expect.any(Function),
        }),
      );
    });

    it('should try to use pino-pretty in development', () => {
      jest.resetModules();
      mockConfig.env = 'development';

      const devService = new StructuredLoggerService(mockConfig);
      expect(devService).toBeDefined();
    });
  });

  describe('log methods', () => {
    it('should call pino info for log', () => {
      service.log('test message', 'TestContext');
      expect(mockLoggerFunctions.info).toHaveBeenCalledWith(
        { context: 'TestContext' },
        'test message',
      );
    });

    it('should call pino error for error', () => {
      service.error('error message', 'stack trace', 'TestContext');
      expect(mockLoggerFunctions.error).toHaveBeenCalledWith(
        { context: 'TestContext', trace: 'stack trace' },
        'error message',
      );
    });

    it('should call pino warn for warn', () => {
      service.warn('warn message', 'TestContext');
      expect(mockLoggerFunctions.warn).toHaveBeenCalledWith(
        { context: 'TestContext' },
        'warn message',
      );
    });

    it('should call pino debug for debug', () => {
      service.debug('debug message', 'TestContext');
      expect(mockLoggerFunctions.debug).toHaveBeenCalledWith(
        { context: 'TestContext' },
        'debug message',
      );
    });

    it('should call pino debug for verbose', () => {
      service.verbose('verbose message', 'TestContext');
      expect(mockLoggerFunctions.debug).toHaveBeenCalledWith(
        { context: 'TestContext' },
        'verbose message',
      );
    });
  });

  describe('logWithContext', () => {
    it('should call appropriate pino method with context', () => {
      const context = { userId: '123', requestId: 'abc' };
      service.logWithContext('info', 'custom message', context);
      expect(mockLoggerFunctions.info).toHaveBeenCalledWith(
        context,
        'custom message',
      );
    });
  });

  describe('getPinoLogger', () => {
    it('should return the logger instance', () => {
      expect(service.getPinoLogger()).toBe(mockLoggerFunctions);
    });
  });
});
