/**
 * catalogTranslation.ts
 *
 * Pure utility for translating shopping item names from the catalog to the user's
 * current locale. Only catalog-linked items (those with a catalogItemId) are
 * affected; user-created custom items keep their original names unchanged.
 *
 * This is intentionally framework-free so it can be used in any screen or hook
 * without coupling to React or navigation context.
 */

import type { ShoppingItem } from "../../../mocks/shopping";

/**
 * Minimal DTO returned by the batch catalog-names endpoint.
 * Mirrors `CatalogDisplayNameDto` in catalogService.ts.
 */
interface CatalogDisplayName {
  id: string;
  name: string;
}

/**
 * Callback type that maps catalog IDs → localized names via the backend.
 * Matches the signature of `catalogService.getCatalogDisplayNames`.
 */
type FetchDisplayNames = (
  ids: string[],
  lang: string,
) => Promise<CatalogDisplayName[]>;

type TranslationCache = Map<string, Map<string, string>>;

const localizedNameCache: TranslationCache = new Map();

/**
 * Clears the in-memory localized catalog-name cache.
 * Exported for tests and for future language/catalog invalidation flows.
 */
export function clearShoppingItemNameTranslationCache(): void {
  localizedNameCache.clear();
}

/**
 * Translates the `name` field of every catalog-linked shopping item to the
 * requested locale.
 *
 * Items without a `catalogItemId` (custom user items) are returned as-is.
 * Duplicate catalog IDs are de-duplicated before the network call to minimize
 * the request payload. Successful responses are cached by locale + catalog ID
 * so future tab switches can render localized names immediately. On any network
 * or parsing error the best available items are returned unchanged so the UI
 * never crashes.
 *
 * @param items            - Shopping items to translate (not mutated)
 * @param lang             - Target locale code, e.g. 'he', 'es', 'en'
 * @param fetchDisplayNames - Async function that resolves a batch of catalog IDs
 *                            to localized display names
 * @returns New array with translated names applied; original array on error
 */
export async function translateShoppingItemNames(
  items: ShoppingItem[],
  lang: string,
  fetchDisplayNames: FetchDisplayNames,
): Promise<ShoppingItem[]> {
  const normalizedLang = normalizeLanguage(lang);
  const uniqueCatalogIds = collectUniqueCatalogIds(items);
  if (uniqueCatalogIds.length === 0) {
    return items;
  }

  const cachedNameById = getCachedNames(normalizedLang);
  const missingCatalogIds = uniqueCatalogIds.filter(
    (id) => !cachedNameById.has(id),
  );

  if (missingCatalogIds.length === 0) {
    return applyTranslations(items, cachedNameById);
  }

  try {
    const translations = await fetchDisplayNames(
      missingCatalogIds,
      normalizedLang,
    );
    storeTranslations(normalizedLang, translations);
    return applyTranslations(items, getCachedNames(normalizedLang));
  } catch {
    // Network/parsing errors must not break the shopping list UI. Still apply
    // any names that were cached before this request failed.
    return applyTranslations(items, cachedNameById);
  }
}

