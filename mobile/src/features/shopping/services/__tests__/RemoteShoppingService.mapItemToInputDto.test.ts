/**
 * Tests for RemoteShoppingService.mapItemToInputDto()
 * 
 * Validates that frontend ShoppingItem is correctly mapped to backend ShoppingItemInputDto
 * with proper handling of catalogItemId, masterItemId, and name fields.
 */

import { RemoteShoppingService } from '../RemoteShoppingService';
import type { ShoppingItem } from '../../../../mocks/shopping';

// Mock dependencies
jest.mock('../../../../services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../../common/repositories/cacheAwareRepository', () => ({
  addEntityToCache: jest.fn(),
  updateEntityInCache: jest.fn(),
}));

jest.mock('../../../../common/services/catalogService', () => ({
  catalogService: {
    getGroceryItems: jest.fn(),
  },
}));

describe('RemoteShoppingService.mapItemToInputDto', () => {
  let service: RemoteShoppingService;

  beforeEach(() => {
    service = new RemoteShoppingService();
  });

  describe('with catalogItemId', () => {
    it.each([
      [
        'should include catalogItemId and exclude name',
        { catalogItemId: 'cat-123', name: 'Item', quantity: 1, listId: 'list-1' },
        { catalogItemId: 'cat-123', quantity: 1, isChecked: false }
      ],
      [
        'should include catalogItemId with all optional fields',
        { catalogItemId: 'cat-456', name: 'Item', quantity: 2, unit: 'kg', category: 'Produce', isChecked: true, listId: 'list-1' },
        { catalogItemId: 'cat-456', quantity: 2, unit: 'kg', category: 'Produce', isChecked: true }
      ],
    ])('%s', (description, input, expected) => {
      const result = (service as any).mapItemToInputDto(input);
      expect(result).toEqual(expected);
      expect(result.name).toBeUndefined();
      expect(result.catalogItemId).toBe(expected.catalogItemId);
    });
  });

  describe('with masterItemId', () => {
    it.each([
      [
        'should include masterItemId and exclude name',
        { masterItemId: 'master-789', name: 'Item', quantity: 1, listId: 'list-1' },
        { masterItemId: 'master-789', quantity: 1, isChecked: false }
      ],
      [
        'should include masterItemId with category',
        { masterItemId: 'master-101', name: 'Item', quantity: 3, category: 'Dairy', listId: 'list-1' },
        { masterItemId: 'master-101', quantity: 3, category: 'Dairy', isChecked: false }
      ],
    ])('%s', (description, input, expected) => {
      const result = (service as any).mapItemToInputDto(input);
      expect(result).toEqual(expected);
      expect(result.name).toBeUndefined();
      expect(result.masterItemId).toBe(expected.masterItemId);
    });
  });

  describe('with name only (custom item)', () => {
    it.each([
      [
        'should include name when no catalog identifiers',
        { name: 'Custom Item', quantity: 1, listId: 'list-1' },
        { name: 'Custom Item', quantity: 1, isChecked: false }
      ],
      [
        'should trim whitespace from name',
        { name: '  Custom Item  ', quantity: 2, listId: 'list-1' },
        { name: 'Custom Item', quantity: 2, isChecked: false }
      ],
      [
        'should include name with all optional fields',
        { name: 'Custom Item', quantity: 5, unit: 'pieces', category: 'Other', isChecked: false, listId: 'list-1' },
        { name: 'Custom Item', quantity: 5, unit: 'pieces', category: 'Other', isChecked: false }
      ],
    ])('%s', (description, input, expected) => {
      const result = (service as any).mapItemToInputDto(input);
      expect(result).toEqual(expected);
      expect(result.catalogItemId).toBeUndefined();
      expect(result.masterItemId).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    it.each([
      [
        'should throw when name is required but missing',
        { quantity: 1, listId: 'list-1' },
        'Item name is required when catalogItemId/masterItemId is not provided'
      ],
      [
        'should throw when name is empty string',
        { name: '', quantity: 1, listId: 'list-1' },
        'Item name is required when catalogItemId/masterItemId is not provided'
      ],
      [
        'should throw when name is only whitespace',
        { name: '   ', quantity: 1, listId: 'list-1' },
        'Item name is required when catalogItemId/masterItemId is not provided'
      ],
      [
        'should throw when quantity is negative',
        { name: 'Item', quantity: -1, listId: 'list-1' },
        'Item quantity cannot be negative'
      ],
    ])('%s', (description, input, expectedError) => {
      expect(() => {
        (service as any).mapItemToInputDto(input);
      }).toThrow(expectedError);
    });
  });

  describe('default values', () => {
    it.each([
      [
        'should default quantity to 1 when undefined',
        { name: 'Item', listId: 'list-1' },
        { name: 'Item', quantity: 1, isChecked: false }
      ],
      [
        'should default isChecked to false when undefined',
        { name: 'Item', quantity: 2, listId: 'list-1' },
        { name: 'Item', quantity: 2, isChecked: false }
      ],
      [
        'should preserve undefined optional fields',
        { name: 'Item', quantity: 1, listId: 'list-1' },
        { name: 'Item', quantity: 1, isChecked: false }
        // unit and category should be undefined, not included
      ],
    ])('%s', (description, input, expected) => {
      const result = (service as any).mapItemToInputDto(input);
      expect(result.quantity).toBe(expected.quantity);
      expect(result.isChecked).toBe(expected.isChecked);
    });
  });

  describe('catalogItemId takes precedence over masterItemId', () => {
    it('should use catalogItemId when both are provided', () => {
      const input = { catalogItemId: 'cat-123', masterItemId: 'master-456', name: 'Item', quantity: 1, listId: 'list-1' };
      const result = (service as any).mapItemToInputDto(input);
      expect(result.catalogItemId).toBe('cat-123');
      expect(result.masterItemId).toBeUndefined();
      expect(result.name).toBeUndefined();
    });
  });
});
