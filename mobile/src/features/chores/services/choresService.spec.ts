import {
  createChoresService,
  LocalChoresService,
  RemoteChoresService,
} from './choresService';

describe('createChoresService', () => {
  describe.each([
    ['mock enabled', true, LocalChoresService],
    ['mock disabled', false, RemoteChoresService],
  ])('when %s', (_label, isMockEnabled, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createChoresService(isMockEnabled);

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});
