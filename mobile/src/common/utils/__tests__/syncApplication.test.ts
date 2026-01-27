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

  describe('Offline rename vs online rename', () => {
    const older = new Date('2026-01-25T10:00:00.000Z');
    const newer = new Date('2026-01-25T12:00:00.000Z');

    describe.each([
      [
        'local rename newer',
        'Local Name',
        'Remote Name',
        newer, // localTime (newer)
        older, // remoteTime (older)
        'Local Name', // Expected: local wins (newer timestamp)
      ],
      [
        'remote rename newer',
        'Local Name',
        'Remote Name',
        older, // localTime (older)
        newer, // remoteTime (newer)
        'Remote Name', // Expected: remote wins (newer timestamp)
      ],
      [
        'equal timestamps (remote wins)',
        'Local Name',
        'Remote Name',
        newer, // localTime
        newer, // remoteTime
        'Remote Name', // Expected: remote wins (tie-breaker)
      ],
    ])('%s', (description, localName, remoteName, localTime, remoteTime, expectedName) => {
      it(`should resolve rename conflicts using LWW: ${description}`, async () => {
        await seedCache([buildEntity({ id: 'item-1', name: localName, updatedAt: localTime })]);

        const remote = [buildEntity({ id: 'item-1', name: remoteName, updatedAt: remoteTime })];

        await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

        const cached = await readCache();
        expect(cached).toHaveLength(1);
        expect(cached[0].name).toBe(expectedName);
      });
    });
  });

  describe('Additions never removed during merge', () => {
    it('keeps local-only entities when remote is empty', async () => {
      await seedCache([
        buildEntity({ id: 'local-1', name: 'Local Entity 1' }),
        buildEntity({ id: 'local-2', name: 'Local Entity 2' }),
      ]);

      await applyRemoteUpdatesToLocal('shoppingItems', [], (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(2);
      expect(cached.map((item) => item.id)).toEqual(['local-1', 'local-2']);
    });

    it('keeps remote-only entities when local is empty', async () => {
      await seedCache([]);

      const remote = [
        buildEntity({ id: 'remote-1', name: 'Remote Entity 1' }),
        buildEntity({ id: 'remote-2', name: 'Remote Entity 2' }),
      ];

      await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(2);
      expect(cached.map((item) => item.id)).toEqual(['remote-1', 'remote-2']);
    });

    it('keeps both local-only and remote-only entities', async () => {
      await seedCache([
        buildEntity({ id: 'local-1', name: 'Local Entity' }),
      ]);

      const remote = [
        buildEntity({ id: 'remote-1', name: 'Remote Entity' }),
      ];

      await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(2);
      const ids = cached.map((item) => item.id).sort();
      expect(ids).toEqual(['local-1', 'remote-1']);
    });

    it('preserves local additions even when remote has updates to other entities', async () => {
      const t1 = new Date('2026-01-25T10:00:00.000Z');
      const t2 = new Date('2026-01-25T12:00:00.000Z');

      await seedCache([
        buildEntity({ id: 'shared-1', name: 'Local Update', updatedAt: t1 }),
        buildEntity({ id: 'local-only', name: 'Local Only Entity', updatedAt: t1 }),
      ]);

      const remote = [
        buildEntity({ id: 'shared-1', name: 'Remote Update', updatedAt: t2 }),
      ];

      await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(2);
      const sharedEntity = cached.find((item) => item.id === 'shared-1');
      const localOnlyEntity = cached.find((item) => item.id === 'local-only');
      expect(sharedEntity?.name).toBe('Remote Update'); // Remote wins due to newer timestamp
      expect(localOnlyEntity?.name).toBe('Local Only Entity'); // Local-only preserved
    });
  });

  describe('Concurrent modification scenarios', () => {
    const older = new Date('2026-01-25T10:00:00.000Z');
    const newer = new Date('2026-01-25T12:00:00.000Z');

    it('resolves offline update vs online update (local newer)', async () => {
      await seedCache([buildEntity({ id: 'item-1', name: 'Local Update', updatedAt: newer })]);

      const remote = [buildEntity({ id: 'item-1', name: 'Remote Update', updatedAt: older })];

      await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(1);
      expect(cached[0].name).toBe('Local Update');
    });

    it('resolves offline update vs online update (remote newer)', async () => {
      await seedCache([buildEntity({ id: 'item-1', name: 'Local Update', updatedAt: older })]);

      const remote = [buildEntity({ id: 'item-1', name: 'Remote Update', updatedAt: newer })];

      await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(1);
      expect(cached[0].name).toBe('Remote Update');
    });

    it('resolves offline create vs online delete (delete wins)', async () => {
      await seedCache([buildEntity({ id: 'item-1', name: 'Newly Created', updatedAt: newer })]);

      const remote = [
        buildEntity({ id: 'item-1', updatedAt: older, deletedAt: older }),
      ];

      await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(0); // Delete always wins
    });

    it('resolves offline delete vs online update (delete wins)', async () => {
      await seedCache([
        buildEntity({ id: 'item-1', updatedAt: older, deletedAt: older }),
      ]);

      const remote = [buildEntity({ id: 'item-1', name: 'Remote Update', updatedAt: newer })];

      await applyRemoteUpdatesToLocal('shoppingItems', remote, (entity) => entity.id);

      const cached = await readCache();
      expect(cached).toHaveLength(0); // Delete always wins
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
