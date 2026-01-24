import { api } from '../../../services/api';
import { mockGroceriesDB } from '../../../data/groceryDatabase';
import {
  mockItems,
  mockShoppingLists,
  mockCategories,
  mockFrequentlyAddedItems,
  type ShoppingItem,
  type ShoppingList,
  type Category,
} from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import { pastelColors, colors } from '../../../theme';

/**
 * Provides shopping data sources (mock vs remote) for the shopping feature.
 */
export interface ShoppingData {
  shoppingLists: ShoppingList[];
  shoppingItems: ShoppingItem[];
  categories: Category[];
  groceryItems: GroceryItem[];
  frequentlyAddedItems: GroceryItem[];
}

export interface IShoppingService {
  getShoppingData(): Promise<ShoppingData>;
}

type GrocerySearchItemDto = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  defaultQuantity?: number | null;
};

type ShoppingListSummaryDto = {
  id: string;
  name: string;
  color?: string | null;
  itemCount?: number | null;
};

type ShoppingListDetailDto = {
  id: string;
  name: string;
  color?: string | null;
  items: {
    id: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
    isChecked?: boolean | null;
    category?: string | null;
  }[];
};

const DEFAULT_LIST_ICON: ShoppingList['icon'] = 'cart-outline';
const DEFAULT_LIST_COLOR = colors.shopping;

const mapGroceryItem = (item: GrocerySearchItemDto): GroceryItem => ({
  id: item.id,
  name: item.name,
  image: item.imageUrl ?? '',
  category: item.category,
  defaultQuantity: item.defaultQuantity ?? 1,
});

const buildCategoriesFromGroceries = (items: GroceryItem[]): Category[] => {
  const categoryMap = items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const key = item.category || 'Other';
    const existing = acc[key] ?? [];
    return { ...acc, [key]: [...existing, item] };
  }, {});

  return Object.entries(categoryMap).map(([categoryName, categoryItems], index) => {
    const fallbackImage = categoryItems.find(item => item.image)?.image ?? '';
    return {
      id: categoryName.toLowerCase().replace(/\s+/g, '-'),
      name: categoryName,
      itemCount: categoryItems.length,
      image: fallbackImage,
      backgroundColor: pastelColors[index % pastelColors.length],
    };
  });
};

const buildFrequentlyAddedItems = (items: GroceryItem[]): GroceryItem[] => {
  return items.slice(0, 8);
};

const mapShoppingListSummary = (list: ShoppingListSummaryDto): ShoppingList => ({
  id: list.id,
  localId: list.id,
  name: list.name,
  itemCount: list.itemCount ?? 0,
  icon: DEFAULT_LIST_ICON,
  color: list.color ?? DEFAULT_LIST_COLOR,
});

const buildShoppingItemsFromDetails = (
  listId: string,
  items: ShoppingListDetailDto['items'],
  groceries: GroceryItem[],
): ShoppingItem[] => {
  return items.map((item) => {
    const matchingGrocery = groceries.find(
      (grocery) => grocery.name.toLowerCase() === item.name.toLowerCase()
    );

    return {
      id: item.id,
      localId: item.id,
      name: item.name,
      image: matchingGrocery?.image ?? '',
      quantity: item.quantity ?? 1,
      unit: item.unit ?? undefined,
      isChecked: item.isChecked ?? false,
      category: item.category ?? matchingGrocery?.category ?? 'Other',
      listId,
    };
  });
};

export class LocalShoppingService implements IShoppingService {
  async getShoppingData(): Promise<ShoppingData> {
    return {
      shoppingLists: [...mockShoppingLists],
      shoppingItems: [...mockItems],
      categories: [...mockCategories],
      groceryItems: [...mockGroceriesDB],
      frequentlyAddedItems: [...mockFrequentlyAddedItems],
    };
  }
}

export class RemoteShoppingService implements IShoppingService {
  async getShoppingData(): Promise<ShoppingData> {
    const groceryItems = await this.getGroceryItems();
    const shoppingLists = await this.getShoppingLists();
    const shoppingItems = await this.getShoppingItems(shoppingLists, groceryItems);

    const categories = buildCategoriesFromGroceries(groceryItems);
    const frequentlyAddedItems = buildFrequentlyAddedItems(groceryItems);

    return {
      shoppingLists,
      shoppingItems,
      categories,
      groceryItems,
      frequentlyAddedItems,
    };
  }

  private async getGroceryItems(): Promise<GroceryItem[]> {
    const results = await api.get<GrocerySearchItemDto[]>('/groceries/search?q=');
    return results.map(mapGroceryItem);
  }

  private async getShoppingLists(): Promise<ShoppingList[]> {
    const lists = await api.get<ShoppingListSummaryDto[]>('/shopping-lists');
    return lists.map(mapShoppingListSummary);
  }

  private async getShoppingItems(
    shoppingLists: ShoppingList[],
    groceryItems: GroceryItem[],
  ): Promise<ShoppingItem[]> {
    const listDetails = await Promise.all(
      shoppingLists.map((list) =>
        api.get<ShoppingListDetailDto>(`/shopping-lists/${list.id}`)
      )
    );

    return listDetails.flatMap((listDetail) =>
      buildShoppingItemsFromDetails(listDetail.id, listDetail.items, groceryItems)
    );
  }
}

export const createShoppingService = (isMockEnabled: boolean): IShoppingService => {
  return isMockEnabled ? new LocalShoppingService() : new RemoteShoppingService();
};
