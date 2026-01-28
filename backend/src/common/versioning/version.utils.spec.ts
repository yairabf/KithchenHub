import { extractVersionFromRequest, VersionedRequest } from './version.utils';

describe('extractVersionFromRequest', () => {
  describe('URL pattern matching', () => {
    it.each([
      ['/api/v1/auth/sync', '1'],
      ['/api/v2/recipes', '2'],
      ['/api/v10/shopping-lists', '10'],
      ['/api/v1/recipes?query=test', '1'],
      ['/api/v1/recipes#fragment', '1'],
      ['/api/v1/', '1'],
    ])('should extract version from URL %s', (url, expected) => {
      const request: VersionedRequest = { url } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBe(expected);
    });

    it('should return null for URLs without version', () => {
      const request: VersionedRequest = {
        url: '/api/auth/sync',
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBeNull();
    });

    it('should return null for invalid URL patterns', () => {
      const request: VersionedRequest = {
        url: '/api/version',
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBeNull();
    });
  });

  describe('NestJS version property', () => {
    it('should extract version from request.version string property', () => {
      const request: VersionedRequest = {
        url: '/api/unknown',
        version: '1',
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBe('1');
    });

    it('should extract first version from request.version array', () => {
      const request: VersionedRequest = {
        url: '/api/unknown',
        version: ['1', '2'],
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBe('1');
    });

    it('should return null for non-string version in array', () => {
      const request: VersionedRequest = {
        url: '/api/unknown',
        version: [1, 2] as any,
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBeNull();
    });

    it('should prefer URL pattern over version property', () => {
      const request: VersionedRequest = {
        url: '/api/v2/auth/sync',
        version: '1',
      } as VersionedRequest;
      // URL pattern takes precedence
      expect(extractVersionFromRequest(request)).toBe('2');
    });
  });

  describe('Edge cases', () => {
    it('should return null when both URL and version property are missing', () => {
      const request: VersionedRequest = {
        url: '/api/unknown',
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBeNull();
    });

    it('should handle empty version array', () => {
      const request: VersionedRequest = {
        url: '/api/unknown',
        version: [],
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBeNull();
    });

    it('should handle empty string version', () => {
      const request: VersionedRequest = {
        url: '/api/unknown',
        version: '',
      } as VersionedRequest;
      expect(extractVersionFromRequest(request)).toBeNull();
    });
  });
});
