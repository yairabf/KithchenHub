import * as Crypto from 'expo-crypto';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping/shoppingItems';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const createShoppingItem = (
    groceryItem: Omit<ShoppingItem, 'id' | 'localId' | 'listId' | 'quantity'> | GroceryItem,
    listId: string,
    quantity: number
): ShoppingItem => {
    return {
        id: `item-${Date.now()}`,
        localId: Crypto.randomUUID(),
        name: groceryItem.name,
        image: groceryItem.image,
        quantity: quantity,
        category: groceryItem.category,
        listId: listId,
    };
};

export const createShoppingList = (
    name: string,
    icon: IoniconsName,
    color: string
): ShoppingList => {
    return {
        id: `list-${Date.now()}`,
        localId: Crypto.randomUUID(),
        name: name,
        itemCount: 0,
        icon: icon,
        color: color,
    };
};
