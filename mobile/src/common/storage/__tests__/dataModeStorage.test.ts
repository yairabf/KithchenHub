import {
  getGuestStorageKey,
  getSignedInCacheKey,
  getPublicCatalogCacheKey,
  validateStorageKey,
  getModeFromStorageKey,
  extractEntityTypeFromKey,
  getAllStorageKeysForMode,
  STORAGE_PREFIXES,
  ENTITY_TYPES,
} from '../dataModeStorage';

describe('dataModeStorage', () => {
  describe('getGuestStorageKey', () => {
    it.each([
      ['shopping_lists', '@kitchen_hub_guest_shopping_lists'],
      ['recipes', '@kitchen_hub_guest_recipes'],
      ['chores', '@kitchen_hub_guest_chores'],
    ])('should generate correct guest storage key for %s', (entityType, expected) => {
      expect(getGuestStorageKey(entityType)).toBe(expected);
    });
  });

  describe('getSignedInCacheKey', () => {
    it.each([
      ['shopping_lists', '@kitchen_hub_cache_shopping_lists'],
      ['recipes', '@kitchen_hub_cache_recipes'],
      ['chores', '@kitchen_hub_cache_chores'],
    ])('should generate correct signed-in cache key for %s', (entityType, expected) => {
      expect(getSignedInCacheKey(entityType)).toBe(expected);
    });
  });

  describe('getPublicCatalogCacheKey', () => {
    it.each([
      ['grocery_catalog', '@kitchen_hub_catalog_grocery_catalog'],
      ['categories', '@kitchen_hub_catalog_categories'],
    ])('should generate correct public catalog cache key for %s', (entityType, expected) => {
      expect(getPublicCatalogCacheKey(entityType)).toBe(expected);
    });
  });

  describe('validateStorageKey', () => {
    it.each([
      ['@kitchen_hub_guest_shopping_lists', 'guest'],
      ['@kitchen_hub_cache_recipes', 'signed-in'],
      ['@kitchen_hub_catalog_grocery_catalog', 'public-catalog'],
    ])('should not throw for valid keys: %s', (key, mode) => {
      expect(() => validateStorageKey(key, mode as any)).not.toThrow();
    });

    it.each([
      ['@kitchen_hub_guest_shopping_lists', 'signed-in', 'does not match mode signed-in'],
      ['@kitchen_hub_cache_recipes', 'guest', 'does not match mode guest'],
      ['@kitchen_hub_catalog_grocery_catalog', 'guest', 'does not match mode guest'],
      ['invalid_key', 'guest', 'does not match mode guest'],
    ])('should throw for invalid keys: %s', (key, mode, expectedError) => {
      expect(() => validateStorageKey(key, mode as any)).toThrow(expectedError);
    });
  });

  describe('getModeFromStorageKey', () => {
    it.each([
      ['@kitchen_hub_guest_shopping_lists', 'guest'],
      ['@kitchen_hub_cache_recipes', 'signed-in'],
      ['@kitchen_hub_catalog_grocery_catalog', 'public-catalog'],
      ['invalid_key', null],
    ])('should extract mode from key: %s', (key, expected) => {
      expect(getModeFromStorageKey(key)).toBe(expected);
    });
  });

  describe('extractEntityTypeFromKey', () => {
    it.each([
      ['@kitchen_hub_guest_shopping_lists', 'shopping_lists'],
      ['@kitchen_hub_cache_recipes', 'recipes'],
      ['@kitchen_hub_catalog_grocery_catalog', 'grocery_catalog'],
      ['invalid_key', null],
    ])('should extract entity type from key: %s', (key, expected) => {
      expect(extractEntityTypeFromKey(key)).toBe(expected);
    });
  });

  describe('getAllStorageKeysForMode', () => {
    it('should return all storage keys for guest mode', () => {
      const keys = getAllStorageKeysForMode('guest');
      expect(keys.length).toBeGreaterThan(0);
      keys.forEach(key => {
        expect(key).toMatch(new RegExp(`^${STORAGE_PREFIXES.guest}`));
      });
    });

    it('should return all storage keys for signed-in mode', () => {
      const keys = getAllStorageKeysForMode('signed-in');
      expect(keys.length).toBeGreaterThan(0);
      keys.forEach(key => {
        expect(key).toMatch(new RegExp(`^${STORAGE_PREFIXES.signedIn}`));
      });
    });

    it('should return all storage keys for public-catalog mode', () => {
      const keys = getAllStorageKeysForMode('public-catalog');
      expect(keys.length).toBeGreaterThan(0);
      keys.forEach(key => {
        expect(key).toMatch(new RegExp(`^${STORAGE_PREFIXES.publicCatalog}`));
      });
    });

    it('should throw for unknown mode', () => {
      expect(() => getAllStorageKeysForMode('unknown' as any)).toThrow('Unknown data mode');
    });
  });
});
