import type { EntityTimestamps } from '../../types/entityMetadata';
import {
  compareTimestamps,
  determineConflictWinner,
  mergeEntitiesLWW,
  mergeEntitiesWithTombstones,
  mergeEntityArrays,
} from '../conflictResolution';

interface TestEntity extends EntityTimestamps {
  id: string;
  localId: string;
  name: string;
  flag?: boolean;
}

const buildEntity = (overrides: Partial<TestEntity> = {}): TestEntity => ({
  id: 'entity-1',
  localId: 'local-1',
  name: 'Base',
  ...overrides,
});

describe('compareTimestamps', () => {
  const older = '2026-01-25T10:00:00.000Z';
  const newer = '2026-01-25T12:00:00.000Z';
  const olderDate = new Date(older);
  const newerDate = new Date(newer);

  it('returns -1 when the first timestamp is newer', () => {
    expect(compareTimestamps(newer, older)).toBe(-1);
  });

  it('returns 1 when the second timestamp is newer', () => {
    expect(compareTimestamps(older, newer)).toBe(1);
  });

  it('returns 0 when timestamps are equal', () => {
    expect(compareTimestamps(newer, newer)).toBe(0);
  });

  it('treats missing timestamps as oldest', () => {
    expect(compareTimestamps(undefined, newer)).toBe(1);
    expect(compareTimestamps(newer, undefined)).toBe(-1);
  });

  describe.each([
    ['ISO string vs ISO string', older, newer, 1],
    ['Date vs Date', olderDate, newerDate, 1],
    ['ISO string vs Date', older, newerDate, 1],
    ['Date vs ISO string', olderDate, newer, 1],
    ['equal ISO strings', newer, newer, 0],
    ['equal Dates', newerDate, newerDate, 0],
    ['missing vs present', undefined, newer, 1],
    ['present vs missing', newer, undefined, -1],
    ['both missing', undefined, undefined, 0],
  ])('Timestamp normalization: %s', (description, timestamp1, timestamp2, expected) => {
    it(`should normalize and compare correctly`, () => {
      expect(compareTimestamps(timestamp1, timestamp2)).toBe(expected);
    });
  });
});

describe('determineConflictWinner', () => {
  const older = new Date('2026-01-25T10:00:00.000Z');
  const newer = new Date('2026-01-25T12:00:00.000Z');

  it('returns local when local is newer', () => {
    const local = buildEntity({ updatedAt: newer });
    const remote = buildEntity({ updatedAt: older, name: 'Remote' });
    expect(determineConflictWinner(local, remote)).toBe('local');
  });

  it('returns remote when remote is newer', () => {
    const local = buildEntity({ updatedAt: older });
    const remote = buildEntity({ updatedAt: newer, name: 'Remote' });
    expect(determineConflictWinner(local, remote)).toBe('remote');
  });

  it('returns remote when timestamps match (tie-breaker)', () => {
    const local = buildEntity({ updatedAt: newer });
    const remote = buildEntity({ updatedAt: newer, name: 'Remote' });
    expect(determineConflictWinner(local, remote)).toBe('remote');
  });
});

describe('mergeEntitiesLWW', () => {
  const older = new Date('2026-01-25T10:00:00.000Z');
  const newer = new Date('2026-01-25T12:00:00.000Z');

  it('returns local entity when local is newer', () => {
    const local = buildEntity({ updatedAt: newer, name: 'Local' });
    const remote = buildEntity({ updatedAt: older, name: 'Remote' });
    expect(mergeEntitiesLWW(local, remote)).toMatchObject(local);
  });

  it('returns remote entity when remote is newer and preserves localId', () => {
    const local = buildEntity({ updatedAt: older, localId: 'local-keep' });
    const remote = buildEntity({ updatedAt: newer, name: 'Remote', localId: 'remote-id' });
    const result = mergeEntitiesLWW(local, remote);
    expect(result.name).toBe('Remote');
    expect(result.localId).toBe('local-keep');
  });

  it('returns remote entity on equal timestamps (tie-breaker) and preserves localId', () => {
    const local = buildEntity({ updatedAt: newer, localId: 'local-keep', flag: true });
    const remote = buildEntity({ updatedAt: newer, name: 'Remote', flag: false });
    const result = mergeEntitiesLWW(local, remote);
    expect(result.name).toBe('Remote');
    expect(result.localId).toBe('local-keep');
  });

  describe.each([
    [
      'local newer',
      buildEntity({ updatedAt: newer, name: 'Local' }),
      buildEntity({ updatedAt: older, name: 'Remote' }),
      'local',
      'Local',
    ],
    [
      'remote newer',
      buildEntity({ updatedAt: older, name: 'Local' }),
      buildEntity({ updatedAt: newer, name: 'Remote' }),
      'remote',
      'Remote',
    ],
    [
      'equal timestamps (tie-breaker)',
      buildEntity({ updatedAt: newer, name: 'Local' }),
      buildEntity({ updatedAt: newer, name: 'Remote' }),
      'remote',
      'Remote',
    ],
  ])('LWW conflict resolution: %s', (description, local, remote, expectedWinner, expectedName) => {
    it(`should choose ${expectedWinner}`, () => {
      const result = mergeEntitiesLWW(local, remote);
      expect(result.name).toBe(expectedName);
    });
  });
});

