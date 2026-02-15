/**
 * Logger utility tests.
 * Verifies that each level calls the correct console method and that
 * loggable types are accepted.
 */

import { logger } from '../logger';

describe('logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('warn calls console.warn with [WARN] prefix and args', () => {
    logger.warn('[Test]', 'message');
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', '[Test]', 'message');
  });

  it('error calls console.error with [ERROR] prefix and args', () => {
    logger.error('[Test]', 'error message');
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', '[Test]', 'error message');
  });

  describe('debug', () => {
    it('calls console.log with [DEBUG] prefix when __DEV__ is true', () => {
      logger.debug('debug message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'debug message');
    });
  });

  describe('info', () => {
    it('calls console.log with [INFO] prefix when __DEV__ is true', () => {
      logger.info('info message');
      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO]', 'info message');
    });
  });

  describe('accepts Loggable types', () => {
    it('warn accepts string, number, and Error', () => {
      logger.warn('msg', 42, new Error('test'));
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN]', 'msg', 42, expect.any(Error));
    });

    it('error accepts object', () => {
      logger.error('failed', { code: 'ERR' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR]', 'failed', { code: 'ERR' });
    });
  });
});
