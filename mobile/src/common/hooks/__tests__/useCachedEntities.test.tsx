/**
 * useCachedEntities Hook Tests
 * 
 * Tests for the useCachedEntities React hook that provides reactive cache access.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCachedEntities } from '../useCachedEntities';
import { readCacheArray } from '../../utils/cacheStorage';
import { cacheEvents } from '../../utils/cacheEvents';
import type { SyncEntityType } from '../../utils/cacheMetadata';
import type { EntityTimestamps } from '../../types/entityMetadata';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../utils/cacheStorage');
jest.mock('../../utils/cacheEvents');

const mockReadCacheArray = readCacheArray as jest.MockedFunction<typeof readCacheArray>;
const mockCacheEvents = cacheEvents as jest.Mocked<typeof cacheEvents>;

interface TestEntity extends EntityTimestamps {
  id: string;
  name: string;
}

describe('useCachedEntities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadCacheArray.mockResolvedValue({
      data: [],
      state: 'missing',
      age: null,
      isValid: true,
    });
    
    // Mock cacheEvents.onCacheChange to return unsubscribe function
    mockCacheEvents.onCacheChange = jest.fn((entityType, handler) => {
      return jest.fn(); // Return unsubscribe function
    });
  });

  describe('initial load', () => {
    it('should load data from cache on mount', async () => {
      const testData: TestEntity[] = [
        { id: '1', name: 'Test 1', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Test 2', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockReadCacheArray.mockResolvedValue({
        data: testData,
        state: 'fresh',
        age: 0,
        isValid: true,
      });

      const { result } = renderHook(() =>
        useCachedEntities<TestEntity>('recipes')
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(testData);
      expect(result.current.error).toBeNull();
      expect(mockReadCacheArray).toHaveBeenCalledWith('recipes');
    });

    it('should handle loading state correctly', async () => {
      mockReadCacheArray.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: [],
                state: 'missing',
                age: null,
                isValid: true,
              });
            }, 100);
          })
      );

      const { result } = renderHook(() =>
        useCachedEntities<TestEntity>('recipes')
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    describe.each([
      [
        'network error',
        new Error('Network request failed'),
        'Network request failed',
      ],
      [
        'timeout error',
        new Error('Request timeout'),
        'Request timeout',
      ],
      [
        'permission error',
        new Error('Permission denied'),
        'Permission denied',
      ],
      [
        'storage error',
        new Error('Storage quota exceeded'),
        'Storage quota exceeded',
      ],
      [
        'unknown error',
        'String error',
        'Failed to load cache',
      ],
      [
        'null error',
        null,
        'Failed to load cache',
      ],
    ])('should handle %s', (description, error, expectedMessage) => {
      it(`should set error message to "${expectedMessage}" and empty data`, async () => {
        mockReadCacheArray.mockRejectedValue(error);

        const { result } = renderHook(() =>
          useCachedEntities<TestEntity>('recipes')
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(expectedMessage);
        expect(result.current.data).toEqual([]);
      });
    });
  });

  describe('cache change subscription', () => {
    it('should subscribe to cache change events on mount', () => {
      renderHook(() => useCachedEntities<TestEntity>('recipes'));

      expect(mockCacheEvents.onCacheChange).toHaveBeenCalledWith(
        'recipes',
        expect.any(Function)
      );
    });

    it('should reload cache when change event is emitted', async () => {
      const initialData: TestEntity[] = [
        { id: '1', name: 'Initial', createdAt: new Date(), updatedAt: new Date() },
      ];
      const updatedData: TestEntity[] = [
        { id: '1', name: 'Updated', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'New', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockReadCacheArray
        .mockResolvedValueOnce({
          data: initialData,
          state: 'fresh',
          age: 0,
          isValid: true,
        })
        .mockResolvedValueOnce({
          data: updatedData,
          state: 'fresh',
          age: 0,
          isValid: true,
        });

      let changeHandler: (() => void) | undefined;

      mockCacheEvents.onCacheChange = jest.fn((entityType, handler) => {
        changeHandler = handler;
        return jest.fn();
      });

      const { result } = renderHook(() =>
        useCachedEntities<TestEntity>('recipes')
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      // Emit cache change event
      act(() => {
        if (changeHandler) {
          changeHandler();
        }
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(updatedData);
      });

      expect(mockReadCacheArray).toHaveBeenCalledTimes(2);
    });

    it('should unsubscribe on unmount', () => {
      const unsubscribe = jest.fn();
      mockCacheEvents.onCacheChange = jest.fn(() => unsubscribe);

      const { unmount } = renderHook(() =>
        useCachedEntities<TestEntity>('recipes')
      );

      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('entity type changes', () => {
    it('should reload when entity type changes', async () => {
      const { rerender } = renderHook(
        ({ entityType }: { entityType: SyncEntityType }) =>
          useCachedEntities<TestEntity>(entityType),
        {
          initialProps: { entityType: 'recipes' },
        }
      );

      await waitFor(() => {
        expect(mockReadCacheArray).toHaveBeenCalledWith('recipes');
      });

      rerender({ entityType: 'chores' });

      await waitFor(() => {
        expect(mockReadCacheArray).toHaveBeenCalledWith('chores');
      });
    });
  });

  describe('manual refresh', () => {
    it('should provide refresh function that reloads cache', async () => {
      const initialData: TestEntity[] = [
        { id: '1', name: 'Initial', createdAt: new Date(), updatedAt: new Date() },
      ];
      const refreshedData: TestEntity[] = [
        { id: '1', name: 'Refreshed', createdAt: new Date(), updatedAt: new Date() },
      ];

      mockReadCacheArray
        .mockResolvedValueOnce({
          data: initialData,
          state: 'fresh',
          age: 0,
          isValid: true,
        })
        .mockResolvedValueOnce({
          data: refreshedData,
          state: 'fresh',
          age: 0,
          isValid: true,
        });

      const { result } = renderHook(() =>
        useCachedEntities<TestEntity>('recipes')
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(initialData);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(refreshedData);
      });

      expect(mockReadCacheArray).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during manual refresh', async () => {
      const error = new Error('Refresh failed');
      mockReadCacheArray
        .mockResolvedValueOnce({
          data: [],
          state: 'missing',
          age: null,
          isValid: true,
        })
        .mockRejectedValueOnce(error);

      const { result } = renderHook(() =>
        useCachedEntities<TestEntity>('recipes')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });
    });
  });

  describe.each([
    ['recipes', 'recipes'],
    ['shoppingLists', 'shoppingLists'],
    ['shoppingItems', 'shoppingItems'],
    ['chores', 'chores'],
  ] as [SyncEntityType, string][])(
    'should work with %s entity type',
    (entityType, expectedType) => {
      it(`should load ${expectedType} from cache`, async () => {
        const testData: TestEntity[] = [
          { id: '1', name: 'Test', createdAt: new Date(), updatedAt: new Date() },
        ];

        mockReadCacheArray.mockResolvedValue({
          data: testData,
          state: 'fresh',
          age: 0,
          isValid: true,
        });

        const { result } = renderHook(() =>
          useCachedEntities<TestEntity>(entityType)
        );

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(mockReadCacheArray).toHaveBeenCalledWith(entityType);
        expect(result.current.data).toEqual(testData);
      });
    }
  );
});
