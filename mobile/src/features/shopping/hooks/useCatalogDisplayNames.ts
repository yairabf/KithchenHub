import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { catalogService } from '../../../common/services/catalogService';
import type { ShoppingItem } from '../../../mocks/shopping';

/**
 * Resolves localized display names for catalog-linked shopping list items.
 * When items or app language change, fetches names from GET /groceries/names and returns a map.
 *
 * @param items - Current list items (e.g. filtered items for the selected list)
 * @returns Map of catalogItemId -> localized display name (only entries that were resolved)
 */
export function useCatalogDisplayNames(items: ShoppingItem[]): Map<string, string> {
  const { i18n } = useTranslation();
  const [displayNames, setDisplayNames] = useState<Map<string, string>>(new Map());

  const catalogIds = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) => item.catalogItemId)
            .filter((id): id is string => typeof id === 'string' && id.trim() !== ''),
        ),
      ),
    [items],
  );

  useEffect(() => {
    if (catalogIds.length === 0) {
      setDisplayNames(new Map());
      return;
    }

    let cancelled = false;
    catalogService
      .getCatalogDisplayNames(catalogIds, i18n.language ?? undefined)
      .then((result) => {
        if (cancelled) return;
        setDisplayNames(new Map(result.map((r) => [r.id, r.name])));
      })
      .catch(() => {
        if (!cancelled) {
          setDisplayNames(new Map());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogIds, i18n.language]);

  return displayNames;
}
