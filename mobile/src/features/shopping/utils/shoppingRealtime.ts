import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import { colors } from '../../../theme';

type ShoppingListRow = {
  id: string;
  name?: string;
  color?: string | null;
  household_id?: string | null;
};

type ShoppingItemRow = {
  id: string;
  list_id?: string | null;
  name?: string | null;
  quantity?: number | null;
  category?: string | null;
  is_checked?: boolean | null;
};

const DEFAULT_LIST_ICON: ShoppingList['icon'] = 'cart-outline';
const DEFAULT_LIST_COLOR = colors.shopping;

const normalizeListColor = (color?: string | null) => {
  return color ?? DEFAULT_LIST_COLOR;
};

const normalizeListName = (name?: string | null, fallbackName?: string) => {
  return name ?? fallbackName ?? 'Untitled List';
};

const findMatchingGrocery = (items: GroceryItem[], name: string | null | undefined) => {
  if (!name) {
    return undefined;
  }

  const loweredName = name.toLowerCase();
  return items.find((item) => item.name.toLowerCase() === loweredName);
};

const mapListRowToList = (row: ShoppingListRow, existing?: ShoppingList): ShoppingList => {
  return {
    id: row.id,
    localId: row.id,
    name: normalizeListName(row.name, existing?.name),
    itemCount: existing?.itemCount ?? 0,
    icon: existing?.icon ?? DEFAULT_LIST_ICON,
    color: normalizeListColor(row.color ?? existing?.color),
  };
};

const mapItemRowToItem = (
  row: ShoppingItemRow,
  groceryItems: GroceryItem[],
  existing?: ShoppingItem,
): ShoppingItem => {
  const matchingGrocery = findMatchingGrocery(groceryItems, row.name ?? existing?.name);

  return {
    id: row.id,
    localId: row.id,
    name: row.name ?? existing?.name ?? 'Untitled Item',
    image: matchingGrocery?.image ?? existing?.image ?? '',
    quantity: row.quantity ?? existing?.quantity ?? 1,
    category: row.category ?? matchingGrocery?.category ?? existing?.category ?? 'Other',
    listId: row.list_id ?? existing?.listId ?? '',
    isChecked: row.is_checked ?? existing?.isChecked ?? false,
  };
};

export const applyShoppingListChange = (
  lists: ShoppingList[],
  payload: RealtimePostgresChangesPayload<ShoppingListRow>,
): ShoppingList[] => {
  if (payload.eventType === 'DELETE') {
    const deletedId = payload.old?.id;
    if (!deletedId) {
      return lists;
    }

    return lists.filter((list) => list.id !== deletedId);
  }

  const updatedRow = payload.new;
  if (!updatedRow?.id) {
    return lists;
  }

  const existing = lists.find((list) => list.id === updatedRow.id);
  const nextList = mapListRowToList(updatedRow, existing);

  if (!existing) {
    return [...lists, nextList];
  }

  return lists.map((list) => (list.id === updatedRow.id ? nextList : list));
};

export const applyShoppingItemChange = (
  items: ShoppingItem[],
  payload: RealtimePostgresChangesPayload<ShoppingItemRow>,
  groceryItems: GroceryItem[],
): ShoppingItem[] => {
  if (payload.eventType === 'DELETE') {
    const deletedId = payload.old?.id;
    if (!deletedId) {
      return items;
    }

    return items.filter((item) => item.id !== deletedId);
  }

  const updatedRow = payload.new;
  if (!updatedRow?.id) {
    return items;
  }

  const existing = items.find((item) => item.id === updatedRow.id);
  const nextItem = mapItemRowToItem(updatedRow, groceryItems, existing);

  if (!existing) {
    return [...items, nextItem];
  }

  return items.map((item) => (item.id === updatedRow.id ? nextItem : item));
};

export const updateShoppingListItemCounts = (
  lists: ShoppingList[],
  items: ShoppingItem[],
): ShoppingList[] => {
  const countMap = items.reduce<Record<string, number>>((acc, item) => {
    const nextCount = (acc[item.listId] ?? 0) + 1;
    return { ...acc, [item.listId]: nextCount };
  }, {});

  let hasChanges = false;
  const nextLists = lists.map((list) => {
    const nextCount = countMap[list.id] ?? 0;
    if (list.itemCount === nextCount) {
      return list;
    }

    hasChanges = true;
    return { ...list, itemCount: nextCount };
  });

  return hasChanges ? nextLists : lists;
};

export const buildListIdFilter = (listIds: string[]): string | null => {
  if (listIds.length === 0) {
    return null;
  }

  const uniqueIds = Array.from(new Set(listIds)).sort();
  return `list_id=in.(${uniqueIds.join(',')})`;
};