export function applyTranslatedItemNamesToCurrentItems(
  currentItems: ShoppingItem[],
  translatedSnapshot: ShoppingItem[],
  pendingDeletedItemIds: string[] = [],
  pendingLocalItemMutationIds: string[] = [],
): ShoppingItem[] {
  const pendingDeletedKeys = new Set(pendingDeletedItemIds.filter(Boolean));
  const pendingLocalMutationKeys = new Set(pendingLocalItemMutationIds.filter(Boolean));
  const currentByKey = new Map<string, ShoppingItem>();

  for (const item of currentItems) {
    for (const key of getItemIdentityKeys(item)) {
      currentByKey.set(key, item);
    }
  }

  const usedCurrentItems = new Set<ShoppingItem>();
  const usedCatalogKeys = new Set<string>();
  const mergedItems: ShoppingItem[] = [];

  for (const translatedItem of translatedSnapshot) {
    if (hasAnyIdentityKey(translatedItem, pendingDeletedKeys)) {
      continue;
    }

    let currentItem: ShoppingItem | undefined;
    let matchedKey: string | undefined;
    for (const key of getItemIdentityKeys(translatedItem)) {
      const match = currentByKey.get(key);
      if (match) {
        currentItem = match;
        matchedKey = key;
        break;
      }
    }
    const matchedByCatalogIdentity = Boolean(
      matchedKey?.startsWith("catalog:") &&
        currentItem &&
        currentItem.id !== translatedItem.id &&
        currentItem.localId !== translatedItem.localId,
    );

    if (currentItem) {
      usedCurrentItems.add(currentItem);
    }
    const translatedCatalogKey = getCatalogIdentityKey(translatedItem);
    if (translatedCatalogKey) {
      usedCatalogKeys.add(translatedCatalogKey);
    }

    if (
      currentItem &&
      !matchedByCatalogIdentity &&
      (isOptimisticLocalItem(currentItem) ||
        hasAnyIdentityKey(currentItem, pendingLocalMutationKeys))
    ) {
      mergedItems.push({
        ...translatedItem,
        ...currentItem,
        id: translatedItem.id || currentItem.id,
        localId: currentItem.localId || translatedItem.localId,
        name: translatedItem.name,
      });
    } else if (currentItem && matchedByCatalogIdentity) {
      mergedItems.push({
        ...translatedItem,
        localId: currentItem.localId || translatedItem.localId,
      });
    } else {
      mergedItems.push(translatedItem);
    }
  }

  for (const currentItem of currentItems) {
    const catalogKey = getCatalogIdentityKey(currentItem);
    if (
      !usedCurrentItems.has(currentItem) &&
      (!catalogKey || !usedCatalogKeys.has(catalogKey)) &&
      (isOptimisticLocalItem(currentItem) ||
        hasAnyIdentityKey(currentItem, pendingLocalMutationKeys)) &&
      !hasAnyIdentityKey(currentItem, pendingDeletedKeys)
    ) {
      mergedItems.push(currentItem);
    }
  }

  return mergedItems;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function normalizeLanguage(lang: string): string {
  return lang.trim().toLowerCase() || "en";
}

function getCatalogIdentityKey(item: ShoppingItem): string | undefined {
  const catalogItemId = item.catalogItemId?.trim();
  return catalogItemId ? `catalog:${catalogItemId}` : undefined;
}

function getItemIdentityKeys(item: ShoppingItem): string[] {
  return [item.id, item.localId, getCatalogIdentityKey(item)].filter(
    (key): key is string => Boolean(key),
  );
}

function hasAnyIdentityKey(item: ShoppingItem, keys: Set<string>): boolean {
  return getItemIdentityKeys(item).some((key) => keys.has(key));
}

function isOptimisticLocalItem(item: ShoppingItem): boolean {
  return Boolean(
    item.id?.startsWith("item-") && item.localId && item.localId !== item.id,
  );
}

/**
 * Collects the unique, non-null catalogItemIds from a list of shopping items.
 */
function collectUniqueCatalogIds(items: ShoppingItem[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const catalogItemId = item.catalogItemId?.trim();
    if (catalogItemId) {
      seen.add(catalogItemId);
    }
  }
  return Array.from(seen);
}

function getCachedNames(lang: string): Map<string, string> {
  let cacheForLanguage = localizedNameCache.get(lang);
  if (!cacheForLanguage) {
    cacheForLanguage = new Map();
    localizedNameCache.set(lang, cacheForLanguage);
  }
  return cacheForLanguage;
}

function storeTranslations(
  lang: string,
  translations: CatalogDisplayName[],
): void {
  const cacheForLanguage = getCachedNames(lang);

  for (const translation of translations) {
    const id = translation.id?.trim();
    const name = translation.name?.trim();
    if (id && name) {
      cacheForLanguage.set(id, name);
    }
  }
}

/**
 * Returns a new array where each item's name is replaced with its translation
 * when available. Items without a catalogItemId are passed through unchanged.
 */
function applyTranslations(
  items: ShoppingItem[],
  nameById: Map<string, string>,
): ShoppingItem[] {
  return items.map((item) => {
    if (!item.catalogItemId) return item;
    const translatedName = nameById.get(item.catalogItemId.trim());
    return translatedName ? { ...item, name: translatedName } : item;
  });
}
