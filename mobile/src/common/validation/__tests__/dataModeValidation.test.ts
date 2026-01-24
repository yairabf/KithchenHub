import {
  validateEntityModeMatch,
  validateServiceOperation,
  validateServiceCompatibility,
  validateModeMigration,
  validateEntitiesMode,
  validateUserAccessToMode,
  validateGuestFeatureAccess,
} from '../dataModeValidation';
import { isGuestEntity } from '../../types/dataModes';

describe('dataModeValidation', () => {
  describe('validateEntityModeMatch', () => {
    it.each([
      [{ mode: 'guest', localId: 'test-id' }, 'guest'],
      [{ mode: 'signed-in', id: 'test-id', householdId: 'household-1' }, 'signed-in'],
      [{ mode: 'public-catalog', id: 'test-id' }, 'public-catalog'],
    ])('should not throw for matching modes: %s', (entity, expectedMode) => {
      expect(() => validateEntityModeMatch(entity, expectedMode as any)).not.toThrow();
    });

    it.each([
      [{ mode: 'guest', localId: 'test-id' }, 'signed-in'],
      [{ mode: 'signed-in', id: 'test-id', householdId: 'household-1' }, 'guest'],
    ])('should throw for mismatched modes: %s', (entity, expectedMode) => {
      expect(() => validateEntityModeMatch(entity, expectedMode as any)).toThrow();
    });
  });

  describe('validateServiceOperation', () => {
    it.each([
      ['read', 'guest'],
      ['read', 'signed-in'],
      ['read', 'public-catalog'],
      ['write', 'guest'],
      ['write', 'signed-in'],
    ])('should allow operation %s for mode %s', (operation, mode) => {
      expect(() => validateServiceOperation(operation as any, mode as any)).not.toThrow();
    });

    it('should throw for write operation on public-catalog', () => {
      expect(() => validateServiceOperation('write', 'public-catalog')).toThrow(
        'Public catalog entities are read-only'
      );
    });
  });

  describe('validateServiceCompatibility', () => {
    it.each([
      ['local', 'guest'],
      ['remote', 'signed-in'],
      ['catalog', 'public-catalog'],
    ])('should allow service type %s for mode %s', (serviceType, mode) => {
      expect(() => validateServiceCompatibility(serviceType as any, mode as any)).not.toThrow();
    });

    it('should throw for remote service with guest mode', () => {
      expect(() => validateServiceCompatibility('remote', 'guest')).toThrow(
        'Guest entities cannot use remote service'
      );
    });

    it('should throw for catalog service with non-catalog mode', () => {
      expect(() => validateServiceCompatibility('catalog', 'guest')).toThrow(
        'Catalog service can only be used with public-catalog mode, but entity is in guest mode.'
      );
    });
  });

  describe('validateModeMigration', () => {
    it('should allow migration from guest to signed-in', () => {
      expect(() => validateModeMigration('guest', 'signed-in')).not.toThrow();
    });

    it.each([
      ['signed-in', 'guest', 'Cannot migrate from signed-in to guest mode'],
      ['guest', 'guest', 'Entity is already in guest mode'],
      ['public-catalog', 'signed-in', 'Cannot migrate public catalog entities'],
      ['guest', 'public-catalog', 'Cannot migrate to public catalog mode. It is read-only.'],
      ['signed-in', 'public-catalog', 'Cannot migrate to public catalog mode. It is read-only.'],
    ])('should reject migration from %s to %s', (source, target, expectedError) => {
      expect(() => validateModeMigration(source as any, target as any)).toThrow(expectedError);
    });
  });

  describe('validateEntitiesMode', () => {
    it('should validate all entities have the same mode', () => {
      const entities = [
        { mode: 'guest', localId: 'id1' },
        { mode: 'guest', localId: 'id2' },
        { mode: 'guest', localId: 'id3' },
      ];
      expect(() => validateEntitiesMode(entities, 'guest')).not.toThrow();
    });

    it('should throw if any entity has different mode', () => {
      const entities = [
        { mode: 'guest', localId: 'id1' },
        { mode: 'signed-in', id: 'id2', householdId: 'household-1' },
      ];
      expect(() => validateEntitiesMode(entities, 'guest')).toThrow(
        'Entity at index 1 has mode signed-in, expected guest'
      );
    });
  });

  describe('validateUserAccessToMode', () => {
    it.each([
      ['guest', 'guest'],
      ['signed-in', 'signed-in'],
      ['guest', 'public-catalog'],
      ['signed-in', 'public-catalog'],
    ])('should allow user in %s mode to access %s entities', (userMode, entityMode) => {
      expect(() => validateUserAccessToMode(userMode as any, entityMode as any)).not.toThrow();
    });

    it.each([
      ['guest', 'signed-in', 'User in guest mode cannot access signed-in entities'],
      ['signed-in', 'guest', 'User in signed-in mode cannot access guest entities'],
    ])('should reject user in %s mode accessing %s entities', (userMode, entityMode, expectedError) => {
      expect(() => validateUserAccessToMode(userMode as any, entityMode as any)).toThrow(expectedError);
    });
  });

  describe('validateGuestFeatureAccess', () => {
    it('should allow signed-in users to access all features', () => {
      expect(() => validateGuestFeatureAccess('signed-in', 'household-sharing')).not.toThrow();
      expect(() => validateGuestFeatureAccess('signed-in', 'cloud-sync')).not.toThrow();
      expect(() => validateGuestFeatureAccess('signed-in', 'cross-device')).not.toThrow();
    });

    it('should allow guest users to access cloud-sync feature', () => {
      expect(() => validateGuestFeatureAccess('guest', 'cloud-sync')).not.toThrow();
    });

    it.each([
      ['household-sharing', 'Guest users cannot access household-sharing'],
      ['cross-device', 'Guest users cannot access cross-device'],
    ])('should reject guest users accessing %s feature', (feature, expectedError) => {
      expect(() => validateGuestFeatureAccess('guest', feature as any)).toThrow(expectedError);
    });
  });
});
