import { getDeleteAccountErrorMessage } from '../errorMessages';
import { ApiError, NetworkError } from '../../../../services/api';

describe('getDeleteAccountErrorMessage', () => {
  const mockT = (key: string) => `translated_${key}`;

  describe.each([
    ['NetworkError', new NetworkError('Connection failed'), 'deleteAccountErrorOffline'],
    ['ApiError with 401', new ApiError('Unauthorized', 401), 'deleteAccountErrorUnauthorized'],
    ['ApiError with 429', new ApiError('Rate limit exceeded', 429), 'deleteAccountErrorRateLimit'],
    ['ApiError with 500', new ApiError('Internal server error', 500), 'deleteAccountErrorServer'],
    ['ApiError with 502', new ApiError('Bad gateway', 502), 'deleteAccountErrorServer'],
    ['ApiError with 503', new ApiError('Service unavailable', 503), 'deleteAccountErrorServer'],
    ['ApiError with 400', new ApiError('Bad request', 400), 'deleteAccountErrorGeneric'],
    ['ApiError with 404', new ApiError('Not found', 404), 'deleteAccountErrorGeneric'],
    ['Generic Error', new Error('Something went wrong'), 'deleteAccountErrorGeneric'],
    ['String error', 'error string', 'deleteAccountErrorGeneric'],
    ['Null error', null, 'deleteAccountErrorGeneric'],
    ['Undefined error', undefined, 'deleteAccountErrorGeneric'],
  ])('with %s', (description, error, expectedKey) => {
    it(`should return translated ${expectedKey}`, () => {
      const result = getDeleteAccountErrorMessage(error, mockT);
      expect(result).toBe(`translated_${expectedKey}`);
    });
  });

  it('should call translation function with correct key', () => {
    const mockTranslate = jest.fn((key: string) => `translated_${key}`);
    
    getDeleteAccountErrorMessage(new NetworkError('Offline'), mockTranslate);
    
    expect(mockTranslate).toHaveBeenCalledWith('deleteAccountErrorOffline');
    expect(mockTranslate).toHaveBeenCalledTimes(1);
  });
});
