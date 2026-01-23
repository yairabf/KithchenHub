import {
  createShoppingService,
  LocalShoppingService,
  RemoteShoppingService,
} from './shoppingService';

describe('createShoppingService', () => {
  describe.each([
    ['mock enabled', true, LocalShoppingService],
    ['mock disabled', false, RemoteShoppingService],
  ])('when %s', (_label, isMockEnabled, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createShoppingService(isMockEnabled);

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});
