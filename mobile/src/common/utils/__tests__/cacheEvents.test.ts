/**
 * Cache Events Tests
 * 
 * Tests for cache event emitter functionality.
 */

import { cacheEvents } from '../cacheEvents';
import type { SyncEntityType } from '../cacheMetadata';

describe('CacheEventEmitter', () => {
  beforeEach(() => {
    // Remove all listeners before each test
    cacheEvents.removeAllListeners();
  });

  describe('emitCacheChange', () => {
    it.each([
      ['recipes', 'recipes'],
      ['shoppingLists', 'shoppingLists'],
      ['shoppingItems', 'shoppingItems'],
      ['chores', 'chores'],
    ] as [SyncEntityType, string][])(
      'should emit cache change event for %s',
      (entityType, expectedEventName) => {
        const handler = jest.fn();
        cacheEvents.onCacheChange(entityType, handler);

        cacheEvents.emitCacheChange(entityType);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(cacheEvents.listenerCount(`cache:${expectedEventName}:changed`)).toBe(1);
      }
    );
  });

  describe('onCacheChange', () => {
    it('should subscribe to cache change events', () => {
      const handler = jest.fn();
      const entityType: SyncEntityType = 'recipes';

      const unsubscribe = cacheEvents.onCacheChange(entityType, handler);

      expect(cacheEvents.listenerCount('cache:recipes:changed')).toBe(1);

      cacheEvents.emitCacheChange(entityType);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      expect(cacheEvents.listenerCount('cache:recipes:changed')).toBe(0);
    });

    it('should return unsubscribe function', () => {
      const handler = jest.fn();
      const entityType: SyncEntityType = 'recipes';

      const unsubscribe = cacheEvents.onCacheChange(entityType, handler);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(cacheEvents.listenerCount('cache:recipes:changed')).toBe(0);
    });

    it('should allow multiple subscribers for same entity type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const entityType: SyncEntityType = 'recipes';

      cacheEvents.onCacheChange(entityType, handler1);
      cacheEvents.onCacheChange(entityType, handler2);

      expect(cacheEvents.listenerCount('cache:recipes:changed')).toBe(2);

      cacheEvents.emitCacheChange(entityType);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should allow subscribers for different entity types', () => {
      const recipesHandler = jest.fn();
      const choresHandler = jest.fn();

      cacheEvents.onCacheChange('recipes', recipesHandler);
      cacheEvents.onCacheChange('chores', choresHandler);

      cacheEvents.emitCacheChange('recipes');
      expect(recipesHandler).toHaveBeenCalledTimes(1);
      expect(choresHandler).not.toHaveBeenCalled();

      cacheEvents.emitCacheChange('chores');
      expect(recipesHandler).toHaveBeenCalledTimes(1);
      expect(choresHandler).toHaveBeenCalledTimes(1);
    });

    it('should not call handler after unsubscribe', () => {
      const handler = jest.fn();
      const entityType: SyncEntityType = 'recipes';

      const unsubscribe = cacheEvents.onCacheChange(entityType, handler);
      unsubscribe();

      cacheEvents.emitCacheChange(entityType);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('event isolation', () => {
    it('should isolate events between different entity types', () => {
      const recipesHandler = jest.fn();
      const shoppingListsHandler = jest.fn();

      cacheEvents.onCacheChange('recipes', recipesHandler);
      cacheEvents.onCacheChange('shoppingLists', shoppingListsHandler);

      cacheEvents.emitCacheChange('recipes');
      expect(recipesHandler).toHaveBeenCalledTimes(1);
      expect(shoppingListsHandler).not.toHaveBeenCalled();

      cacheEvents.emitCacheChange('shoppingLists');
      expect(recipesHandler).toHaveBeenCalledTimes(1);
      expect(shoppingListsHandler).toHaveBeenCalledTimes(1);
    });
  });
});
