/**
 * catalogTranslation.spec.ts
 *
 * Unit tests for translateShoppingItemNames.
 * Covers locale translation of catalog-linked items, graceful degradation on errors,
 * custom-item preservation, and de-duplication of catalog ID lookups.
 */

import {
  applyTranslatedItemNamesToCurrentItems,
  clearShoppingItemNameTranslationCache,
  translateShoppingItemNames,
} from "./catalogTranslation";
import type { ShoppingItem } from "../../../mocks/shopping";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeItem(
  overrides: Partial<ShoppingItem> & { id: string },
): ShoppingItem {
  return {
    id: overrides.id,
    localId: overrides.localId ?? overrides.id,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    name: overrides.name ?? "Item",
    image: "",
    quantity: 1,
    category: "produce",
    listId: "list-1",
    isChecked: false,
    catalogItemId: overrides.catalogItemId,
    ...overrides,
  };
}

type FetchDisplayNames = (
  ids: string[],
  lang: string,
) => Promise<Array<{ id: string; name: string }>>;

const noopFetch: FetchDisplayNames = jest.fn().mockResolvedValue([]);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("applyTranslatedItemNamesToCurrentItems", () => {
  it("preserves optimistic local additions and pending deletions while applying authoritative snapshot changes", () => {
    const translatedSnapshot = [
      makeItem({
        id: "server-item-1",
        localId: "server-item-1",
        name: "חלב",
        quantity: 5,
        catalogItemId: "catalog-milk",
      }),
      makeItem({
        id: "pending-delete-item",
        name: "לחם",
        catalogItemId: "catalog-bread",
      }),
      makeItem({
        id: "remote-new-item",
        name: "גבינה",
        quantity: 1,
        catalogItemId: "catalog-cheese",
      }),
    ];

    const currentItems = [
      makeItem({
        id: "server-item-1",
        localId: "server-item-1",
        name: "Milk",
        quantity: 3,
        catalogItemId: "catalog-milk",
      }),
      makeItem({
        id: "item-optimistic",
        localId: "local-optimistic",
        name: "Local bananas",
        quantity: 2,
        catalogItemId: "catalog-bananas",
      }),
      makeItem({
        id: "remote-deleted-item",
        localId: "remote-deleted-item",
        name: "Old remote item",
        quantity: 1,
      }),
    ];

    const result = applyTranslatedItemNamesToCurrentItems(
      currentItems,
      translatedSnapshot,
      ["pending-delete-item"],
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: "server-item-1",
        name: "חלב",
        quantity: 5,
      }),
      expect.objectContaining({
        id: "remote-new-item",
        name: "גבינה",
        quantity: 1,
      }),
      expect.objectContaining({
        id: "item-optimistic",
        localId: "local-optimistic",
        name: "Local bananas",
        quantity: 2,
      }),
    ]);
    expect(result.some((item) => item.id === "pending-delete-item")).toBe(
      false,
    );
    expect(result.some((item) => item.id === "remote-deleted-item")).toBe(
      false,
    );
  });

  it("preserves pending local edits on server-backed items while applying translated names", () => {
    const result = applyTranslatedItemNamesToCurrentItems(
      [
        makeItem({
          id: "server-item-1",
          localId: "server-item-1",
          name: "Milk",
          quantity: 7,
          isChecked: true,
          catalogItemId: "catalog-milk",
        }),
      ],
      [
        makeItem({
          id: "server-item-1",
          localId: "server-item-1",
          name: "חלב",
          quantity: 1,
          isChecked: false,
          catalogItemId: "catalog-milk",
        }),
      ],
      [],
      ["server-item-1"],
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: "server-item-1",
        name: "חלב",
        quantity: 7,
        isChecked: true,
      }),
    ]);
  });

  it("matches translated snapshots to optimistic current items by catalog item ID", () => {
    const result = applyTranslatedItemNamesToCurrentItems(
      [
        makeItem({
          id: "item-optimistic",
          localId: "local-optimistic-beans",
          name: "bean sprouts",
          quantity: 1,
          catalogItemId: "catalog-bean-sprouts",
        }),
      ],
      [
        makeItem({
          id: "server-beans",
          localId: "server-beans",
          name: "נבטי שעועית",
          quantity: 1,
          catalogItemId: "catalog-bean-sprouts",
        }),
      ],
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: "server-beans",
        localId: "local-optimistic-beans",
        name: "נבטי שעועית",
        quantity: 1,
        catalogItemId: "catalog-bean-sprouts",
      }),
    ]);
  });

  it("drops a same-catalog optimistic duplicate when the server row is already present", () => {
    const result = applyTranslatedItemNamesToCurrentItems(
      [
        makeItem({
          id: "server-beans",
          localId: "server-beans",
          name: "bean sprouts",
          quantity: 1,
          catalogItemId: "catalog-bean-sprouts",
        }),
        makeItem({
          id: "item-optimistic",
          localId: "local-optimistic-beans",
          name: "bean sprouts",
          quantity: 1,
          catalogItemId: "catalog-bean-sprouts",
        }),
      ],
      [
        makeItem({
          id: "server-beans",
          localId: "server-beans",
          name: "נבטי שעועית",
          quantity: 2,
          catalogItemId: "catalog-bean-sprouts",
        }),
      ],
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: "server-beans",
        localId: "server-beans",
        name: "נבטי שעועית",
        quantity: 2,
        catalogItemId: "catalog-bean-sprouts",
      }),
    ]);
  });

  it("matches translated snapshots to current items by either id or localId", () => {
    const result = applyTranslatedItemNamesToCurrentItems(
      [
        makeItem({
          id: "item-temp",
          localId: "local-temp-item",
          name: "Apple",
          quantity: 4,
          catalogItemId: "catalog-apple",
        }),
      ],
      [
        makeItem({
          id: "server-item",
          localId: "local-temp-item",
          name: "תפוח",
          quantity: 1,
          catalogItemId: "catalog-apple",
        }),
      ],
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: "server-item",
        localId: "local-temp-item",
        name: "תפוח",
        quantity: 4,
      }),
    ]);
  });
});

