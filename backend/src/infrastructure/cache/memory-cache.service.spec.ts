import { MemoryCacheService } from './memory-cache.service';

describe('MemoryCacheService', () => {
  let cache: MemoryCacheService;

  beforeEach(() => {
    cache = new MemoryCacheService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('get / set basics', () => {
    it('should return undefined for a missing key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should store and retrieve a value', () => {
      cache.set('key', 'value', 60_000);
      expect(cache.get('key')).toBe('value');
    });

    it('should overwrite an existing key', () => {
      cache.set('key', 'v1', 60_000);
      cache.set('key', 'v2', 60_000);
      expect(cache.get('key')).toBe('v2');
    });

    it('should store objects and arrays', () => {
      const obj = { id: 1, tags: ['a', 'b'] };
      cache.set('obj', obj, 60_000);
      expect(cache.get('obj')).toBe(obj);
    });
  });

  describe('TTL expiration', () => {
    it.each([
      ['before TTL', 59_999, 'alive'],
      ['at TTL boundary (still alive due to strict >)', 60_000, 'alive'],
      ['after TTL', 60_001, undefined],
    ])('should handle access %s', (_label, advanceMs, expected) => {
      cache.set('key', 'alive', 60_000);
      jest.advanceTimersByTime(advanceMs);
      expect(cache.get('key')).toBe(expected);
    });

    it('should lazily delete expired entries on get', () => {
      cache.set('key', 'val', 100);
      jest.advanceTimersByTime(101);
      cache.get('key');
      expect(cache.size).toBe(0);
    });
  });

  describe('delete', () => {
    it('should remove an existing key and return true', () => {
      cache.set('key', 'val', 60_000);
      expect(cache.delete('key')).toBe(true);
      expect(cache.get('key')).toBeUndefined();
    });

    it('should return false for a non-existent key', () => {
      expect(cache.delete('nope')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('a', 1, 60_000);
      cache.set('b', 2, 60_000);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });

  describe('invalidateByPrefix', () => {
    it('should remove only keys matching the prefix', () => {
      cache.set('search:en:apple', 1, 60_000);
      cache.set('search:en:banana', 2, 60_000);
      cache.set('other:key', 3, 60_000);

      cache.invalidateByPrefix('search:');

      expect(cache.get('search:en:apple')).toBeUndefined();
      expect(cache.get('search:en:banana')).toBeUndefined();
      expect(cache.get('other:key')).toBe(3);
    });

    it('should be a no-op when no keys match', () => {
      cache.set('key', 'val', 60_000);
      cache.invalidateByPrefix('missing:');
      expect(cache.get('key')).toBe('val');
    });
  });

  describe('max-size eviction', () => {
    it('should evict expired entries first when at capacity', () => {
      const smallCache = MemoryCacheService.createWithMaxSize(3);
      smallCache.set('a', 1, 100);
      smallCache.set('b', 2, 60_000);
      smallCache.set('c', 3, 60_000);

      jest.advanceTimersByTime(101);
      smallCache.set('d', 4, 60_000);

      expect(smallCache.get('a')).toBeUndefined();
      expect(smallCache.get('d')).toBe(4);
      expect(smallCache.size).toBeLessThanOrEqual(3);
    });

    it('should evict oldest (FIFO) entry when no expired entries exist', () => {
      const smallCache = MemoryCacheService.createWithMaxSize(2);
      smallCache.set('first', 1, 60_000);
      smallCache.set('second', 2, 60_000);

      smallCache.set('third', 3, 60_000);

      expect(smallCache.get('first')).toBeUndefined();
      expect(smallCache.get('second')).toBe(2);
      expect(smallCache.get('third')).toBe(3);
    });

    it('should not evict when updating an existing key', () => {
      const smallCache = MemoryCacheService.createWithMaxSize(2);
      smallCache.set('a', 1, 60_000);
      smallCache.set('b', 2, 60_000);

      smallCache.set('a', 10, 60_000);

      expect(smallCache.get('a')).toBe(10);
      expect(smallCache.get('b')).toBe(2);
      expect(smallCache.size).toBe(2);
    });

    it('should enforce maxSize under sustained inserts', () => {
      const smallCache = MemoryCacheService.createWithMaxSize(5);
      for (let i = 0; i < 20; i++) {
        smallCache.set(`key-${i}`, i, 60_000);
      }
      expect(smallCache.size).toBeLessThanOrEqual(5);
    });
  });

  describe('size', () => {
    it('should reflect the current number of entries', () => {
      expect(cache.size).toBe(0);
      cache.set('a', 1, 60_000);
      expect(cache.size).toBe(1);
      cache.set('b', 2, 60_000);
      expect(cache.size).toBe(2);
      cache.delete('a');
      expect(cache.size).toBe(1);
    });
  });
});
