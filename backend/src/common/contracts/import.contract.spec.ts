import { z } from 'zod';
import { describe, it, expect } from '@jest/globals';
import {
  ImportRequestSchema,
  ImportResponseSchema,
  ShoppingListSchema,
  RecipeSchema,
  ChoreSchema,
} from './import.contract';

describe('Import Contract Schemas', () => {
  describe('Entity Schemas', () => {
    it('should validate a valid shopping list', () => {
      const validList = {
        localId: 'list-1',
        name: 'Groceries',
        createdAt: new Date().toISOString(),
        items: [
          {
            localId: 'item-1',
            name: 'Milk',
            quantity: 2,
            isChecked: false,
          },
        ],
      };
      const result = ShoppingListSchema.safeParse(validList);
      expect(result.success).toBe(true);
    });

    it('should validate a valid recipe', () => {
      const validRecipe = {
        localId: 'recipe-1',
        title: 'Pancakes',
        ingredients: [{ name: 'Flour', amount: '1 cup' }],
        instructions: ['Mix', 'Cook'],
        createdAt: new Date().toISOString(),
      };
      const result = RecipeSchema.safeParse(validRecipe);
      expect(result.success).toBe(true);
    });

    it('should validate a valid chore', () => {
      const validChore = {
        localId: 'chore-1',
        title: 'Clean Kitchen',
        isCompleted: false,
        dueDate: new Date().toISOString(),
      };
      const result = ChoreSchema.safeParse(validChore);
      expect(result.success).toBe(true);
    });
  });

  describe('ImportRequestSchema', () => {
    it('should validate a full import request', () => {
      const payload = {
        shoppingLists: [{ localId: 'l1', name: 'L1', items: [] }],
        recipes: [{ localId: 'r1', title: 'R1' }],
        chores: [{ localId: 'c1', title: 'C1' }],
      };
      const result = ImportRequestSchema.safeParse(payload);
      if (!result.success) {
        console.error(result.error);
      }
      expect(result.success).toBe(true);
    });

    it('should fail on missing required fields', () => {
      const payload = {
        shoppingLists: [
          { name: 'Missing ID' }, // missing localId
        ],
      };
      const result = ImportRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should allow empty arrays', () => {
      const payload = {};
      // all default to empty array
      const result = ImportRequestSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.shoppingLists).toHaveLength(0);
        expect(result.data.recipes).toHaveLength(0);
        expect(result.data.chores).toHaveLength(0);
      }
    });
  });

  describe('ImportResponseSchema', () => {
    it('should validate a valid response', () => {
      const response = {
        shoppingLists: [{ localId: 'l1', serverId: 's1' }],
        recipes: [{ localId: 'r1', serverId: 's1' }],
        chores: [],
      };
      const result = ImportResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should fail if mappings have missing serverId', () => {
      const response = {
        shoppingLists: [{ localId: 'l1' }], // missing serverId
      };
      const result = ImportResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});
