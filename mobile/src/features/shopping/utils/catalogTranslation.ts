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

import type { ShoppingItem } from '../../../mocks/shopping';

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

/**
 * Translates the `name` field of every catalog-linked shopping item to the
 * requested locale.
 *
 * Items without a `catalogItemId` (custom user items) are returned as-is.
 * Duplicate catalog IDs are de-duplicated before the network call to minimize
 * the request payload. On any network or parsing error the original items are
 * returned unchanged so the UI never crashes.
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
  const uniqueCatalogIds = collectUniqueCatalogIds(items);
  if (uniqueCatalogIds.length === 0) {
    return items;
  }

  try {
    const translations = await fetchDisplayNames(uniqueCatalogIds, lang);
    const nameById = buildNameLookup(translations);
    return applyTranslations(items, nameById);
  } catch {
    // Network/parsing errors must not break the shopping list UI
    return items;
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Collects the unique, non-null catalogItemIds from a list of shopping items.
 */
function collectUniqueCatalogIds(items: ShoppingItem[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (item.catalogItemId != null) {
      seen.add(item.catalogItemId);
    }
  }
  return Array.from(seen);
}

/**
 * Builds a Map from catalogItemId → translated name for O(1) lookup.
 */
function buildNameLookup(translations: CatalogDisplayName[]): Map<string, string> {
  return new Map(translations.map((t) => [t.id, t.name]));
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
    const translatedName = nameById.get(item.catalogItemId);
    return translatedName ? { ...item, name: translatedName } : item;
  });
}
