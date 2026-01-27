/**
 * Integration tests for sync application flow
 * 
 * Tests full sync flow with multiple entity types and complex conflict scenarios.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTITY_TYPES, getSignedInCacheKey } from '../../storage/dataModeStorage';
import type { EntityTimestamps } from '../../types/entityMetadata';
import { fromPersistedTimestamps, toPersistedTimestamps } from '../../types/entityMetadata';
import { applyRemoteUpdatesToLocal } from '../syncApplication';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

interface TestEntity extends EntityTimestamps {
  id: string;
  localId: string;
  name: string;
  category?: string;
}

const buildEntity = (overrides: Partial<TestEntity> = {}): TestEntity => ({
  id: 'entity-1',
  localId: 'local-1',
  name: 'Base',
  ...overrides,
});

const seedCache = async (entityType: 'recipes' | 'shoppingLists' | 'chores' | 'shoppingItems', entities: TestEntity[]) => {
  const storageEntity = ENTITY_TYPES[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);
  const serialized = entities.map(toPersistedTimestamps);
  await AsyncStorage.setItem(storageKey, JSON.stringify(serialized));
};

const readCache = async (entityType: 'recipes' | 'shoppingLists' | 'chores' | 'shoppingItems'): Promise<TestEntity[]> => {
  const storageEntity = ENTITY_TYPES[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);
  const raw = await AsyncStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw) as TestEntity[];
  return parsed.map(fromPersistedTimestamps) as TestEntity[];
};

describe('Sync Application Integration Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Full sync flow with conflicts', () => {
    it('simulates offline changes, online changes, and verifies deterministic resolution', async () => {
      const t1 = new Date('2026-01-25T10:00:00.000Z');
      const t2 = new Date('2026-01-25T12:00:00.000Z');
      const t3 = new Date('2026-01-25T14:00:00.000Z');

      // Initial state: local cache has some entities
      await seedCache('shoppingItems', [
        buildEntity({ id: 'item-1', name: 'Original Name', updatedAt: t1 }),
        buildEntity({ id: 'item-2', name: 'Local Only', updatedAt: t1 }),
      ]);

      // Simulate online changes (remote has updates)
      const remoteUpdates = [
        buildEntity({ id: 'item-1', name: 'Remote Update', updatedAt: t3 }), // Newer update
        buildEntity({ id: 'item-3', name: 'Remote Only', updatedAt: t2 }), // New entity
      ];

      // Apply remote updates
      await applyRemoteUpdatesToLocal('shoppingItems', remoteUpdates, (entity) => entity.id);

      // Verify deterministic resolution
      const cached = await readCache('shoppingItems');
      expect(cached).toHaveLength(3);

      const item1 = cached.find((item) => item.id === 'item-1');
      const item2 = cached.find((item) => item.id === 'item-2');
      const item3 = cached.find((item) => item.id === 'item-3');

      // Remote update wins (newer timestamp)
      expect(item1?.name).toBe('Remote Update');
      // Local-only entity preserved
      expect(item2?.name).toBe('Local Only');
      // Remote-only entity added
      expect(item3?.name).toBe('Remote Only');
    });

    it('handles complex conflict scenarios deterministically', async () => {
      const t1 = new Date('2026-01-25T10:00:00.000Z');
      const t2 = new Date('2026-01-25T12:00:00.000Z');
      const t3 = new Date('2026-01-25T14:00:00.000Z');

      // Local state with various entities
      await seedCache('recipes', [
        buildEntity({ id: 'recipe-1', name: 'Local Update', updatedAt: t3 }), // Local newer
        buildEntity({ id: 'recipe-2', name: 'Local Older', updatedAt: t1 }), // Local older
        buildEntity({ id: 'recipe-3', name: 'Local Deleted', updatedAt: t1, deletedAt: t1 }), // Local deleted
        buildEntity({ id: 'recipe-4', name: 'Local Only', updatedAt: t2 }), // Local only
      ]);

      // Remote state with conflicts
      const remoteUpdates = [
        buildEntity({ id: 'recipe-1', name: 'Remote Update', updatedAt: t2 }), // Remote older (local wins)
        buildEntity({ id: 'recipe-2', name: 'Remote Update', updatedAt: t3 }), // Remote newer (remote wins)
        buildEntity({ id: 'recipe-3', name: 'Remote Recreated', updatedAt: t2 }), // Remote recreated (delete wins)
        buildEntity({ id: 'recipe-5', name: 'Remote Only', updatedAt: t2 }), // Remote only
      ];

      await applyRemoteUpdatesToLocal('recipes', remoteUpdates, (entity) => entity.id);

      const cached = await readCache('recipes');
      const cachedIds = cached.map((item) => item.id).sort();

      // recipe-1: Local wins (newer timestamp)
      const recipe1 = cached.find((item) => item.id === 'recipe-1');
      expect(recipe1?.name).toBe('Local Update');

      // recipe-2: Remote wins (newer timestamp)
      const recipe2 = cached.find((item) => item.id === 'recipe-2');
      expect(recipe2?.name).toBe('Remote Update');

      // recipe-3: Delete wins (tombstone resistance)
      expect(cachedIds).not.toContain('recipe-3');

      // recipe-4: Local-only preserved
      const recipe4 = cached.find((item) => item.id === 'recipe-4');
      expect(recipe4?.name).toBe('Local Only');

      // recipe-5: Remote-only added
      const recipe5 = cached.find((item) => item.id === 'recipe-5');
      expect(recipe5?.name).toBe('Remote Only');
    });
  });

  describe('Multiple entity types sync', () => {
    it('syncs recipes, shopping lists, chores simultaneously and verifies independence', async () => {
      const t1 = new Date('2026-01-25T10:00:00.000Z');
      const t2 = new Date('2026-01-25T12:00:00.000Z');

      // Seed all entity types
      await seedCache('recipes', [buildEntity({ id: 'recipe-1', name: 'Recipe', updatedAt: t1 })]);
      await seedCache('shoppingLists', [buildEntity({ id: 'list-1', name: 'List', updatedAt: t1 })]);
      await seedCache('chores', [buildEntity({ id: 'chore-1', name: 'Chore', updatedAt: t1 })]);

      // Remote updates for each type
      const recipeUpdates = [buildEntity({ id: 'recipe-1', name: 'Updated Recipe', updatedAt: t2 })];
      const listUpdates = [buildEntity({ id: 'list-1', name: 'Updated List', updatedAt: t2 })];
      const choreUpdates = [buildEntity({ id: 'chore-1', name: 'Updated Chore', updatedAt: t2 })];

      // Sync all types
      await applyRemoteUpdatesToLocal('recipes', recipeUpdates, (entity) => entity.id);
      await applyRemoteUpdatesToLocal('shoppingLists', listUpdates, (entity) => entity.id);
      await applyRemoteUpdatesToLocal('chores', choreUpdates, (entity) => entity.id);

      // Verify each entity type resolved conflicts independently
      const recipes = await readCache('recipes');
      const lists = await readCache('shoppingLists');
      const chores = await readCache('chores');

      expect(recipes).toHaveLength(1);
      expect(recipes[0].name).toBe('Updated Recipe');

      expect(lists).toHaveLength(1);
      expect(lists[0].name).toBe('Updated List');

      expect(chores).toHaveLength(1);
      expect(chores[0].name).toBe('Updated Chore');
    });

    it('verifies no cross-contamination between entity types', async () => {
      const t1 = new Date('2026-01-25T10:00:00.000Z');

      // Seed recipes with specific data
      await seedCache('recipes', [
        buildEntity({ id: 'recipe-1', name: 'Pasta Recipe', updatedAt: t1 }),
      ]);

      // Seed shopping lists with different data
      await seedCache('shoppingLists', [
        buildEntity({ id: 'list-1', name: 'Grocery List', updatedAt: t1 }),
      ]);

      // Sync only recipes
      const recipeUpdates = [
        buildEntity({ id: 'recipe-1', name: 'Updated Pasta', updatedAt: t1 }),
      ];
      await applyRemoteUpdatesToLocal('recipes', recipeUpdates, (entity) => entity.id);

      // Verify shopping lists unchanged
      const recipes = await readCache('recipes');
      const lists = await readCache('shoppingLists');

      expect(recipes[0].name).toBe('Updated Pasta');
      expect(lists[0].name).toBe('Grocery List'); // Unchanged
    });
  });

  describe('Cache state matches expected merged state', () => {
    it('verifies cache state after complex merge operations', async () => {
      const t1 = new Date('2026-01-25T10:00:00.000Z');
      const t2 = new Date('2026-01-25T12:00:00.000Z');
      const t3 = new Date('2026-01-25T14:00:00.000Z');

      // Local cache state
      await seedCache('shoppingItems', [
        buildEntity({ id: 'a', name: 'Local A', updatedAt: t3 }), // Local newer
        buildEntity({ id: 'b', name: 'Local B', updatedAt: t1 }), // Local older
        buildEntity({ id: 'c', name: 'Local C', updatedAt: t1 }), // Local only
        buildEntity({ id: 'd', name: 'Local D', updatedAt: t1, deletedAt: t1 }), // Local deleted
      ]);

      // Remote updates
      const remoteUpdates = [
        buildEntity({ id: 'a', name: 'Remote A', updatedAt: t2 }), // Remote older (local wins)
        buildEntity({ id: 'b', name: 'Remote B', updatedAt: t3 }), // Remote newer (remote wins)
        buildEntity({ id: 'd', name: 'Remote D', updatedAt: t2 }), // Remote recreated (delete wins)
        buildEntity({ id: 'e', name: 'Remote E', updatedAt: t2 }), // Remote only
      ];

      await applyRemoteUpdatesToLocal('shoppingItems', remoteUpdates, (entity) => entity.id);

      const cached = await readCache('shoppingItems');
      const cachedMap = new Map(cached.map((item) => [item.id, item]));

      // Expected final state
      expect(cachedMap.get('a')?.name).toBe('Local A'); // Local wins (newer)
      expect(cachedMap.get('b')?.name).toBe('Remote B'); // Remote wins (newer)
      expect(cachedMap.get('c')?.name).toBe('Local C'); // Local-only preserved
      expect(cachedMap.has('d')).toBe(false); // Deleted (tombstone wins)
      expect(cachedMap.get('e')?.name).toBe('Remote E'); // Remote-only added

      expect(cached).toHaveLength(4); // a, b, c, e (d is deleted)
    });
  });
});
