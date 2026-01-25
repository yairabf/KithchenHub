import * as Crypto from 'expo-crypto';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping/shoppingItems';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { withCreatedAt } from '../../../common/utils/timestamps';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const createShoppingItem = (
    groceryItem: Omit<ShoppingItem, 'id' | 'localId' | 'listId' | 'quantity' | 'isChecked'> | GroceryItem,
    listId: string,
    quantity: number
): ShoppingItem => {
    const item = {
        id: `item-${Date.now()}`,
        localId: Crypto.randomUUID(),
        name: groceryItem.name,
        image: groceryItem.image,
        quantity: quantity,
        category: groceryItem.category,
        listId: listId,
        isChecked: false,
    };
    // Business rule: auto-populate createdAt on creation
    return withCreatedAt(item);
};

export const createShoppingList = (
    name: string,
    icon: IoniconsName,
    color: string
): ShoppingList => {
    const list = {
        id: `list-${Date.now()}`,
        localId: Crypto.randomUUID(),
        name: name,
        itemCount: 0,
        icon: icon,
        color: color,
    };
    // Business rule: auto-populate createdAt on creation
    return withCreatedAt(list);
};
