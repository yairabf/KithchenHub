# Translation Key Structure and Namespaces

This document defines translation key naming conventions, namespaces per feature, placeholder and pluralization rules, and what must not be translated. It is the single source of truth for i18n implementation.

**Plan:** [.cursor/tasks/i18n/define-translation-key-structure-and-namespaces/define-translation-key-structure-and-namespaces_plan.mdc](../../../.cursor/tasks/i18n/define-translation-key-structure-and-namespaces/define-translation-key-structure-and-namespaces_plan.mdc)

---

## 1. Key format: namespace = feature, key = component.element.context

**Source of truth:** The **namespace** is the feature. Keys inside a namespace **do not** repeat the feature.

- **Key path (in docs and in JSON):** `component.element.context` (camelCase segments).
- **Namespace:** Identifies the feature (e.g. `shopping`, `auth`, `common`).

**In code:**

- Prefer: `useTranslation('shopping')` then `t('listPanel.title')` — no redundant namespace in the key.
- When explicit namespace is needed: `t('shopping:listPanel.title')` or `t('errors:network.offline')`.

**In JSON:**

- Keys do **not** include the namespace prefix. Example:

```json
// locales/en/shopping.json
{
  "listPanel": {
    "title": "Shopping Lists",
    "emptyState": "No items yet"
  },
  "search": {
    "placeholder": "Search groceries..."
  }
}
```

**Rule:** Define key path as **component.element.context**; treat **namespace** as the feature. Do not use fully-qualified keys (e.g. `shopping.listPanel.title`) inside namespace files or when the namespace is already set via `useTranslation('shopping')`.

---

## 2. Key structure: depth and grouping

- **Prefer 2–4 segments total;** avoid deeply nested UI-specific trees.
- **Group only by:**
  - Stable UI categories (e.g. `buttons`, `labels`, `messages` in `common`), or
  - Stable components (e.g. `listPanel`, `searchBar`, `loginForm`).

**Examples:**

- ✅ `listPanel.title`, `search.placeholder`, `buttons.save`, `labels.quantity`, `messages.loading`
- ❌ `shopping.listPanel.title` inside `shopping.json` (redundant feature in key)
- ❌ Deep trees like `modals.addRecipe.steps.ingredients.header.title` (prefer flatter: `addRecipe.ingredientsTitle` or similar)

---

## 3. What must NOT be translated

| Content type | Where it lives | Rule |
|--------------|----------------|------|
| **UI strings** | i18n JSON (mobile namespaces) | Translated via `t()`. |
| **Grocery item names / search** | Backend (API / backend translations) | Not in mobile i18n JSON; use backend-localized data. |
| **User-generated content** (list names, recipe names, chore titles) | User data | **Never translated;** only interpolated (e.g. `t('shopping.addToList', { listName: list.name })`). |

This keeps a clear boundary and avoids "should we translate the user's list name?" later.

---

## 4. Namespaces

One namespace per feature/domain. **Dashboard** is included for clarity (epic extraction scope includes Dashboard screen).

| Namespace | Scope | JSON path (en) |
|-----------|--------|----------------|
| **common** | Shared UI: buttons, labels, messages, tabs, app name | `locales/en/common.json` |
| **auth** | Login, guest, Google sign-in, guest import | `locales/en/auth.json` |
| **dashboard** | Dashboard screen, greeting, stats, quick actions | `locales/en/dashboard.json` |
| **shopping** | Lists, panel, search, modals, quick add | `locales/en/shopping.json` |
| **recipes** | Recipe list, detail, add modal, ingredients, steps, time/servings | `locales/en/recipes.json` |
| **chores** | Chores list, modals, status, due date, assignee | `locales/en/chores.json` |
| **settings** | Settings screen, household, import, account | `locales/en/settings.json` |
| **categories** | Grocery category display names (by backend-stable ID) | `locales/en/categories.json` |
| **errors** | Network, auth, generic error messages | `locales/en/errors.json` |
| **validation** | Form validation messages | `locales/en/validation.json` |

**Default namespace:** `common` is `defaultNS` so `t('buttons.save')` resolves to `common:buttons.save` when no namespace is given.

---

## 5. Categories namespace: canonical IDs and fallback

- **Key by backend-stable category IDs** (e.g. `fruits`, `vegetables`, `dairy`), not by local file. Epic specifies backend as source; no reliance on a local grocery DB for canonical IDs.
- **Fallback order:**
  1. `t(categoryId)` in `categories` namespace (e.g. `t('categories:fruits')`).
  2. Backend-provided `displayName` if available.
  3. Humanized `categoryId` as last resort (e.g. `fruits` → "Fruits").

---

## 6. Placeholder and interpolation rules

- **Syntax:** i18next `{{variableName}}` (double curly braces, camelCase).
- **Escape:** `interpolation: { escapeValue: false }` in i18n config (React-safe).
- **Reserved / common variable names (document for consistency):** `count`, `listName`, `name`, `min`, `max`, `field`.

**Two rules that prevent bugs:**

1. **Always include units and punctuation in the translation**, not concatenated in code (e.g. "{{count}} min" in the JSON, not `t('time') + ' ' + count + ' min'` in code).
2. **Never embed React component markup inside translation strings** unless you standardize on `Trans` usage (and document that pattern). Prefer interpolation of plain values.

---

## 7. Pluralization rules

- **Mechanism:** Plural forms use i18next's built-in plural suffixes (e.g. `_plural` for English; locale-dependent suffixes for other languages). Do not manually invent another suffix system.
- **Variable:** Always pass `count` in options; i18next selects the form from key + suffix.
- **English (en):** i18next v21+ uses CLDR suffixes `_one` (singular) and `_other` (plural); legacy `_plural` is also supported. Example: `itemCount_one` / `itemCount_other` (and optionally `itemCount_plural`) with `t('shopping:itemCount', { count: n })`.
- **Other locales:** When adding languages (es, fr, he, ar), use i18next's plural rules for that locale (e.g. Arabic multiple forms). No need to specify ordinal vs cardinal for v1 unless required.

---

## 8. Do / Don't

**Do:**

- ✅ `t('errors:network.offline')` when using a non-default namespace.
- ✅ `t('validation:minLength', { min: 3 })` with interpolation.
- ✅ `useTranslation('shopping')` then `t('listPanel.title')` (no redundant namespace in key).

**Don't:**

- ❌ `t('shopping:listPanel.title')` inside `useTranslation('shopping')` — redundant; choose either namespace in hook or in key.
- ❌ `t('common:buttons.save')` everywhere when `common` is defaultNS — loses the benefit of defaultNS; use `t('buttons.save')` when in default context.

---

## 9. Key lifecycle

- **Never rename keys** without a codemod and full-text search so all references and translation files are updated.
- **Prefer deprecating old keys** (e.g. with a comment in JSON and in docs) for one release if you expect long-lived branches, then remove after codemod.
