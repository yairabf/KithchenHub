import type { ShoppingList } from '../../../mocks/shopping';

/**
 * Selects the best matching list for the current view.
 * Falls back to the first available list when the previous selection is missing.
 */
export const getSelectedList = (
  lists: ShoppingList[],
  currentListId: ShoppingList['id'] | undefined
): ShoppingList | null => {
  if (lists.length === 0) {
    return null;
  }
  if (!currentListId) {
    return lists[0];
  }
  return lists.find((list) => list.id === currentListId) ?? lists[0];
};

/**
 * Selects a valid active list id, preferring the current selection when present.
 */
export const getActiveListId = (
  lists: ShoppingList[],
  currentListId: ShoppingList['id'] | null
): ShoppingList['id'] | null => {
  if (lists.length === 0) {
    return null;
  }
  if (currentListId && lists.some((list) => list.id === currentListId)) {
    return currentListId;
  }
  return lists[0].id;
};
