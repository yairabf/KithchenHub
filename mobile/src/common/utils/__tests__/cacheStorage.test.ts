import AsyncStorage from '@react-native-async-storage/async-storage';
import { readCacheArray, writeCacheArray, getCacheState, shouldRefreshCache } from '../cacheStorage';
import { getCacheMetadata, updateCacheMetadata } from '../cacheMetadata';
import { getCacheState as getCacheStateFromConfig } from '../../config/cacheConfig';
import type { SyncEntityType } from '../cacheMetadata';
import type { CacheState } from '../../config/cacheConfig';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../cacheMetadata');
jest.mock('../../config/cacheConfig');

const mockGetCacheMetadata = getCacheMetadata as jest.MockedFunction<typeof getCacheMetadata>;
const mockUpdateCacheMetadata = updateCacheMetadata as jest.MockedFunction<typeof updateCacheMetadata>;
const mockGetCacheStateFromConfig = getCacheStateFromConfig as jest.MockedFunction<typeof getCacheStateFromConfig>;

describe('cacheStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    mockGetCacheMetadata.mockResolvedValue(null);
    mockGetCacheStateFromConfig.mockReturnValue('missing');
  });

  describe('readCacheArray', () => {
    const entityType: SyncEntityType = 'recipes';
    const storageKey = '@kitchen_hub_cache_recipes';

    describe.each([
      {
        scenario: 'empty cache (no value)',
        storageValue: null,
        metadata: null,
        expectedState: 'missing' as CacheState,
        expectedData: [],
        expectedAge: null,
        expectedIsValid: true,
      },
      {
        scenario: 'invalid JSON',
        storageValue: 'invalid json',
        metadata: null,
        expectedState: 'missing' as CacheState,
        expectedData: [],
        expectedAge: null,
        expectedIsValid: false,
      },
      {
        scenario: 'valid cached array with fresh metadata',
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Recipe 1' }]),
        metadata: { lastSyncedAt: new Date(Date.now() - 1000).toISOString() }, // 1 second ago
        cacheState: 'fresh' as CacheState,
        expectedData: [{ id: '1', localId: 'uuid-1', name: 'Recipe 1' }],
        expectedIsValid: true,
      },
      {
        scenario: 'valid cached array with stale metadata',
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Recipe 1' }]),
        metadata: { lastSyncedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString() }, // 6 minutes ago (stale for recipes)
        cacheState: 'stale' as CacheState,
        expectedData: [{ id: '1', localId: 'uuid-1', name: 'Recipe 1' }],
        expectedIsValid: true,
      },
      {
        scenario: 'valid cached array with expired metadata',
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Recipe 1' }]),
        metadata: { lastSyncedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString() }, // 11 minutes ago (expired for recipes)
        cacheState: 'expired' as CacheState,
        expectedData: [{ id: '1', localId: 'uuid-1', name: 'Recipe 1' }],
        expectedIsValid: true,
      },
      {
        scenario: 'non-array data',
        storageValue: JSON.stringify({ not: 'an array' }),
        metadata: null,
        expectedState: 'missing' as CacheState,
        expectedData: [],
        expectedAge: null,
        expectedIsValid: false,
      },
      {
        scenario: 'metadata exists but data is corrupted (invalid JSON)',
        storageValue: 'invalid json',
        metadata: { lastSyncedAt: new Date(Date.now() - 1000).toISOString() }, // 1 second ago
        cacheState: 'fresh' as CacheState,
        expectedData: [],
        expectedIsValid: false, // Data is corrupted
      },
      {
        scenario: 'metadata exists but data is corrupted (non-array)',
        storageValue: JSON.stringify({ not: 'an array' }),
        metadata: { lastSyncedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString() }, // 6 minutes ago (stale)
        cacheState: 'stale' as CacheState,
        expectedData: [],
        expectedIsValid: false, // Data is corrupted
      },
      {
        scenario: 'array with invalid items (no id)',
        storageValue: JSON.stringify([{ name: 'Recipe 1' }, { id: '2', localId: 'uuid-2', name: 'Recipe 2' }]),
        metadata: { lastSyncedAt: new Date(Date.now() - 1000).toISOString() },
        cacheState: 'fresh' as CacheState,
        expectedData: [{ id: '2', localId: 'uuid-2', name: 'Recipe 2' }], // Only valid items
        expectedIsValid: true,
      },
    ])('when $scenario', ({ 
      storageValue, 
      metadata, 
      expectedState, 
      expectedData, 
      expectedAge, 
      expectedIsValid,
      cacheState 
    }) => {
      it('should return correct result', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);
        mockGetCacheMetadata.mockResolvedValue(metadata);
        
        if (metadata && cacheState) {
          const age = Date.now() - new Date(metadata.lastSyncedAt).getTime();
          mockGetCacheStateFromConfig.mockReturnValue(cacheState);
          
          const result = await readCacheArray(entityType);
          
          expect(result.data).toEqual(expectedData);
          expect(result.state).toBe(cacheState);
          expect(result.isValid).toBe(expectedIsValid);
          expect(result.lastSyncedAt).toBe(metadata.lastSyncedAt);
          expect(result.age).toBeGreaterThanOrEqual(age - 100); // Allow small time difference
          expect(result.age).toBeLessThanOrEqual(age + 100);
        } else {
          mockGetCacheStateFromConfig.mockReturnValue(expectedState);
          
          const result = await readCacheArray(entityType);
          
          expect(result.data).toEqual(expectedData);
          expect(result.state).toBe(expectedState);
          expect(result.age).toBe(expectedAge);
          expect(result.isValid).toBe(expectedIsValid);
          expect(result.lastSyncedAt).toBe(metadata?.lastSyncedAt ?? null);
        }
        
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(storageKey);
        expect(mockGetCacheMetadata).toHaveBeenCalledWith(entityType);
      });
    });

    describe('with validator callback', () => {
      it('should filter invalid items using validator', async () => {
        const storageValue = JSON.stringify([
          { id: '1', localId: 'uuid-1', name: 'Recipe 1', valid: true },
          { id: '2', localId: 'uuid-2', name: 'Recipe 2', valid: false },
          { id: '3', localId: 'uuid-3', name: 'Recipe 3', valid: true },
        ]);
        const metadata = { lastSyncedAt: new Date(Date.now() - 1000).toISOString() };
        
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);
        mockGetCacheMetadata.mockResolvedValue(metadata);
        mockGetCacheStateFromConfig.mockReturnValue('fresh');
        
        type ValidItem = { id: string; localId: string; name: string; valid: boolean };
        const validator = (x: unknown): x is ValidItem => {
          return (
            typeof x === 'object' &&
            x !== null &&
            'id' in x &&
            'localId' in x &&
            'name' in x &&
            'valid' in x &&
            (x as ValidItem).valid === true
          );
        };
        
        const result = await readCacheArray(entityType, validator);
        
        expect(result.data).toHaveLength(2);
        expect(result.data[0].id).toBe('1');
        expect(result.data[1].id).toBe('3');
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('writeCacheArray', () => {
    const entityType: SyncEntityType = 'recipes';
    const storageKey = '@kitchen_hub_cache_recipes';

    it('should write items to cache and update metadata', async () => {
      const items = [
        { id: '1', localId: 'uuid-1', name: 'Recipe 1' },
        { id: '2', localId: 'uuid-2', name: 'Recipe 2' },
      ];
      
      await writeCacheArray(entityType, items);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        storageKey,
        expect.stringContaining('"id":"1"')
      );
      expect(mockUpdateCacheMetadata).toHaveBeenCalledWith(
        entityType,
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // ISO timestamp pattern
      );
    });

    it('should filter invalid items using validator', async () => {
      type ValidItem = { id: string; localId: string; name: string; valid: boolean };
      const items: ValidItem[] = [
        { id: '1', localId: 'uuid-1', name: 'Recipe 1', valid: true },
        { id: '2', localId: 'uuid-2', name: 'Recipe 2', valid: false },
        { id: '3', localId: 'uuid-3', name: 'Recipe 3', valid: true },
      ];
      
      const validator = (x: unknown): x is ValidItem => {
        return (
          typeof x === 'object' &&
          x !== null &&
          'id' in x &&
          'localId' in x &&
          'name' in x &&
          'valid' in x &&
          (x as ValidItem).valid === true
        );
      };
      
      await writeCacheArray(entityType, items, validator);
      
      const setItemCall = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const writtenData = JSON.parse(setItemCall[1]);
      
      expect(writtenData).toHaveLength(2);
      expect(writtenData[0].id).toBe('1');
      expect(writtenData[1].id).toBe('3');
      expect(mockUpdateCacheMetadata).toHaveBeenCalled();
    });

    it('should handle empty array', async () => {
      await writeCacheArray(entityType, []);
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(storageKey, '[]');
      expect(mockUpdateCacheMetadata).toHaveBeenCalled();
    });
  });

  describe('getCacheState', () => {
    const entityType: SyncEntityType = 'recipes';

    describe.each([
      {
        scenario: 'missing cache',
        metadata: null,
        expectedState: 'missing' as CacheState,
        expectedAge: null,
      },
      {
        scenario: 'fresh cache',
        metadata: { lastSyncedAt: new Date(Date.now() - 1000).toISOString() },
        cacheState: 'fresh' as CacheState,
      },
      {
        scenario: 'stale cache',
        metadata: { lastSyncedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString() },
        cacheState: 'stale' as CacheState,
      },
      {
        scenario: 'expired cache',
        metadata: { lastSyncedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString() },
        cacheState: 'expired' as CacheState,
      },
    ])('when $scenario', ({ metadata, expectedState, cacheState }) => {
      it('should return correct state information', async () => {
        mockGetCacheMetadata.mockResolvedValue(metadata);
        
        if (metadata && cacheState) {
          const age = Date.now() - new Date(metadata.lastSyncedAt).getTime();
          mockGetCacheStateFromConfig.mockReturnValue(cacheState);
          
          const result = await getCacheState(entityType);
          
          expect(result.state).toBe(cacheState);
          expect(result.lastSyncedAt).toBe(metadata.lastSyncedAt);
          expect(result.age).toBeGreaterThanOrEqual(age - 100);
          expect(result.age).toBeLessThanOrEqual(age + 100);
        } else {
          mockGetCacheStateFromConfig.mockReturnValue(expectedState);
          
          const result = await getCacheState(entityType);
          
          expect(result.state).toBe(expectedState);
          expect(result.age).toBe(null);
          expect(result.lastSyncedAt).toBe(null);
        }
        
        expect(mockGetCacheMetadata).toHaveBeenCalledWith(entityType);
      });
    });
  });

  describe('shouldRefreshCache', () => {
    const entityType: SyncEntityType = 'recipes';

    describe.each([
      {
        scenario: 'fresh cache, online',
        cacheState: 'fresh' as CacheState,
        isOnline: true,
        expected: false,
      },
      {
        scenario: 'fresh cache, offline',
        cacheState: 'fresh' as CacheState,
        isOnline: false,
        expected: false,
      },
      {
        scenario: 'stale cache, online',
        cacheState: 'stale' as CacheState,
        isOnline: true,
        expected: true,
      },
      {
        scenario: 'stale cache, offline',
        cacheState: 'stale' as CacheState,
        isOnline: false,
        expected: false,
      },
      {
        scenario: 'expired cache, online',
        cacheState: 'expired' as CacheState,
        isOnline: true,
        expected: true,
      },
      {
        scenario: 'expired cache, offline',
        cacheState: 'expired' as CacheState,
        isOnline: false,
        expected: true, // Plan says expired + offline should refresh
      },
      {
        scenario: 'missing cache, online',
        cacheState: 'missing' as CacheState,
        isOnline: true,
        expected: false, // Missing cache doesn't need refresh, needs initial fetch
      },
      {
        scenario: 'missing cache, offline',
        cacheState: 'missing' as CacheState,
        isOnline: false,
        expected: false,
      },
    ])('when $scenario', ({ cacheState, isOnline, expected }) => {
      it(`should return ${expected}`, async () => {
        const metadata = cacheState === 'missing' 
          ? null 
          : { lastSyncedAt: new Date(Date.now() - 1000).toISOString() };
        
        mockGetCacheMetadata.mockResolvedValue(metadata);
        mockGetCacheStateFromConfig.mockReturnValue(cacheState);
        
        const result = await shouldRefreshCache(entityType, isOnline);
        
        expect(result).toBe(expected);
        expect(mockGetCacheMetadata).toHaveBeenCalledWith(entityType);
      });
    });
  });
});
