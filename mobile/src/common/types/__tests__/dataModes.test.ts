import {
  isGuestEntity,
  isSignedInEntity,
  isPublicCatalogEntity,
  validateEntityMode,
  determineUserDataMode,
  type GuestEntityBase,
  type SignedInEntityBase,
  type PublicCatalogEntityBase,
} from '../dataModes';

describe('dataModes', () => {
  describe('isGuestEntity', () => {
    it.each([
      [{ mode: 'guest', localId: 'test-id' }, true],
      [{ mode: 'signed-in', id: 'test-id', householdId: 'household-1' }, false],
      [{ mode: 'public-catalog', id: 'test-id' }, false],
      [{ mode: 'guest' }, true],
      [{}, false],
    ])('should correctly identify guest entities: %s', (entity, expected) => {
      expect(isGuestEntity(entity)).toBe(expected);
    });
  });

  describe('isSignedInEntity', () => {
    it.each([
      [{ mode: 'signed-in', id: 'test-id', householdId: 'household-1' }, true],
      [{ mode: 'guest', localId: 'test-id' }, false],
      [{ mode: 'public-catalog', id: 'test-id' }, false],
      [{ mode: 'signed-in' }, true],
      [{}, false],
    ])('should correctly identify signed-in entities: %s', (entity, expected) => {
      expect(isSignedInEntity(entity)).toBe(expected);
    });
  });

  describe('isPublicCatalogEntity', () => {
    it.each([
      [{ mode: 'public-catalog', id: 'test-id' }, true],
      [{ mode: 'guest', localId: 'test-id' }, false],
      [{ mode: 'signed-in', id: 'test-id', householdId: 'household-1' }, false],
      [{ mode: 'public-catalog' }, true],
      [{}, false],
    ])('should correctly identify public catalog entities: %s', (entity, expected) => {
      expect(isPublicCatalogEntity(entity)).toBe(expected);
    });
  });

  describe('validateEntityMode', () => {
    it.each([
      [{ mode: 'guest', localId: 'test-id' }, 'guest'],
      [{ mode: 'signed-in', id: 'test-id', householdId: 'household-1' }, 'signed-in'],
      [{ mode: 'public-catalog', id: 'test-id' }, 'public-catalog'],
    ])('should not throw for matching modes: %s', (entity, expectedMode) => {
      expect(() => validateEntityMode(entity, expectedMode as any)).not.toThrow();
    });

    it.each([
      [{ mode: 'guest', localId: 'test-id' }, 'signed-in', 'expected signed-in, got guest'],
      [{ mode: 'signed-in', id: 'test-id', householdId: 'household-1' }, 'guest', 'expected guest, got signed-in'],
      [{ mode: 'public-catalog', id: 'test-id' }, 'guest', 'expected guest, got public-catalog'],
      [{}, 'guest', 'expected guest, got undefined'],
    ])('should throw for mismatched modes: %s', (entity, expectedMode, expectedError) => {
      expect(() => validateEntityMode(entity, expectedMode as any)).toThrow(expectedError);
    });
  });

  describe('determineUserDataMode', () => {
    it.each([
      [null, 'guest'],
      [{ isGuest: true }, 'guest'],
      [{ isGuest: false }, 'signed-in'],
    ])('should determine correct mode for user: %s', (user, expected) => {
      expect(determineUserDataMode(user as any)).toBe(expected);
    });
  });
});
