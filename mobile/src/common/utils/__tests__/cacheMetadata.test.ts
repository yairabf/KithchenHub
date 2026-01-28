import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCacheMetadata, updateCacheMetadata, clearCacheMetadata } from '../cacheMetadata';
import { CURRENT_CACHE_METADATA_STORAGE_VERSION } from '../cacheStorage.constants';
import type { SyncEntityType } from '../cacheMetadata';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('cacheMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getCacheMetadata', () => {
    const entityType: SyncEntityType = 'recipes';
    const storageKey = '@kitchen_hub_cache_meta_recipes';

    describe('legacy format migration', () => {
      it('should migrate legacy metadata without version and write back normalized form', async () => {
        const legacyMetadata = { lastSyncedAt: '2026-01-28T12:00:00.000Z' };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(legacyMetadata));

        const result = await getCacheMetadata(entityType);

        expect(result).toEqual({
          lastSyncedAt: '2026-01-28T12:00:00.000Z',
          version: CURRENT_CACHE_METADATA_STORAGE_VERSION,
        });
        
        // Should write back normalized metadata
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          storageKey,
          expect.stringContaining(`"version":${CURRENT_CACHE_METADATA_STORAGE_VERSION}`)
        );
      });

      it('should not write back if normalized blob is identical', async () => {
        const versionedMetadata = {
          lastSyncedAt: '2026-01-28T12:00:00.000Z',
          version: CURRENT_CACHE_METADATA_STORAGE_VERSION,
        };
        const versionedJson = JSON.stringify(versionedMetadata);
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(versionedJson);

        const result = await getCacheMetadata(entityType);

        expect(result).toEqual(versionedMetadata);
        
        // Should not write back (already normalized)
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe('future version handling', () => {
      it('should return lastSyncedAt from future version if valid', async () => {
        const futureVersion = CURRENT_CACHE_METADATA_STORAGE_VERSION + 1;
        const futureMetadata = {
          lastSyncedAt: '2026-01-28T12:00:00.000Z',
          version: futureVersion,
        };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(futureMetadata));

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await getCacheMetadata(entityType);

        expect(result).toEqual({
          lastSyncedAt: '2026-01-28T12:00:00.000Z',
          version: futureVersion,
        });
        
        // Should NOT write back future version
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
        
        // Should log warning
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`future version ${futureVersion}`)
        );

        consoleWarnSpy.mockRestore();
      });

      it('should return null if future version has invalid lastSyncedAt', async () => {
        const futureVersion = CURRENT_CACHE_METADATA_STORAGE_VERSION + 1;
        const futureMetadata = {
          lastSyncedAt: 'invalid timestamp',
          version: futureVersion,
        };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(futureMetadata));

        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await getCacheMetadata(entityType);

        expect(result).toBeNull();
        
        // Should NOT write back
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();

        consoleWarnSpy.mockRestore();
      });
    });

    describe('corruption handling', () => {
      it('should never write back corrupt JSON', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

        const result = await getCacheMetadata(entityType);

        expect(result).toBeNull();
        
        // Should NOT write back corrupt data
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });

      it('should never write back wrong type data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({ not: 'metadata' }));

        const result = await getCacheMetadata(entityType);

        expect(result).toBeNull();
        
        // Should NOT write back wrong type data
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });

      it('should never write back metadata with invalid lastSyncedAt', async () => {
        const invalidMetadata = { lastSyncedAt: 'invalid timestamp' };
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(invalidMetadata));

        const result = await getCacheMetadata(entityType);

        expect(result).toBeNull();
        
        // Should NOT write back invalid data
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });
    });

    describe('missing metadata', () => {
      it('should return null for missing metadata', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        const result = await getCacheMetadata(entityType);

        expect(result).toBeNull();
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });
    });
  });

  describe('updateCacheMetadata', () => {
    const entityType: SyncEntityType = 'recipes';
    const storageKey = '@kitchen_hub_cache_meta_recipes';

    it('should always set version field when updating metadata', async () => {
      const lastSyncedAt = '2026-01-28T12:00:00.000Z';

      await updateCacheMetadata(entityType, lastSyncedAt);

      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(setItemCall[1]);

      expect(writtenData).toEqual({
        lastSyncedAt,
        version: CURRENT_CACHE_METADATA_STORAGE_VERSION,
      });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(writtenData));
    });
  });

  describe('clearCacheMetadata', () => {
    const entityType: SyncEntityType = 'recipes';
    const storageKey = '@kitchen_hub_cache_meta_recipes';

    it('should remove metadata from storage', async () => {
      await clearCacheMetadata(entityType);

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(storageKey);
    });
  });
});
