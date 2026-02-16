/**
 * Tests for Set utility functions
 */

import { toggleSetItem, addToSet, removeFromSet } from '../setUtils';

describe('setUtils', () => {
  describe('toggleSetItem', () => {
    describe.each([
      ['empty set, add item', new Set<string>(), 'item1', new Set(['item1'])],
      ['set with item, remove it', new Set(['item1']), 'item1', new Set<string>()],
      ['set with multiple items, remove one', new Set(['item1', 'item2', 'item3']), 'item2', new Set(['item1', 'item3'])],
      ['set with multiple items, add new one', new Set(['item1', 'item2']), 'item3', new Set(['item1', 'item2', 'item3'])],
    ])('%s', (description, inputSet, item, expectedSet) => {
      it(`should handle: ${description}`, () => {
        const result = toggleSetItem(inputSet, item);
        
        expect(result).toEqual(expectedSet);
        expect(result).not.toBe(inputSet); // Ensure immutability
      });
    });

    it('should not mutate the original Set', () => {
      const original = new Set(['item1', 'item2']);
      const originalSize = original.size;
      
      toggleSetItem(original, 'item3');
      
      expect(original.size).toBe(originalSize);
      expect(original.has('item3')).toBe(false);
    });

    it('should work with different types', () => {
      const numbers = new Set([1, 2, 3]);
      const result = toggleSetItem(numbers, 2);
      
      expect(result).toEqual(new Set([1, 3]));
    });

    it('should handle objects correctly', () => {
      const obj1 = { id: '1' };
      const obj2 = { id: '2' };
      const objects = new Set([obj1]);
      
      const result = toggleSetItem(objects, obj2);
      
      expect(result).toEqual(new Set([obj1, obj2]));
    });
  });

  describe('addToSet', () => {
    describe.each([
      ['empty set', new Set<string>(), 'item1', new Set(['item1'])],
      ['set with items', new Set(['item1']), 'item2', new Set(['item1', 'item2'])],
      ['set already containing item', new Set(['item1', 'item2']), 'item1', new Set(['item1', 'item2'])],
    ])('%s', (description, inputSet, item, expectedSet) => {
      it(`should handle: ${description}`, () => {
        const result = addToSet(inputSet, item);
        
        expect(result).toEqual(expectedSet);
        expect(result).not.toBe(inputSet); // Ensure immutability
      });
    });

    it('should not mutate the original Set', () => {
      const original = new Set(['item1']);
      const originalSize = original.size;
      
      addToSet(original, 'item2');
      
      expect(original.size).toBe(originalSize);
      expect(original.has('item2')).toBe(false);
    });
  });

  describe('removeFromSet', () => {
    describe.each([
      ['set with item', new Set(['item1', 'item2']), 'item1', new Set(['item2'])],
      ['set without item', new Set(['item1']), 'item2', new Set(['item1'])],
      ['empty set', new Set<string>(), 'item1', new Set<string>()],
    ])('%s', (description, inputSet, item, expectedSet) => {
      it(`should handle: ${description}`, () => {
        const result = removeFromSet(inputSet, item);
        
        expect(result).toEqual(expectedSet);
        expect(result).not.toBe(inputSet); // Ensure immutability
      });
    });

    it('should not mutate the original Set', () => {
      const original = new Set(['item1', 'item2']);
      const originalSize = original.size;
      
      removeFromSet(original, 'item1');
      
      expect(original.size).toBe(originalSize);
      expect(original.has('item1')).toBe(true);
    });
  });
});
