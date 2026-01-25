import {
  createChoresService,
  createChoresServiceLegacy,
  LocalChoresService,
  RemoteChoresService,
} from './choresService';

describe('createChoresService', () => {
  describe.each([
    ['guest mode', 'guest', LocalChoresService],
    ['signed-in mode', 'signed-in', RemoteChoresService],
  ])('when %s', (_label, mode, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createChoresService(mode as 'guest' | 'signed-in');

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});

describe('createChoresServiceLegacy', () => {
  describe.each([
    ['mock enabled', true, LocalChoresService],
    ['mock disabled', false, RemoteChoresService],
  ])('when %s', (_label, isMockEnabled, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createChoresServiceLegacy(isMockEnabled);

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});
