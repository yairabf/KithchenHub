/**
 * Shared i18n mock utility for Jest tests.
 * 
 * Provides reusable translation mocks with common patterns:
 * - Namespace-prefixed keys (e.g., "categories:vegetables")
 * - Parameterized translations (e.g., "itemCount" with count)
 * - Accessibility labels with parameters
 * - Default fallback to key name
 * 
 * @example
 * ```typescript
 * // In test file:
 * jest.mock('react-i18next', () => ({
 *   useTranslation: () => createI18nMock()
 * }));
 * 
 * // With custom overrides:
 * jest.mock('react-i18next', () => ({
 *   useTranslation: () => createI18nMock({
 *     'custom.key': 'Custom translation'
 *   })
 * }));
 * ```
 */

export type TranslationKey = string;
export type TranslationParams = Record<string, unknown>;
export type TranslationOverrides = Record<TranslationKey, string>;

/**
 * Handles category namespace translations.
 * Categories are prefixed with "categories:" in translation keys.
 * 
 * @param key - Translation key (e.g., "categories:vegetables")
 * @returns Capitalized category name or "Other" for empty
 */
function handleCategoryTranslation(key: string): string {
  const value = key.replace('categories:', '');
  if (!value) return 'Other';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Handles parameterized item count translations.
 * Supports singular/plural forms based on count.
 * 
 * @param options - Translation parameters with count
 * @returns Formatted count string (e.g., "3 items", "1 item")
 */
function handleItemCountTranslation(options?: TranslationParams): string {
  const count = Number(options?.count ?? 0);
  return `${count} ${count === 1 ? 'item' : 'items'}`;
}

/**
 * Handles category accessibility label translations.
 * Combines category name and item count for screen readers.
 * 
 * @param options - Translation parameters with category and count
 * @returns Accessibility label string
 */
function handleCategoryAccessibilityLabel(options?: TranslationParams): string {
  return `${options?.category} category, ${options?.count}`;
}

/**
 * Handles templated translations with parameter interpolation.
 * Supports both i18next-style `{{param}}` and legacy `{param}` placeholders.
 *
 * @param template - Translation template string
 * @param options - Parameters to interpolate
 * @returns Interpolated string
 *
 * @example
 * ```typescript
 * interpolateTemplate("Hello {{name}}", { name: "World" })
 * // Returns: "Hello World"
 * ```
 */
function interpolateTemplate(template: string, options?: TranslationParams): string {
  if (!options) return template;

  return Object.entries(options).reduce((result, [key, value]) => {
    const replacement = String(value ?? '');
    // Support both i18next {{key}} and legacy {key} syntax
    return result
      .replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), replacement)
      .replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);
  }, template);
}

/**
 * Default translation labels for common keys.
 * Organized by feature namespace for easy maintenance.
 */
const DEFAULT_TRANSLATIONS: Record<TranslationKey, string> = {
  // Shopping list panel
  'listPanel.activeListsTitle': 'My Active Lists',
  'listPanel.mainBadge': 'Main',
  'listPanel.createNew': 'Create New',
  'listPanel.emptyTitle': 'No items in this list',
  'listPanel.emptyDescription': 'Start adding items to your shopping list',
  'listPanel.emptyAction': 'Add first item',
  'listPanel.edit': 'Edit',
  'listPanel.delete': 'Delete',
  'listPanel.closeActionsMenu': 'Close list actions menu',
  'listPanel.moreActionsFor': 'More actions for {{name}}',
  'listPanel.mainListCannotDelete': '{{name}} is main list and cannot be deleted',
  'listPanel.editListAccessibility': 'Edit {{name}} list',
  'listPanel.deleteListAccessibility': 'Delete {{name}} list',
  'listPanel.expandCategoryHint': 'Double tap to expand and show items in this category',
  'listPanel.collapseCategoryHint': 'Double tap to collapse and hide items in this category',
  
  // Shopping screen
  'screen.headerTitle': 'Shopping List',
  'screen.shareActionLabel': 'Share shopping list',
  'screen.addActionLabel': 'Add item',
  'screen.quickAddTitle': 'Quick Add',
  'screen.switchToList': 'Switch to {name}',
  'screen.shareTitle': 'Share {name}',
  'screen.deleteListTitle': 'Delete List',
  'screen.deleteListMessage': 'Delete "{name}"?',
  'screen.deleteListConfirm': 'Delete',
  
  // Category modal
  'categoryModal.loadFailed': 'Failed to load category items. Please try again.',
  
  // Common categories
  'categories:other': 'Other',
};

/**
 * Creates a translation function mock with common patterns.
 * Handles namespace prefixes, parameterization, and custom overrides.
 * 
 * @param overrides - Custom translations to override defaults
 * @returns Translation function compatible with react-i18next
 */
export function createTranslationFunction(overrides: TranslationOverrides = {}) {
  return (key: string, options?: TranslationParams): string => {
    // Handle category namespace
    if (key.startsWith('categories:')) {
      return handleCategoryTranslation(key);
    }

    // Handle item count with singular/plural
    if (key === 'itemCount') {
      return handleItemCountTranslation(options);
    }

    // Handle category accessibility label
    if (key === 'listPanel.categoryAccessibilityLabel') {
      return handleCategoryAccessibilityLabel(options);
    }

    // Check custom overrides first
    if (key in overrides) {
      return interpolateTemplate(overrides[key], options);
    }

    // Check default translations
    if (key in DEFAULT_TRANSLATIONS) {
      return interpolateTemplate(DEFAULT_TRANSLATIONS[key], options);
    }

    // Fallback to key name for missing translations
    return key;
  };
}

/**
 * Creates a complete i18n mock for useTranslation hook.
 * Returns an object with `t` function and other i18n methods.
 * 
 * @param overrides - Custom translations to override defaults
 * @returns Mock object compatible with useTranslation return type
 * 
 * @example
 * ```typescript
 * // Basic usage
 * jest.mock('react-i18next', () => ({
 *   useTranslation: () => createI18nMock()
 * }));
 * 
 * // With custom translations
 * jest.mock('react-i18next', () => ({
 *   useTranslation: () => createI18nMock({
 *     'myFeature.title': 'My Custom Title',
 *     'myFeature.description': 'Description for {name}'
 *   })
 * }));
 * ```
 */
export function createI18nMock(overrides: TranslationOverrides = {}) {
  return {
    t: createTranslationFunction(overrides),
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
    ready: true,
  };
}

/**
 * Helper to create a jest mock for react-i18next module.
 * Use this in test setup for consistent mocking.
 * 
 * @param overrides - Custom translations
 * @returns Jest mock configuration object
 * 
 * @example
 * ```typescript
 * jest.mock('react-i18next', createReactI18nextMock());
 * 
 * // Or with overrides:
 * jest.mock('react-i18next', createReactI18nextMock({
 *   'custom.key': 'Custom value'
 * }));
 * ```
 */
export function createReactI18nextMock(overrides: TranslationOverrides = {}) {
  return () => ({
    useTranslation: () => createI18nMock(overrides),
    Trans: ({ children }: { children: React.ReactNode }) => children,
    Translation: ({ children }: { children: (t: (key: string) => string) => React.ReactNode }) =>
      children(createTranslationFunction(overrides)),
  });
}
