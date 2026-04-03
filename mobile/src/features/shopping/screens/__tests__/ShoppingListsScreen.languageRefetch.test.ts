/**
 * ShoppingListsScreen — Language-change category re-fetch guard tests.
 *
 * These tests cover the guard logic inside the language-change useEffect that
 * decides whether to re-fetch category items and whether to show a loading spinner.
 *
 * The guard rules are:
 *   1. No re-fetch when the language has not changed.
 *   2. No re-fetch when no category has been selected (modal was never opened).
 *   3. Always re-fetch when language changes and a category is selected — even if
 *      the modal is currently closed (fixes the i18n fallback-language race).
 *   4. Show loading spinner only when the modal is already visible; update silently
 *      when the modal is closed to avoid a flash on next open.
 */

/**
 * Mirrors the guard logic from the language-change useEffect in ShoppingListsScreen.
 * Returns what side-effects should be triggered.
 */
function evaluateLanguageChangeGuard(params: {
  hasLanguageChanged: boolean;
  selectedCategory: string;
  showCategoryModal: boolean;
}): { shouldRefetch: boolean; shouldShowLoading: boolean } {
  const { hasLanguageChanged, selectedCategory, showCategoryModal } = params;

  if (!hasLanguageChanged) {
    return { shouldRefetch: false, shouldShowLoading: false };
  }

  if (!selectedCategory) {
    return { shouldRefetch: false, shouldShowLoading: false };
  }

  return {
    shouldRefetch: true,
    shouldShowLoading: showCategoryModal,
  };
}

describe('ShoppingListsScreen - language change re-fetch guard', () => {
  describe.each([
    // [description, hasLanguageChanged, selectedCategory, showCategoryModal, shouldRefetch, shouldShowLoading]
    ['language unchanged, modal open, category selected', false, 'fruits', true, false, false],
    ['language unchanged, modal closed, category selected', false, 'fruits', false, false, false],
    ['language changed, no category, modal closed', true, '', false, false, false],
    ['language changed, no category, modal open', true, '', true, false, false],
    ['language changed, category selected, modal open', true, 'fruits', true, true, true],
    ['language changed, category selected, modal closed', true, 'fruits', false, true, false],
    ['language changed, category selected (ar), modal closed', true, 'dairy', false, true, false],
    ['language changed, category selected (ar), modal open', true, 'dairy', true, true, true],
  ])(
    '%s',
    (_label, hasLanguageChanged, selectedCategory, showCategoryModal, shouldRefetch, shouldShowLoading) => {
      it(`shouldRefetch=${shouldRefetch}, shouldShowLoading=${shouldShowLoading}`, () => {
        const result = evaluateLanguageChangeGuard({
          hasLanguageChanged,
          selectedCategory,
          showCategoryModal,
        });

        expect(result.shouldRefetch).toBe(shouldRefetch);
        expect(result.shouldShowLoading).toBe(shouldShowLoading);
      });
    },
  );
});
