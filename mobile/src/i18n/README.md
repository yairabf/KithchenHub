# i18n (Internationalization)

i18next and react-i18next are configured for the React Native app (iOS/Android only). No browser-based language detection is used.

## Init order

i18n is initialized by importing `./src/i18n` at the **earliest executed entrypoint** (`mobile/index.ts`), before any component that uses `useTranslation()` or `t()`. The custom language detector runs asynchronously and sets the initial language before the React tree mounts.

## Detection order

1. **AsyncStorage** – Read stored language from `@kitchen_hub_language`. The value is **normalized** and **validated against `supportedLngs`**. If missing or invalid, it is ignored and the next step runs.
2. **react-native-localize** – Device preferred locale from `getLocales()[0]`. Normalized and mapped to a supported language code.
3. **fallbackLng** – Default `en` when nothing else matches.

## AsyncStorage key

- **Key:** `@kitchen_hub_language`
- **Value:** Language code only (e.g. `en`, `es`, `he`, `ar`). Stored and read by the detector and by `setAppLanguage()`.

## Locale normalization rules

- **Separator:** `en_US` → `en-US` (hyphen); then the **language part** is used for matching (e.g. `en-US` → `en`).
- **Case:** Normalized to lowercase (e.g. `EN-us` → `en`).
- **Hebrew:** Persist and use `he`, not legacy `iw`. Be consistent in stored value and `supportedLngs`.
- **Arabic:** Use `ar`. When RTL is added later, keep codes consistent (`he`, `ar`).

## RTL (separate phase)

RTL is not implemented in this setup. When you add RTL support (e.g. for Hebrew or Arabic), **RTL will require `I18nManager.forceRTL` + app restart** (per i18n epic).

## Usage

- **In components:** `import { useTranslation } from 'react-i18next';` then `const { t } = useTranslation();` and `t('common:appName')` or `t('common.appName')` depending on namespace usage.
- **Change language:** Use `setAppLanguage(locale)` from `./i18n` (persists to AsyncStorage and calls `i18n.changeLanguage`). Do not call `i18n.changeLanguage` directly in app code.
