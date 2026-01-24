import { createShoppingItem, createShoppingList } from '../shoppingFactory';
import * as Crypto from 'expo-crypto';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

describe('shoppingFactory', () => {
    describe('createShoppingItem', () => {
        it.each([
            [
                'creates item defaults',
                {
                    id: 'g1',
                    name: 'Test Item',
                    image: 'test.jpg',
                    category: 'Test Category',
                    defaultQuantity: 1,
                },
                'list-1',
                2,
            ],
        ])('should create a shopping item with a valid localId (%s)', (_label, groceryItem, listId, quantity) => {
            const item = createShoppingItem(groceryItem, listId, quantity);

            expect(item.localId).toBe('test-uuid-1234');
            expect(item.name).toBe(groceryItem.name);
            expect(item.listId).toBe(listId);
            expect(item.quantity).toBe(quantity);
            expect(item.isChecked).toBe(false);
            expect(item.id).toMatch(/^item-\d+$/); // Legacy ID format verification
        });
    });

    describe('createShoppingList', () => {
        it.each([
            ['creates list defaults', 'My List', 'cart-outline', '#ffffff'],
        ])('should create a shopping list with a valid localId (%s)', (_label, name, icon, color) => {
            const list = createShoppingList(name, icon as 'cart-outline', color);

            expect(list.localId).toBe('test-uuid-1234');
            expect(list.name).toBe(name);
            expect(list.icon).toBe(icon);
            expect(list.color).toBe(color);
            expect(list.itemCount).toBe(0);
            expect(list.id).toMatch(/^list-\d+$/); // Legacy ID format
        });
    });
});