describe('mergeEntitiesWithTombstones', () => {
  const older = new Date('2026-01-25T10:00:00.000Z');
  const newer = new Date('2026-01-25T12:00:00.000Z');

  it('returns null when both sides are deleted', () => {
    const local = buildEntity({ updatedAt: newer, deletedAt: newer });
    const remote = buildEntity({ updatedAt: newer, deletedAt: newer, name: 'Remote' });
    expect(mergeEntitiesWithTombstones(local, remote)).toBeNull();
  });

  it('returns deleted local when local is deleted (delete always wins)', () => {
    const local = buildEntity({ updatedAt: newer, deletedAt: newer });
    const remote = buildEntity({ updatedAt: older, name: 'Remote' });
    const result = mergeEntitiesWithTombstones(local, remote);
    expect(result?.deletedAt).toBeDefined();
  });

  it('returns deleted remote when remote is deleted and preserves localId (delete always wins)', () => {
    const local = buildEntity({ updatedAt: newer, localId: 'local-keep' });
    const remote = buildEntity({ updatedAt: older, name: 'Remote', deletedAt: older });
    const result = mergeEntitiesWithTombstones(local, remote);
    expect(result?.deletedAt).toBeDefined();
    expect(result?.localId).toBe('local-keep');
  });

  describe.each([
    [
      'local deleted (older) vs remote updated (newer)',
      buildEntity({ updatedAt: older, deletedAt: older }),
      buildEntity({ updatedAt: newer, name: 'Remote Update' }),
      true, // delete should win
    ],
    [
      'remote deleted (older) vs local updated (newer)',
      buildEntity({ updatedAt: newer, name: 'Local Update' }),
      buildEntity({ updatedAt: older, deletedAt: older }),
      true, // delete should win
    ],
  ])('Resurrection Policy: Delete always wins - %s', (description, local, remote, shouldBeDeleted) => {
    it(`should enforce delete always wins policy`, () => {
      const result = mergeEntitiesWithTombstones(local, remote);
      if (shouldBeDeleted) {
        expect(result).not.toBeNull();
        expect(result?.deletedAt).toBeDefined();
      } else {
        expect(result?.deletedAt).toBeUndefined();
      }
    });
  });
});

describe('mergeEntityArrays', () => {
  const older = new Date('2026-01-25T10:00:00.000Z');
  const newer = new Date('2026-01-25T12:00:00.000Z');

  it('keeps local-only entities', () => {
    const local = [buildEntity({ id: 'local-only', updatedAt: older })];
    const remote: TestEntity[] = [];
    const result = mergeEntityArrays(local, remote, (entity) => entity.id);
    expect(result.map((item) => item.id)).toEqual(['local-only']);
  });

  it('adds remote-only entities', () => {
    const local: TestEntity[] = [];
    const remote = [buildEntity({ id: 'remote-only', updatedAt: newer })];
    const result = mergeEntityArrays(local, remote, (entity) => entity.id);
    expect(result.map((item) => item.id)).toEqual(['remote-only']);
  });

  it('merges conflicts using LWW and preserves order', () => {
    const local = [
      buildEntity({ id: 'a', updatedAt: newer, name: 'Local A' }),
      buildEntity({ id: 'b', updatedAt: older, name: 'Local B' }),
    ];
    const remote = [
      buildEntity({ id: 'a', updatedAt: older, name: 'Remote A' }),
      buildEntity({ id: 'b', updatedAt: newer, name: 'Remote B' }),
    ];

    const result = mergeEntityArrays(local, remote, (entity) => entity.id);
    expect(result.map((item) => item.name)).toEqual(['Local A', 'Remote B']);
  });

  it('filters out deleted entities after merge', () => {
    const local = [buildEntity({ id: 'a', updatedAt: older })];
    const remote = [buildEntity({ id: 'a', updatedAt: newer, deletedAt: newer })];

    const result = mergeEntityArrays(local, remote, (entity) => entity.id);
    expect(result).toHaveLength(0);
  });

  describe('edge cases', () => {
    it('handles empty arrays', () => {
      expect(mergeEntityArrays([], [], (entity) => entity.id)).toEqual([]);
    });

    it('handles empty local array', () => {
      const remote = [buildEntity({ id: 'remote-1', updatedAt: newer })];
      const result = mergeEntityArrays([], remote, (entity) => entity.id);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('remote-1');
    });

    it('handles empty remote array', () => {
      const local = [buildEntity({ id: 'local-1', updatedAt: older })];
      const result = mergeEntityArrays(local, [], (entity) => entity.id);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('local-1');
    });

    it('throws error when getId returns empty string', () => {
      const local = [buildEntity({ id: '', updatedAt: older })];
      const remote: TestEntity[] = [];
      
      expect(() => {
        mergeEntityArrays(local, remote, (entity) => entity.id);
      }).toThrow('mergeEntityArrays: getId must return a non-empty string');
    });

    it('handles duplicate IDs in remote array (both added, Map stores last)', () => {
      const local: TestEntity[] = [];
      const remote = [
        buildEntity({ id: 'duplicate', name: 'First', updatedAt: older }),
        buildEntity({ id: 'duplicate', name: 'Second', updatedAt: newer }),
      ];
      
      // Note: Duplicate IDs in the same array will result in both being added
      // because we iterate through the original array, not just the Map values
      // This is acceptable behavior - callers should ensure unique IDs
      const result = mergeEntityArrays(local, remote, (entity) => entity.id);
      expect(result).toHaveLength(2);
      expect(result.map((e) => e.name)).toContain('First');
      expect(result.map((e) => e.name)).toContain('Second');
    });
  });
});
