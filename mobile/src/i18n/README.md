# i18n (Internationalization)

i18next and react-i18next are configured for the React Native app (iOS/Android and web). Uses expo-localization for cross-platform locale detection.

## Init order

i18n is initialized by importing `./src/i18n` at the **earliest executed entrypoint** (`mobile/index.ts`), before any component that uses `useTranslation()` or `t()`. The custom language detector runs asynchronously and sets the initial language before the React tree mounts.

## Detection order

1. **AsyncStorage** – Read stored language from `@kitchen_hub_language`. The value is **normalized** and **validated against `supportedLngs`**. If missing or invalid, it is ignored and the next step runs.
2. **expo-localization** – Device preferred locale from `getLocales()[0]`. On web, uses browser's navigator.language. Normalized and mapped to a supported language code.
3. **fallbackLng** – Default `en` when nothing else matches.

## AsyncStorage key

- **Key:** `@kitchen_hub_language`
- **Value:** Language code only (e.g. `en`, `es`, `he`, `ar`). Stored and read by the detector and by `setAppLanguage()`.

## Locale normalization rules

- **Separator:** `en_US` → `en-US` (hyphen); then the **language part** is used for matching (e.g. `en-US` → `en`).
- **Case:** Normalized to lowercase (e.g. `EN-us` → `en`).
- **Hebrew:** Persist and use `he`, not legacy `iw`. Be consistent in stored value and `supportedLngs`.
- **Arabic:** Use `ar`. When RTL is added later, keep codes consistent (`he`, `ar`).

## RTL Support

RTL is implemented for Hebrew (he) and Arabic (ar):

- At app bootstrap (`mobile/index.ts`), stored or device language determines RTL state.
- `I18nManager.allowRTL(true)` and `forceRTL(isRTL)` are set before the React tree mounts.
- Switching language to/from he or ar triggers `I18nManager.forceRTL` and app restart via `Updates.reloadAsync()`.
- In dev mode, if reload fails, the user sees an Alert to restart manually.
- Directional icons (chevron-forward, arrow-back, etc.) flip via the `getDirectionalIcon` helper.
- Use `marginStart`/`marginEnd` (not `marginLeft`/`marginRight`) for RTL-safe layouts.

Reference: `.cursor/tasks/i18n/rtl-handling-with-app-restart/` (Task INTL-4).

## Key structure and namespaces

Translation key format, namespaces per feature, placeholder and pluralization rules, and what must not be translated are defined in **[KEY_STRUCTURE.md](./KEY_STRUCTURE.md)**. Use it as the single source of truth when adding or changing keys.

## Usage

- **In components:** `import { useTranslation } from 'react-i18next';` then `const { t } = useTranslation();`. Prefer `useTranslation('shopping')` then `t('listPanel.title')`; or `t('shopping:listPanel.title')` when explicit. For default namespace (common): `t('buttons.save')`.
- **Change language:** Use `setAppLanguage(locale)` from `./i18n` (persists to AsyncStorage and calls `i18n.changeLanguage`). Do not call `i18n.changeLanguage` directly in app code.