describe("translateShoppingItemNames", () => {
  beforeEach(() => {
    clearShoppingItemNameTranslationCache();
    jest.clearAllMocks();
  });

  it("returns the original empty array when items list is empty", async () => {
    const result = await translateShoppingItemNames([], "he", noopFetch);
    expect(result).toEqual([]);
    expect(noopFetch).not.toHaveBeenCalled();
  });

  it("does not call fetchDisplayNames when no items have a catalogItemId", async () => {
    const items = [
      makeItem({ id: "custom-1", name: "My Custom Item" }),
      makeItem({ id: "custom-2", name: "Another Custom Item" }),
    ];
    const result = await translateShoppingItemNames(items, "he", noopFetch);
    expect(noopFetch).not.toHaveBeenCalled();
    expect(result).toEqual(items);
  });

  describe.each([
    ["Hebrew", "he", "catalog-apple", "תפוח"],
    ["Spanish", "es", "catalog-apple", "Manzana"],
    ["French", "fr", "catalog-apple", "Pomme"],
    ["English", "en", "catalog-apple", "Apple"],
  ])(
    "%s locale (%s) — translates catalog item name",
    (_locale, lang, catalogId, translatedName) => {
      it(`replaces the English name with the ${lang} translation`, async () => {
        const item = makeItem({
          id: "item-1",
          name: "Apple",
          catalogItemId: catalogId,
        });
        const fetchMock: FetchDisplayNames = jest
          .fn()
          .mockResolvedValue([{ id: catalogId, name: translatedName }]);

        const result = await translateShoppingItemNames(
          [item],
          lang,
          fetchMock,
        );

        expect(fetchMock).toHaveBeenCalledWith([catalogId], lang);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe(translatedName);
      });
    },
  );

  it("keeps custom item names unchanged while translating catalog items", async () => {
    const catalogItem = makeItem({
      id: "item-1",
      name: "Apple",
      catalogItemId: "catalog-apple",
    });
    const customItem = makeItem({ id: "item-2", name: "מוצר מיוחד" });
    const fetchMock: FetchDisplayNames = jest
      .fn()
      .mockResolvedValue([{ id: "catalog-apple", name: "תפוח" }]);

    const result = await translateShoppingItemNames(
      [catalogItem, customItem],
      "he",
      fetchMock,
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("תפוח");
    expect(result[1].name).toBe("מוצר מיוחד");
  });

  it("de-duplicates catalogItemIds before calling fetchDisplayNames", async () => {
    const items = [
      makeItem({ id: "item-1", name: "Apple", catalogItemId: "catalog-apple" }),
      makeItem({ id: "item-2", name: "Apple", catalogItemId: "catalog-apple" }),
      makeItem({
        id: "item-3",
        name: "Banana",
        catalogItemId: "catalog-banana",
      }),
    ];
    const fetchMock: FetchDisplayNames = jest.fn().mockResolvedValue([
      { id: "catalog-apple", name: "תפוח" },
      { id: "catalog-banana", name: "בננה" },
    ]);

    const result = await translateShoppingItemNames(items, "he", fetchMock);

    const [calledIds] = (fetchMock as jest.Mock).mock.calls[0] as [
      string[],
      string,
    ];
    expect(calledIds).toHaveLength(2);
    expect(calledIds).toContain("catalog-apple");
    expect(calledIds).toContain("catalog-banana");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result[0].name).toBe("תפוח");
    expect(result[1].name).toBe("תפוח");
    expect(result[2].name).toBe("בננה");
  });

  it("keeps the original name when the API response omits the catalogItemId", async () => {
    const item = makeItem({
      id: "item-1",
      name: "Apple",
      catalogItemId: "catalog-apple",
    });
    const fetchMock: FetchDisplayNames = jest.fn().mockResolvedValue([]);

    const result = await translateShoppingItemNames([item], "he", fetchMock);

    expect(result[0].name).toBe("Apple");
  });

  it("returns items with original names when fetchDisplayNames throws (graceful degradation)", async () => {
    const item = makeItem({
      id: "item-1",
      name: "Apple",
      catalogItemId: "catalog-apple",
    });
    const fetchMock: FetchDisplayNames = jest
      .fn()
      .mockRejectedValue(new Error("Network error"));

    const result = await translateShoppingItemNames([item], "he", fetchMock);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
  });

  it("preserves all other ShoppingItem fields unchanged after translation", async () => {
    const item = makeItem({
      id: "item-1",
      name: "Apple",
      catalogItemId: "catalog-apple",
      quantity: 3,
      isChecked: true,
      listId: "list-99",
      category: "produce",
    });
    const fetchMock: FetchDisplayNames = jest
      .fn()
      .mockResolvedValue([{ id: "catalog-apple", name: "תפוח" }]);

    const [translated] = await translateShoppingItemNames(
      [item],
      "he",
      fetchMock,
    );

    expect(translated.name).toBe("תפוח");
    expect(translated.id).toBe("item-1");
    expect(translated.quantity).toBe(3);
    expect(translated.isChecked).toBe(true);
    expect(translated.listId).toBe("list-99");
    expect(translated.catalogItemId).toBe("catalog-apple");
  });

  it("does not mutate the original items array", async () => {
    const item = makeItem({
      id: "item-1",
      name: "Apple",
      catalogItemId: "catalog-apple",
    });
    const originalItems = [item];
    const fetchMock: FetchDisplayNames = jest
      .fn()
      .mockResolvedValue([{ id: "catalog-apple", name: "תפוח" }]);

    await translateShoppingItemNames(originalItems, "he", fetchMock);

    expect(originalItems[0].name).toBe("Apple");
  });

  it("reuses cached localized names without refetching on subsequent tab loads", async () => {
    const item = makeItem({
      id: "item-1",
      name: "Apple",
      catalogItemId: "catalog-apple",
    });
    const fetchMock: FetchDisplayNames = jest
      .fn()
      .mockResolvedValue([{ id: "catalog-apple", name: "תפוח" }]);

    await expect(
      translateShoppingItemNames([item], "he", fetchMock),
    ).resolves.toEqual([expect.objectContaining({ name: "תפוח" })]);

    const secondResult = await translateShoppingItemNames(
      [{ ...item, name: "Apple from cache" }],
      "he",
      fetchMock,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(secondResult[0].name).toBe("תפוח");
  });

  it("keeps localized-name cache isolated per language", async () => {
    const item = makeItem({
      id: "item-1",
      name: "Apple",
      catalogItemId: "catalog-apple",
    });
    const fetchMock: FetchDisplayNames = jest
      .fn()
      .mockResolvedValueOnce([{ id: "catalog-apple", name: "תפוח" }])
      .mockResolvedValueOnce([{ id: "catalog-apple", name: "Apple" }]);

    const hebrewResult = await translateShoppingItemNames(
      [item],
      "he",
      fetchMock,
    );
    const englishResult = await translateShoppingItemNames(
      [item],
      "en",
      fetchMock,
    );

    expect(fetchMock).toHaveBeenNthCalledWith(1, ["catalog-apple"], "he");
    expect(fetchMock).toHaveBeenNthCalledWith(2, ["catalog-apple"], "en");
    expect(hebrewResult[0].name).toBe("תפוח");
    expect(englishResult[0].name).toBe("Apple");
  });
});
