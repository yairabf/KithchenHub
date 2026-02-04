import type { ShoppingList } from '../../../mocks/shopping';

/**
 * Gets the main list for the household, or null if none exists.
 */
export const getMainList = (lists: ShoppingList[]): ShoppingList | null => {
  return lists.find((list) => list.isMain) ?? null;
};

/**
 * Selects the best matching list for the current view.
 * Priority: 1) Previously selected list, 2) Main list, 3) First list
 */
export const getSelectedList = (
  lists: ShoppingList[],
  currentListId: ShoppingList['id'] | undefined
): ShoppingList | null => {
  if (lists.length === 0) return null;
  
  // If currentListId is provided and exists, use it
  if (currentListId) {
    const currentList = lists.find((list) => list.id === currentListId);
    if (currentList) return currentList;
  }
  
  // Otherwise prefer main list, then first list
  return getMainList(lists) ?? lists[0];
};

/**
 * Selects a valid active list id for quick-add operations.
 * Priority: 1) Main list, 2) Current selection, 3) First list
 */
export const getActiveListId = (
  lists: ShoppingList[],
  currentListId: ShoppingList['id'] | null
): ShoppingList['id'] | null => {
  if (lists.length === 0) return null;
  
  // Always prefer main list for quick-add
  const mainList = getMainList(lists);
  if (mainList) return mainList.id;
  
  // Fall back to current or first
  if (currentListId && lists.some((list) => list.id === currentListId)) {
    return currentListId;
  }
  return lists[0].id;
};
