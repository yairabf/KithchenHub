import * as Crypto from 'expo-crypto';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping/shoppingItems';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { withCreatedAtAndUpdatedAt } from '../../../common/utils/timestamps';

/**
 * Returns a copy of `serverItem` with the `name` replaced by `localName`.
 *
 * The server always returns the English catalog name. This helper ensures the
 * UI keeps whatever translated name the client set when the item was created
 * or last edited.
 *
 * @param serverItem - The item returned by the server (English name)
 * @param localName  - The locally-translated name to preserve
 * @returns A new ShoppingItem with the local name applied
 */
export const preserveLocalizedName = (
  serverItem: ShoppingItem,
  localName: string,
): ShoppingItem => ({ ...serverItem, name: localName });

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export const createShoppingItem = (
  groceryItem: Omit<ShoppingItem, 'id' | 'localId' | 'listId' | 'quantity' | 'isChecked'> | GroceryItem,
  listId: string,
  quantity: number,
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
    // Propagate catalog ID so the realtime dedup handler can match by ID
    // rather than name, preventing Hebrew ↔ English name mismatches from
    // creating duplicate items when the realtime INSERT fires before the
    // API response.
    catalogItemId:
      'id' in groceryItem &&
      typeof groceryItem.id === 'string' &&
      !groceryItem.id.startsWith('custom-')
        ? groceryItem.id
        : undefined,
  };
  // Business rule: auto-populate createdAt and updatedAt on creation
  return withCreatedAtAndUpdatedAt<ShoppingItem>(item as ShoppingItem);
};

export const createShoppingList = (
  name: string,
  icon: IoniconsName,
  color: string,
): ShoppingList => {
  const list = {
    id: `list-${Date.now()}`,
    localId: Crypto.randomUUID(),
    name: name,
    itemCount: 0,
    icon: icon,
    color: color,
    isMain: false,
  };
  // Business rule: auto-populate createdAt and updatedAt on creation
  return withCreatedAtAndUpdatedAt<ShoppingList>(list as ShoppingList);
};
