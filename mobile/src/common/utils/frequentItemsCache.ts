import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';
import { getSignedInCacheKey, ENTITY_TYPES } from '../storage/dataModeStorage';
import { logger } from './logger';

const FREQUENTLY_ADDED_ITEMS_STORAGE_KEY = getSignedInCacheKey(
  ENTITY_TYPES.frequentlyAddedItems,
);

function isGroceryItem(value: unknown): value is GroceryItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<GroceryItem>;
  return typeof item.id === 'string' && typeof item.name === 'string';
}

export async function readCachedFrequentItems(): Promise<GroceryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(FREQUENTLY_ADDED_ITEMS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isGroceryItem);
  } catch (error) {
    logger.warn('[frequentItemsCache] Ignoring malformed frequent-items cache', error);
    return [];
  }
}

export async function writeCachedFrequentItems(items: GroceryItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      FREQUENTLY_ADDED_ITEMS_STORAGE_KEY,
      JSON.stringify(items),
    );
  } catch (error) {
    logger.warn('[frequentItemsCache] Failed to write frequent-items cache', error);
  }
}
