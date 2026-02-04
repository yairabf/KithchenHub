import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import { colors } from '../../../theme';
import { isEntityDeleted } from '../../../common/types/entityMetadata';
import { mergeEntitiesWithTombstones } from '../../../common/utils/conflictResolution';
import { fromSupabaseTimestamps } from '../../../common/utils/timestamps';

type ShoppingListRow = {
  id: string;
  name?: string;
  color?: string | null;
  household_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
};

type ShoppingItemRow = {
  id: string;
  list_id?: string | null;
  name?: string | null;
  quantity?: number | null;
  category?: string | null;
  is_checked?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  deletedAt?: string | Date | null;
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
  const base = {
    id: row.id,
    localId: row.id,
    name: normalizeListName(row.name, existing?.name),
    itemCount: existing?.itemCount ?? 0,
    icon: existing?.icon ?? DEFAULT_LIST_ICON,
    color: normalizeListColor(row.color ?? existing?.color),
  };

  // Normalize timestamps from snake_case to camelCase Date objects
  // Prefer snake_case from database, fallback to camelCase if already normalized
  // Convert null to undefined for fromSupabaseTimestamps compatibility
  const withTimestamps = fromSupabaseTimestamps({
    ...base,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    deleted_at: row.deleted_at ?? undefined,
  });

  // If timestamps were already in camelCase (from existing), preserve them
  // Convert to Date objects if they're strings
  if (row.createdAt || row.updatedAt || row.deletedAt) {
    const result: ShoppingList = {
      ...withTimestamps,
      createdAt: row.createdAt instanceof Date 
        ? row.createdAt 
        : (typeof row.createdAt === 'string' ? new Date(row.createdAt) : withTimestamps.createdAt),
      updatedAt: row.updatedAt instanceof Date 
        ? row.updatedAt 
        : (typeof row.updatedAt === 'string' ? new Date(row.updatedAt) : withTimestamps.updatedAt),
      deletedAt: row.deletedAt instanceof Date 
        ? row.deletedAt 
        : (typeof row.deletedAt === 'string' ? new Date(row.deletedAt) : withTimestamps.deletedAt),
    };
    return result;
  }

  return withTimestamps;
};

const mapItemRowToItem = (
  row: ShoppingItemRow,
  groceryItems: GroceryItem[],
  existing?: ShoppingItem,
): ShoppingItem => {
  const matchingGrocery = findMatchingGrocery(groceryItems, row.name ?? existing?.name);

  const base = {
    id: row.id,
    // Preserve localId from existing item if it's an optimistic entity (localId !== id)
    // Otherwise use row.id as localId
    localId: existing?.localId && existing.localId !== existing.id ? existing.localId : row.id,
    name: row.name ?? existing?.name ?? 'Untitled Item',
    image: matchingGrocery?.image ?? existing?.image ?? '',
    quantity: row.quantity ?? existing?.quantity ?? 1,
    category: row.category ?? matchingGrocery?.category ?? existing?.category ?? 'Other',
    listId: row.list_id ?? existing?.listId ?? '',
    isChecked: row.is_checked ?? existing?.isChecked ?? false,
  };

  // Normalize timestamps from snake_case to camelCase Date objects
  // Prefer snake_case from database, fallback to camelCase if already normalized
  // Convert null to undefined for fromSupabaseTimestamps compatibility
  const withTimestamps = fromSupabaseTimestamps({
    ...base,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    deleted_at: row.deleted_at ?? undefined,
  });

  // If timestamps were already in camelCase (from existing), preserve them
  // Convert to Date objects if they're strings
  if (row.createdAt || row.updatedAt || row.deletedAt) {
    const result: ShoppingItem = {
      ...withTimestamps,
      createdAt: row.createdAt instanceof Date 
        ? row.createdAt 
        : (typeof row.createdAt === 'string' ? new Date(row.createdAt) : withTimestamps.createdAt),
      updatedAt: row.updatedAt instanceof Date 
        ? row.updatedAt 
        : (typeof row.updatedAt === 'string' ? new Date(row.updatedAt) : withTimestamps.updatedAt),
      deletedAt: row.deletedAt instanceof Date 
        ? row.deletedAt 
        : (typeof row.deletedAt === 'string' ? new Date(row.deletedAt) : withTimestamps.deletedAt),
    };
    return result;
  }

  return withTimestamps;
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
    if (isEntityDeleted(nextList)) {
      return lists;
    }
    return [...lists, nextList];
  }

  const merged = mergeEntitiesWithTombstones(existing, nextList);
  if (!merged) {
    return lists.filter((list) => list.id !== updatedRow.id);
  }

  return lists.map((list) => (list.id === updatedRow.id ? merged : list));
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

  // Check for existing item by ID (server ID)
  const existingById = items.find((item) => item.id === updatedRow.id);
  
  // Also check for items with same name and listId to catch optimistic updates
  // that haven't been replaced yet (race condition protection)
  // Match optimistic entities: items where name+listId match and either:
  // 1. id === localId (initial optimistic entity before API response)
  // 2. localId exists and differs from id (optimistic entity that was partially updated)
  const existingByContent = !existingById 
    ? items.find((item) => {
        const nameMatches = item.name === (updatedRow.name ?? '');
        const listIdMatches = item.listId === (updatedRow.list_id ?? '');
        if (!nameMatches || !listIdMatches) {
          return false;
        }
        // Match optimistic entities: has localId and either matches id (initial) or differs (updated)
        return item.localId && (
          item.id === item.localId || // Initial optimistic entity (id === localId === UUID)
          item.localId !== item.id    // Updated optimistic entity (localId preserved, id changed to server ID)
        );
      })
    : null;

  const existing = existingById ?? existingByContent ?? undefined;
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shoppingRealtime.ts:227',message:'applyShoppingItemChange matching',data:{incomingId:updatedRow.id,incomingName:updatedRow.name,existingById:existingById?.id,existingByContent:existingByContent?.id,itemsCount:items.length,items:items.map(i=>({id:i.id,localId:i.localId,name:i.name}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion
  const nextItem = mapItemRowToItem(updatedRow, groceryItems, existing);

  if (!existing) {
    if (isEntityDeleted(nextItem)) {
      return items;
    }
    // Double-check for duplicates by server ID before adding (defensive)
    // This handles race conditions where cache was updated between reads
    const duplicateCheck = items.find((item) => item.id === updatedRow.id);
    if (duplicateCheck) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shoppingRealtime.ts:234',message:'duplicate found in double-check',data:{incomingId:updatedRow.id,duplicateId:duplicateCheck.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion
      // Item already exists - update it instead of adding
      return items.map((item) => 
        item.id === updatedRow.id ? nextItem : item
      );
    }
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shoppingRealtime.ts:242',message:'ADDING new item (no existing found)',data:{incomingId:updatedRow.id,incomingName:updatedRow.name,beforeCount:items.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    }
    // #endregion
    return [...items, nextItem];
  }

  // If we found an optimistic entity by content, replace it with the real one
  if (existingByContent && !existingById) {
    // Replace optimistic entity with real entity, preserving localId
    const realItem = { ...nextItem, localId: existing.localId ?? nextItem.id } as ShoppingItem;
    // Match by id (works for both initial optimistic where id === localId, and updated where id differs)
    return items.map((item) => 
      item.id === existing.id ? realItem : item
    );
  }

  const merged = mergeEntitiesWithTombstones(existing, nextItem);
  if (!merged) {
    return items.filter((item) => item.id !== updatedRow.id);
  }

  return items.map((item) => (item.id === updatedRow.id ? merged : item));
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
