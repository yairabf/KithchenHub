import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTITY_TYPES, getSignedInCacheKey, getGuestStorageKey } from '../../storage/dataModeStorage';
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
  isChecked?: boolean;
}

const buildEntity = (overrides: Partial<TestEntity> = {}): TestEntity => ({
  id: 'entity-1',
  localId: 'local-1',
  name: 'Base',
  ...overrides,
});

const cacheKey = getSignedInCacheKey(ENTITY_TYPES.shoppingItems);

const seedCache = async (entities: TestEntity[]) => {
  const serialized = entities.map(toPersistedTimestamps);
  await AsyncStorage.setItem(cacheKey, JSON.stringify(serialized));
};

const readCache = async (): Promise<TestEntity[]> => {
  const raw = await AsyncStorage.getItem(cacheKey);
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw) as TestEntity[];
  return parsed.map(fromPersistedTimestamps) as TestEntity[];
};

describe('applyRemoteUpdatesToLocal', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('keeps newer remote updates for scalar conflicts', async () => {
    const t1 = new Date('2026-01-25T10:00:00.000Z');
    const t2 = new Date('2026-01-25T12:00:00.000Z');

    await seedCache([buildEntity({ name: 'Local', updatedAt: t1 })]);

    const remote = [buildEntity({ name: 'Remote', updatedAt: t2 })];

    await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

    const cached = await readCache();
    expect(cached).toHaveLength(1);
    expect(cached[0].name).toBe('Remote');
  });

  it('keeps local-only entities when remote is missing them', async () => {
    await seedCache([buildEntity({ id: 'local-only', name: 'Local Only' })]);

    await applyRemoteUpdatesToLocal('shoppingItems', [], (entity) => entity.id);

    const cached = await readCache();
    expect(cached.map((item) => item.id)).toEqual(['local-only']);
  });

  it('removes entities when remote sends tombstones (delete wins)', async () => {
    const t1 = new Date('2026-01-25T10:00:00.000Z');
    const t2 = new Date('2026-01-25T12:00:00.000Z');

    await seedCache([buildEntity({ id: 'item-1', updatedAt: t1 })]);

    const remote = [
      buildEntity({ id: 'item-1', updatedAt: t2, deletedAt: t2 }),
    ];

    await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

    const cached = await readCache();
    expect(cached).toHaveLength(0);
  });

  it('removes entities even when the delete is older than the local update (delete always wins)', async () => {
    const t1 = new Date('2026-01-25T10:00:00.000Z');
    const t2 = new Date('2026-01-25T12:00:00.000Z');

    await seedCache([buildEntity({ id: 'item-1', updatedAt: t2 })]);

    const remote = [
      buildEntity({ id: 'item-1', updatedAt: t1, deletedAt: t1 }),
    ];

    await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

    const cached = await readCache();
    expect(cached).toHaveLength(0);
  });

  describe.each([
    [
      'offline toggle vs online delete (delete newer)',
      buildEntity({ id: 'item-1', name: 'Toggled', updatedAt: new Date('2026-01-25T10:00:00.000Z') }),
      buildEntity({ id: 'item-1', updatedAt: new Date('2026-01-25T12:00:00.000Z'), deletedAt: new Date('2026-01-25T12:00:00.000Z') }),
      0, // Should be deleted
    ],
    [
      'offline toggle vs online delete (toggle newer)',
      buildEntity({ id: 'item-1', name: 'Toggled', updatedAt: new Date('2026-01-25T12:00:00.000Z') }),
      buildEntity({ id: 'item-1', updatedAt: new Date('2026-01-25T10:00:00.000Z'), deletedAt: new Date('2026-01-25T10:00:00.000Z') }),
      0, // Delete always wins, even if toggle is newer
    ],
  ])('Resurrection Policy: %s', (description, localEntity, remoteEntity, expectedLength) => {
    it(`should enforce delete always wins policy`, async () => {
      await seedCache([localEntity]);
      await applyRemoteUpdatesToLocal('shoppingItems', [remoteEntity], (entity) => entity.id);
      const cached = await readCache();
      expect(cached).toHaveLength(expectedLength);
    });
  });

  describe('defense-in-depth guardrails', () => {
    it('should throw error if storage key mode is guest', async () => {
      // Mock getSignedInCacheKey to return a guest key (simulating programming error)
      const dataModeStorage = require('../../storage/dataModeStorage');
      
      const getSignedInCacheKeySpy = jest.spyOn(dataModeStorage, 'getSignedInCacheKey').mockReturnValue(
        getGuestStorageKey(ENTITY_TYPES.shoppingItems) // Guest key instead of signed-in
      );

      const remote = [buildEntity({ id: 'item-1', name: 'Remote' })];
      
      await expect(
        applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id)
      ).rejects.toThrow('guest storage key');
      
      // Restore only the spy we created
      getSignedInCacheKeySpy.mockRestore();
    });

    it('should throw error if storage key mode is null (unknown key)', async () => {
      // Mock getSignedInCacheKey to return an unknown key
      const dataModeStorage = require('../../storage/dataModeStorage');
      
      const getSignedInCacheKeySpy = jest.spyOn(dataModeStorage, 'getSignedInCacheKey').mockReturnValue(
        '@kitchen_hub_unknown_key' // Unknown key that doesn't match any prefix
      );

      const remote = [buildEntity({ id: 'item-1', name: 'Remote' })];
      
      await expect(
        applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id)
      ).rejects.toThrow('unknown storage key');
      
      // Restore only the spy we created
      getSignedInCacheKeySpy.mockRestore();
    });

    it('should throw error if storage key mode is public-catalog', async () => {
      // Mock getSignedInCacheKey to return a public-catalog key
      const dataModeStorage = require('../../storage/dataModeStorage');
      
      const getSignedInCacheKeySpy = jest.spyOn(dataModeStorage, 'getSignedInCacheKey').mockReturnValue(
        '@kitchen_hub_catalog_grocery_catalog' // Public catalog key
      );

      const remote = [buildEntity({ id: 'item-1', name: 'Remote' })];
      
      await expect(
        applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id)
      ).rejects.toThrow('public-catalog storage key');
      
      // Restore only the spy we created
      getSignedInCacheKeySpy.mockRestore();
    });
  });
});
