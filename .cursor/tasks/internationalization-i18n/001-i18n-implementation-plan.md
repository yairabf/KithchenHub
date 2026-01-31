# Epic: Internationalization (i18n) - Multi-Language Support

**Epic ID:** INTL  
**Created:** 2026-01-30  
**Status:** Planning  
**Priority:** High  
**Target Release:** TBD  
**Estimated Total Effort:** 101-176 hours (first language) + 35-63 hours per additional language

---

## 📋 Executive Summary

This epic introduces comprehensive multi-language support to Kitchen Hub, enabling the app to serve international markets. The implementation covers:
- UI translations across all screens and components
- Grocery item database translations (9,814+ items)
- Category and search localization
- Dynamic content formatting (dates, numbers, currencies)
- Backend API localization
- Right-to-Left (RTL) language support

### Business Value
- **Market Expansion**: Access to non-English speaking markets
- **User Experience**: Native language support increases adoption
- **Competitive Advantage**: Most household apps lack robust i18n
- **Scalability**: Infrastructure for unlimited language additions

---

## 🎯 Goals & Objectives

### Primary Goals
1. ✅ Support multiple languages seamlessly
2. ✅ Translate all user-facing text (UI + data)
3. ✅ Enable easy addition of new languages
4. ✅ Maintain app performance (no degradation)
5. ✅ Support RTL languages (Hebrew, Arabic)

### Non-Goals (Out of Scope)
- ❌ Automatic language detection based on GPS/IP
- ❌ Machine learning-based translation
- ❌ User-contributed translations (v1)
- ❌ Voice-to-text in multiple languages
- ❌ Region-specific units conversion (lb/kg) - future enhancement

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: `react-i18next` + `i18next`
- **Translation Management**: JSON files (future: Lokalise/Crowdin)
- **Translation API**: DeepL API for initial translations
- **Storage**: AsyncStorage for language preference
- **Backend**: `i18next` for NestJS

### Data Model

#### Translation File Structure
```
mobile/src/i18n/
├── index.ts                     # i18n configuration
├── locales/
│   ├── en/
│   │   ├── common.json          # Common UI text
│   │   ├── shopping.json        # Shopping feature
│   │   ├── recipes.json         # Recipes feature
│   │   ├── chores.json          # Chores feature
│   │   ├── auth.json            # Authentication
│   │   ├── settings.json        # Settings
│   │   ├── dashboard.json       # Dashboard
│   │   ├── errors.json          # Error messages
│   │   └── validation.json      # Form validation
│   ├── es/                      # Spanish
│   ├── fr/                      # French
│   ├── he/                      # Hebrew (RTL)
│   └── ar/                      # Arabic (RTL)
└── types.ts                     # TypeScript definitions
```

#### Grocery Database Schema (Updated)
```typescript
// Current (single language)
interface GroceryItem {
  id: string;
  name: string;              // "Banana"
  category: string;          // "Fruits"
  image: string;
  defaultQuantity: number;
}

// New (multi-language)
interface GroceryItem {
  id: string;
  translations: {
    [locale: string]: {
      name: string;          // en: "Banana", es: "Plátano"
      category: string;      // en: "Fruits", es: "Frutas"
      searchTerms?: string[]; // ["platano", "banana"]
    };
  };
  image: string;
  defaultQuantity: number;
  defaultLocale: 'en';       // Fallback language
}
```

---

## 📦 Epic Breakdown - Tasks

### Phase 1: Foundation & Setup (15-20 hours)

#### Task 1.1: i18n Library Setup & Configuration
**Jira ID:** INTL-1  
**Effort:** 4 hours  
**Priority:** Critical

**Description:**  
Install and configure i18next and react-i18next libraries with proper TypeScript support.

**Acceptance Criteria:**
- [ ] `i18next`, `react-i18next`, `i18next-browser-languagedetector` installed
- [ ] i18n configuration file created with language detection
- [ ] Default language set to English (`en`)
- [ ] Language persistence to AsyncStorage working
- [ ] TypeScript types for translations defined
- [ ] `useTranslation()` hook available throughout app

**Implementation Details:**
```typescript
// mobile/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@kitchen_hub_language';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { /* translations */ },
      es: { /* translations */ },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
```

**Dependencies:** None  
**Blocked By:** None  
**Testing:** Manual + Unit tests

---

#### Task 1.2: Translation Key Structure Design
**Jira ID:** INTL-2  
**Effort:** 3 hours  
**Priority:** Critical

**Description:**  
Design a scalable, maintainable translation key naming convention.

**Acceptance Criteria:**
- [ ] Key naming convention documented
- [ ] Namespace strategy defined (per feature)
- [ ] JSON file structure created
- [ ] Example translations for all patterns
- [ ] TypeScript types for keys generated

**Key Naming Convention:**
```
Format: feature.component.element.context

Examples:
- shopping.listPanel.title → "Shopping Lists"
- shopping.listPanel.emptyState → "No items yet"
- shopping.actions.addItem → "Add Item"
- common.buttons.save → "Save"
- common.buttons.cancel → "Cancel"
- errors.network.offline → "You're offline"
```

**Dependencies:** INTL-1  
**Blocked By:** None  
**Testing:** Documentation review

---

#### Task 1.3: Language Selector Component
**Jira ID:** INTL-3  
**Effort:** 5 hours  
**Priority:** High

**Description:**  
Create a language selection UI in Settings screen.

**Acceptance Criteria:**
- [ ] Language selector added to SettingsScreen
- [ ] Shows current language
- [ ] Lists all available languages with native names
- [ ] Changes language on selection
- [ ] Persists preference to AsyncStorage
- [ ] Reloads app/context after language change
- [ ] Shows language flags/icons

**UI Mockup:**
```
Settings > Language
┌─────────────────────────┐
│ Language                │
│ ┌─────────────────────┐ │
│ │ 🇺🇸 English      ✓  │ │
│ │ 🇪🇸 Español         │ │
│ │ 🇫🇷 Français        │ │
│ │ 🇮🇱 עברית           │ │
│ │ 🇸🇦 العربية        │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Manual + Integration tests

---

#### Task 1.4: RTL Layout Support
**Jira ID:** INTL-4  
**Effort:** 6 hours  
**Priority:** High

**Description:**  
Implement Right-to-Left layout support for Hebrew and Arabic.

**Acceptance Criteria:**
- [ ] Detect RTL languages (he, ar)
- [ ] Apply RTL transformations to layouts
- [ ] Icons flip correctly (back/forward arrows)
- [ ] Text alignment respects RTL
- [ ] Navigation flows RTL
- [ ] Test on actual RTL devices

**Implementation:**
```typescript
import { I18nManager } from 'react-native';

// Detect RTL
const isRTL = ['he', 'ar'].includes(currentLanguage);

// Apply RTL
if (isRTL !== I18nManager.isRTL) {
  I18nManager.forceRTL(isRTL);
  // Reload app
}
```

**Dependencies:** INTL-1, INTL-3  
**Blocked By:** None  
**Testing:** Manual on Hebrew/Arabic

---

### Phase 2: UI Text Extraction & Translation (40-65 hours)

#### Task 2.1: Extract Auth Screen Strings
**Jira ID:** INTL-5  
**Effort:** 4 hours  
**Priority:** High

**Description:**  
Extract and translate all text from authentication screens.

**Files:**
- `mobile/src/features/auth/screens/LoginScreen.tsx`
- `mobile/src/features/auth/components/GoogleSignInButton/`
- `mobile/src/features/auth/components/GuestDataImportModal/`

**Strings to Extract:**
```typescript
// Before
<Text>Kitchen Hub</Text>
<Text>Your family's kitchen assistant</Text>
<Button>Sign In with Google</Button>

// After
<Text>{t('auth.appName')}</Text>
<Text>{t('auth.tagline')}</Text>
<Button>{t('auth.signInGoogle')}</Button>
```

**Acceptance Criteria:**
- [ ] All hardcoded strings replaced with `t()` calls
- [ ] Keys added to `locales/en/auth.json`
- [ ] Translation keys documented
- [ ] No English text hardcoded
- [ ] Screen tested in multiple languages

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Visual QA in 2+ languages

---

#### Task 2.2: Extract Dashboard Screen Strings
**Jira ID:** INTL-6  
**Effort:** 6 hours  
**Priority:** High

**Description:**  
Extract and translate Dashboard screen text.

**Files:**
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`

**Key Challenges:**
- Dynamic time/date formatting
- Chore status translations
- User role translations

**Acceptance Criteria:**
- [ ] All strings extracted to `locales/en/dashboard.json`
- [ ] Dynamic dates use i18n date formatting
- [ ] Status badges use translated text
- [ ] Greeting messages localized
- [ ] Quick stats translations
- [ ] Tested with date/time in different locales

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Visual QA + Date formatting tests

---

#### Task 2.3: Extract Shopping Screen Strings
**Jira ID:** INTL-7  
**Effort:** 8 hours  
**Priority:** High

**Description:**  
Extract and translate Shopping Lists screen text.

**Files:**
- `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
- `mobile/src/features/shopping/components/ShoppingListPanel/`
- `mobile/src/features/shopping/components/GrocerySearchBar/`
- `mobile/src/features/shopping/components/CategoryModal/`
- `mobile/src/features/shopping/components/AllItemsModal/`

**Acceptance Criteria:**
- [ ] Screen headers/titles translated
- [ ] Modal titles/content translated
- [ ] Button labels translated
- [ ] Placeholder text translated
- [ ] Empty states translated
- [ ] Quantity labels translated
- [ ] All strings in `locales/en/shopping.json`

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Full shopping flow in 2+ languages

---

#### Task 2.4: Extract Recipes Screen Strings
**Jira ID:** INTL-8  
**Effort:** 8 hours  
**Priority:** High

**Description:**  
Extract and translate Recipes screen text.

**Files:**
- `mobile/src/features/recipes/screens/RecipesScreen.tsx`
- `mobile/src/features/recipes/screens/RecipeDetailScreen.tsx`
- `mobile/src/features/recipes/components/AddRecipeModal/`
- `mobile/src/features/recipes/components/RecipeCard/`

**Acceptance Criteria:**
- [ ] Recipe screen UI translated
- [ ] Recipe detail screen translated
- [ ] Add recipe modal translated
- [ ] Cooking time units translated
- [ ] Servings labels translated
- [ ] Instructions labels translated
- [ ] All strings in `locales/en/recipes.json`

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Recipe creation/view flow in 2+ languages

---

#### Task 2.5: Extract Chores Screen Strings
**Jira ID:** INTL-9  
**Effort:** 6 hours  
**Priority:** High

**Description:**  
Extract and translate Chores screen text.

**Files:**
- `mobile/src/features/chores/screens/ChoresScreen.tsx`
- `mobile/src/features/chores/components/ChoresQuickActionModal/`
- `mobile/src/features/chores/components/ChoreDetailsModal/`

**Acceptance Criteria:**
- [ ] Chores list UI translated
- [ ] Chore details modal translated
- [ ] Status labels translated (Pending, Done, Overdue)
- [ ] Due date formatting localized
- [ ] Assignee labels translated
- [ ] All strings in `locales/en/chores.json`

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Chore management flow in 2+ languages

---

#### Task 2.6: Extract Settings Screen Strings
**Jira ID:** INTL-10  
**Effort:** 4 hours  
**Priority:** High

**Description:**  
Extract and translate Settings screen text.

**Files:**
- `mobile/src/features/settings/screens/SettingsScreen.tsx`
- `mobile/src/features/settings/components/ManageHouseholdModal/`
- `mobile/src/features/settings/components/ImportDataModal/`

**Acceptance Criteria:**
- [ ] Settings options translated
- [ ] Household management translated
- [ ] Import data modal translated
- [ ] Account section translated
- [ ] All strings in `locales/en/settings.json`

**Dependencies:** INTL-1, INTL-2, INTL-3  
**Blocked By:** None  
**Testing:** Settings navigation in 2+ languages

---

#### Task 2.7: Extract Common Component Strings
**Jira ID:** INTL-11  
**Effort:** 6 hours  
**Priority:** High

**Description:**  
Extract shared component text.

**Files:**
- `mobile/src/common/components/ScreenHeader/`
- `mobile/src/common/components/CenteredModal/`
- `mobile/src/common/components/OfflineBanner/`
- `mobile/src/common/components/Toast/`
- `mobile/src/common/components/DateTimePicker/`
- `mobile/src/navigation/MainTabsScreen.tsx`

**Acceptance Criteria:**
- [ ] Tab labels translated
- [ ] Common buttons (Save, Cancel, Delete) translated
- [ ] Offline messages translated
- [ ] Toast notifications translated
- [ ] Date/time picker labels translated
- [ ] All strings in `locales/en/common.json`

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Navigate all screens in 2+ languages

---

#### Task 2.8: Extract Error & Validation Messages
**Jira ID:** INTL-12  
**Effort:** 4 hours  
**Priority:** Medium

**Description:**  
Extract all error messages and form validations.

**Files:**
- All `try/catch` blocks with error messages
- Form validation logic
- API error responses

**Acceptance Criteria:**
- [ ] All error messages use translation keys
- [ ] Form validation messages translated
- [ ] Network error messages translated
- [ ] All strings in `locales/en/errors.json` and `validation.json`

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Error scenario testing in 2+ languages

---

### Phase 3: Grocery Database Translation (25-50 hours)

#### Task 3.1: Database Schema Migration
**Jira ID:** INTL-13  
**Effort:** 8 hours  
**Priority:** Critical

**Description:**  
Migrate grocery database to support multi-language structure.

**Acceptance Criteria:**
- [ ] New schema designed with `translations` object
- [ ] Migration script created for existing data
- [ ] TypeScript types updated
- [ ] Backward compatibility maintained during migration
- [ ] All 9,814 items migrated successfully
- [ ] Validation script confirms data integrity

**Migration Script:**
```typescript
// scripts/migrate-grocery-db-i18n.ts
function migrateToI18n(items: OldGroceryItem[]): NewGroceryItem[] {
  return items.map(item => ({
    id: item.id,
    translations: {
      en: {
        name: item.name,
        category: item.category,
      }
    },
    image: item.image,
    defaultQuantity: item.defaultQuantity,
    defaultLocale: 'en',
  }));
}
```

**Dependencies:** INTL-2  
**Blocked By:** None  
**Testing:** Unit tests + Manual verification

---

#### Task 3.2: Translate Top 500 Items (Manual Review)
**Jira ID:** INTL-14  
**Effort:** 12 hours (per language)  
**Priority:** High

**Description:**  
Professionally translate the top 500 most-used grocery items.

**Process:**
1. Identify top 500 items by usage frequency
2. Use DeepL API for initial translation
3. Manual review by native speaker
4. Add search terms/synonyms
5. Validate translations with food experts

**Acceptance Criteria:**
- [ ] Top 500 items identified
- [ ] Initial DeepL translations generated
- [ ] Native speaker review completed
- [ ] Search terms added (synonyms, common misspellings)
- [ ] Quality assurance by second reviewer
- [ ] Items updated in database

**Example Output:**
```json
{
  "id": "g1",
  "translations": {
    "en": {
      "name": "Banana",
      "category": "Fruits",
      "searchTerms": ["banana", "bananas", "yellow fruit"]
    },
    "es": {
      "name": "Plátano",
      "category": "Frutas",
      "searchTerms": ["platano", "banana", "banano", "guineo"]
    }
  }
}
```

**Dependencies:** INTL-13  
**Blocked By:** None  
**Testing:** Search testing in target language

---

#### Task 3.3: Batch Translate Remaining Items
**Jira ID:** INTL-15  
**Effort:** 8 hours (per language)  
**Priority:** Medium

**Description:**  
Use DeepL API to batch translate remaining ~9,300 items.

**Acceptance Criteria:**
- [ ] DeepL API integration script created
- [ ] Rate limiting implemented (avoid API throttling)
- [ ] Translation progress tracking
- [ ] Error handling for failed translations
- [ ] Retry mechanism for failures
- [ ] Quality spot-check on random 100 items
- [ ] All items have translations

**Script:**
```typescript
// scripts/batch-translate-items.ts
async function batchTranslate(
  items: GroceryItem[],
  sourceLang: 'en',
  targetLang: string
) {
  const batchSize = 50; // DeepL API limit
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const translations = await translateBatch(batch, targetLang);
    await saveTranslations(translations);
    await sleep(1000); // Rate limiting
  }
}
```

**Dependencies:** INTL-14  
**Blocked By:** None  
**Testing:** Spot-check translations + Search tests

---

#### Task 3.4: Translate Categories
**Jira ID:** INTL-16  
**Effort:** 2 hours (per language)  
**Priority:** High

**Description:**  
Translate all grocery categories and maintain category icons.

**Categories to Translate:**
- Fruits, Vegetables, Dairy, Meat, Seafood
- Bakery, Grains, Snacks, Nuts, Beverages
- Teas, Oils, Baking, Canned, Spreads
- Freezer, Sweets, Dips, Condiments

**Acceptance Criteria:**
- [ ] All categories translated professionally
- [ ] Category icons remain consistent
- [ ] Category order respects locale conventions
- [ ] Category filters work in all languages
- [ ] UI renders category names correctly

**Dependencies:** INTL-13  
**Blocked By:** None  
**Testing:** Category filtering in each language

---

#### Task 3.5: Update Search Logic for Multi-Language
**Jira ID:** INTL-17  
**Effort:** 8 hours  
**Priority:** Critical

**Description:**  
Update search/filter logic to work with translated items.

**Challenges:**
- Search in current language only vs all languages
- Handle diacritics (café vs cafe)
- Fuzzy matching
- Performance with 9,814 items
- Search terms/synonyms

**Acceptance Criteria:**
- [ ] Search uses current language translations
- [ ] Diacritic-insensitive search (optional toggle)
- [ ] Search terms/synonyms supported
- [ ] Performance <100ms for search
- [ ] Autocomplete works correctly
- [ ] Category filtering respects language

**Implementation:**
```typescript
function searchItems(query: string, items: GroceryItem[], locale: string) {
  const normalizedQuery = normalizeText(query); // Remove diacritics
  
  return items.filter(item => {
    const translation = item.translations[locale];
    if (!translation) return false;
    
    const normalizedName = normalizeText(translation.name);
    const normalizedCategory = normalizeText(translation.category);
    
    // Check name, category, search terms
    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedCategory.includes(normalizedQuery) ||
      translation.searchTerms?.some(term => 
        normalizeText(term).includes(normalizedQuery)
      )
    );
  });
}
```

**Dependencies:** INTL-13, INTL-14, INTL-15  
**Blocked By:** None  
**Testing:** Search performance tests + Accuracy tests

---

### Phase 4: Dynamic Content Formatting (8-12 hours)

#### Task 4.1: Date & Time Formatting
**Jira ID:** INTL-18  
**Effort:** 4 hours  
**Priority:** High

**Description:**  
Implement locale-aware date and time formatting.

**Acceptance Criteria:**
- [ ] Dates format per locale (MM/DD/YYYY vs DD/MM/YYYY)
- [ ] Time format respects 12hr vs 24hr
- [ ] Day/month names translated
- [ ] Relative dates translated ("Today", "Yesterday")
- [ ] Calendar localized
- [ ] Timezone handling correct

**Implementation:**
```typescript
import { format } from 'date-fns';
import { enUS, es, fr, he, ar } from 'date-fns/locale';

const locales = { en: enUS, es, fr, he, ar };

function formatDate(date: Date, locale: string) {
  return format(date, 'PP', { locale: locales[locale] });
}
```

**Dependencies:** INTL-1  
**Blocked By:** None  
**Testing:** Date display tests in all languages

---

#### Task 4.2: Number & Currency Formatting
**Jira ID:** INTL-19  
**Effort:** 3 hours  
**Priority:** Medium

**Description:**  
Implement locale-aware number formatting (thousands separators, decimals).

**Acceptance Criteria:**
- [ ] Numbers format per locale (1,000 vs 1.000)
- [ ] Decimal separators correct (, vs .)
- [ ] Currency symbols and positions correct
- [ ] Large numbers formatted (1K, 1M)

**Implementation:**
```typescript
function formatNumber(num: number, locale: string) {
  return new Intl.NumberFormat(locale).format(num);
}

function formatCurrency(amount: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
```

**Dependencies:** INTL-1  
**Blocked By:** None  
**Testing:** Number display tests

---

#### Task 4.3: Pluralization Rules
**Jira ID:** INTL-20  
**Effort:** 3 hours  
**Priority:** Medium

**Description:**  
Handle pluralization rules for different languages.

**Examples:**
- English: "1 item" vs "2 items"
- French: "1 élément" vs "2 éléments"
- Arabic: Complex plural rules (1, 2, 3-10, 11+)

**Acceptance Criteria:**
- [ ] Pluralization rules configured per language
- [ ] Item counts use correct pluralization
- [ ] Recipe servings use correct pluralization
- [ ] Time units pluralized correctly

**Implementation:**
```json
{
  "shopping": {
    "itemCount": "{{count}} item",
    "itemCount_plural": "{{count}} items"
  }
}
```

**Dependencies:** INTL-1, INTL-2  
**Blocked By:** None  
**Testing:** Plural forms in all languages

---

### Phase 5: Backend Localization (8-12 hours)

#### Task 5.1: Backend i18n Setup
**Jira ID:** INTL-21  
**Effort:** 4 hours  
**Priority:** Medium

**Description:**  
Set up i18n in NestJS backend for API responses.

**Acceptance Criteria:**
- [ ] `nestjs-i18n` library installed
- [ ] Translation files structure created
- [ ] Language detection from request headers
- [ ] Default language fallback to English
- [ ] Translation helper available in controllers

**Dependencies:** INTL-1  
**Blocked By:** None  
**Testing:** API response language tests

---

#### Task 5.2: Translate API Error Messages
**Jira ID:** INTL-22  
**Effort:** 4 hours  
**Priority:** Medium

**Description:**  
Translate all API error messages and responses.

**Acceptance Criteria:**
- [ ] All error messages use translation keys
- [ ] Validation error messages translated
- [ ] Success messages translated
- [ ] HTTP exception messages translated
- [ ] Error responses include language

**Dependencies:** INTL-21  
**Blocked By:** None  
**Testing:** API error scenarios in multiple languages

---

#### Task 5.3: Localize Email Templates (Future)
**Jira ID:** INTL-23  
**Effort:** 4 hours  
**Priority:** Low

**Description:**  
Translate email templates (if any exist).

**Acceptance Criteria:**
- [ ] Email templates support multiple languages
- [ ] User language preference respected
- [ ] Subject lines translated
- [ ] Email body translated
- [ ] Call-to-action buttons translated

**Dependencies:** INTL-21  
**Blocked By:** None  
**Testing:** Email delivery tests

---

### Phase 6: Testing & Quality Assurance (12-18 hours)

#### Task 6.1: Automated i18n Tests
**Jira ID:** INTL-24  
**Effort:** 6 hours  
**Priority:** High

**Description:**  
Create automated tests for i18n functionality.

**Test Coverage:**
- [ ] Language switching works
- [ ] Missing translation keys detected
- [ ] Fallback language works
- [ ] RTL layouts correct
- [ ] Search in multiple languages
- [ ] Date/time formatting
- [ ] Number formatting

**Dependencies:** All Phase 1-5 tasks  
**Blocked By:** None  
**Testing:** Run test suite

---

#### Task 6.2: Translation Completeness Check
**Jira ID:** INTL-25  
**Effort:** 3 hours  
**Priority:** High

**Description:**  
Ensure all translation keys exist in all languages.

**Acceptance Criteria:**
- [ ] Script validates all keys present
- [ ] Missing translations reported
- [ ] Unused keys identified
- [ ] CI/CD integration for checks

**Script:**
```typescript
// scripts/check-translations.ts
function validateTranslations() {
  const languages = ['en', 'es', 'fr', 'he', 'ar'];
  const baseKeys = getKeysFromLanguage('en');
  
  languages.forEach(lang => {
    const keys = getKeysFromLanguage(lang);
    const missing = baseKeys.filter(k => !keys.includes(k));
    if (missing.length > 0) {
      console.error(`${lang}: Missing ${missing.length} keys`);
    }
  });
}
```

**Dependencies:** All translation tasks  
**Blocked By:** None  
**Testing:** Run validation script

---

#### Task 6.3: Visual QA in All Languages
**Jira ID:** INTL-26  
**Effort:** 8 hours  
**Priority:** High

**Description:**  
Manual testing of all screens in all supported languages.

**Test Scenarios:**
- [ ] All screens render correctly
- [ ] No text overflow issues
- [ ] Buttons readable
- [ ] RTL layouts correct
- [ ] Images/icons aligned
- [ ] No broken translations
- [ ] Search works
- [ ] Forms work

**Testing Matrix:**
```
Screen × Language Grid:
- Login Screen: EN, ES, FR, HE, AR
- Dashboard: EN, ES, FR, HE, AR
- Shopping: EN, ES, FR, HE, AR
- Recipes: EN, ES, FR, HE, AR
- Chores: EN, ES, FR, HE, AR
- Settings: EN, ES, FR, HE, AR
```

**Dependencies:** All translation tasks  
**Blocked By:** None  
**Testing:** Manual QA + Screenshots

---

### Phase 7: Optimization & Deployment (8-12 hours)

#### Task 7.1: Bundle Size Optimization
**Jira ID:** INTL-27  
**Effort:** 4 hours  
**Priority:** Medium

**Description:**  
Optimize app bundle size with translations.

**Strategies:**
- Lazy load translation files
- Only bundle selected language
- Download additional languages on-demand
- Compress translation JSON files

**Acceptance Criteria:**
- [ ] App size increase <5MB with all translations
- [ ] Only active language loaded initially
- [ ] Additional languages downloadable
- [ ] Translation updates don't require app update

**Dependencies:** All translation tasks  
**Blocked By:** None  
**Testing:** Bundle size analysis

---

#### Task 7.2: Performance Benchmarking
**Jira ID:** INTL-28  
**Effort:** 3 hours  
**Priority:** Medium

**Description:**  
Ensure i18n doesn't degrade app performance.

**Metrics:**
- Screen render time
- Search performance
- Language switching speed
- Memory usage

**Acceptance Criteria:**
- [ ] No render time regression >50ms
- [ ] Search remains <100ms
- [ ] Language switch <500ms
- [ ] Memory usage increase <10MB

**Dependencies:** All implementation tasks  
**Blocked By:** None  
**Testing:** Performance profiling

---

#### Task 7.3: Documentation & Training
**Jira ID:** INTL-29  
**Effort:** 4 hours  
**Priority:** Medium

**Description:**  
Document i18n implementation for team.

**Deliverables:**
- [ ] Developer guide for adding translations
- [ ] Guide for adding new languages
- [ ] Translation key conventions
- [ ] Troubleshooting guide
- [ ] API documentation updated

**Dependencies:** All tasks  
**Blocked By:** None  
**Testing:** Documentation review

---

## 🎯 Launch Criteria

### Phase 1 Launch (English + 1 Language)
- [ ] All UI text translated
- [ ] Top 500 grocery items translated
- [ ] Language selector working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Visual QA passed

### Full Launch (English + 4 Languages)
- [ ] All languages complete
- [ ] All 9,814 items translated
- [ ] RTL fully tested
- [ ] All automated tests passing
- [ ] Native speaker review completed
- [ ] User acceptance testing passed

---

## 📊 Success Metrics

### Technical Metrics
- ✅ Translation coverage: 100%
- ✅ Search accuracy: >95%
- ✅ Performance degradation: <5%
- ✅ Bundle size increase: <5MB
- ✅ Translation completeness: 100%

### Business Metrics
- 📈 International user acquisition +30%
- 📈 User engagement in non-English markets +40%
- 📈 App Store ratings in international markets >4.5
- 📈 Reduced churn in international markets -20%

---

## 🚧 Risks & Mitigation

### Risk 1: Translation Quality
**Impact:** High  
**Probability:** Medium  
**Mitigation:**
- Use professional review for top 500 items
- Native speaker validation
- User feedback mechanism
- Continuous improvement process

### Risk 2: Search Performance
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Benchmark early
- Optimize search algorithm
- Use search indices
- Implement caching

### Risk 3: Bundle Size Explosion
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Lazy load translations
- Compress JSON files
- Only bundle active language
- Monitor bundle size in CI

### Risk 4: RTL Layout Issues
**Impact:** Medium  
**Probability:** High  
**Mitigation:**
- Test early and often
- Use RTL-aware components
- Manual QA on RTL languages
- Beta testing with RTL users

### Risk 5: Incomplete Translations
**Impact:** High  
**Probability:** Low  
**Mitigation:**
- Automated completeness checks
- CI/CD validation
- Fallback to English
- Translation management system

---

## 📅 Estimated Timeline

### Fast Track (1 Language)
- **Phase 1**: 2 weeks
- **Phase 2**: 4 weeks
- **Phase 3**: 3 weeks
- **Phase 4**: 1 week
- **Phase 5**: 1 week
- **Phase 6**: 1.5 weeks
- **Phase 7**: 1 week
- **Total**: ~13.5 weeks (3.5 months)

### Full Implementation (5 Languages)
- **Phase 1**: 2 weeks
- **Phase 2**: 5 weeks
- **Phase 3**: 6 weeks (parallel translation)
- **Phase 4**: 1 week
- **Phase 5**: 1.5 weeks
- **Phase 6**: 2.5 weeks
- **Phase 7**: 1.5 weeks
- **Total**: ~19.5 weeks (5 months)

---

## 💰 Cost Estimate

### Development Costs (Internal)
- Phase 1-7: 101-176 hours @ $100/hr = $10,100-$17,600

### Translation Costs (External)
- Professional translation (top 500 items × 4 languages):
  - $0.15/word × 500 items × 3 words avg × 4 languages = ~$900
- Machine translation (9,314 items × 4 languages):
  - DeepL API: $50/language = $200
- Native speaker review:
  - $50/hr × 8 hours/language × 4 = $1,600

### Total Per Language
- First language: $10,100-$17,600 (dev only, English exists)
- Each additional: $700-$1,200 (translation + review)

### Grand Total (5 Languages)
- Development: $10,100-$17,600
- Translations: $2,800-$4,800
- **Total: $12,900-$22,400**

---

## 🎬 Next Steps

1. **Review & Approval**: Stakeholder review of this plan
2. **Prioritize Languages**: Decide which languages to support first
3. **Create Jira Tickets**: Import tasks into Jira with proper epics
4. **Allocate Resources**: Assign developers and translators
5. **Set Timeline**: Commit to sprint schedule
6. **Kick Off**: Start with Phase 1 (Foundation)

---

## 📚 References

### Documentation
- [react-i18next docs](https://react.i18next.com/)
- [i18next docs](https://www.i18next.com/)
- [DeepL API docs](https://www.deepl.com/docs-api)
- [React Native i18n guide](https://reactnative.dev/docs/internationalization)

### Related Epics
- None (new epic)

### External Dependencies
- DeepL API account
- Native speakers for review
- Translation management system (optional: Lokalise/Crowdin)

---

**Status:** ✅ Plan Complete - Ready for Review and Jira Import

---

## Appendix A: Translation Key Examples

### Common Keys
```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "remove": "Remove",
      "share": "Share",
      "close": "Close"
    },
    "labels": {
      "name": "Name",
      "quantity": "Quantity",
      "category": "Category",
      "date": "Date",
      "time": "Time"
    },
    "messages": {
      "loading": "Loading...",
      "saving": "Saving...",
      "success": "Success!",
      "error": "Error occurred"
    }
  }
}
```

### Shopping Keys
```json
{
  "shopping": {
    "title": "Shopping Lists",
    "addToList": "Add to {{listName}}",
    "itemCount": "{{count}} item",
    "itemCount_plural": "{{count}} items",
    "emptyList": "No items yet. Start adding!",
    "search": {
      "placeholder": "Search groceries...",
      "noResults": "No items found",
      "addCustom": "Add custom item"
    },
    "actions": {
      "createList": "Create New List",
      "deleteList": "Delete List",
      "shareList": "Share List",
      "quickAdd": "Quick Add"
    }
  }
}
```

---

## Appendix B: Supported Languages (Initial)

| Language | Code | Native Name | Direction | Priority |
|----------|------|-------------|-----------|----------|
| English | en | English | LTR | P0 (Default) |
| Spanish | es | Español | LTR | P1 |
| French | fr | Français | LTR | P2 |
| Hebrew | he | עברית | RTL | P2 |
| Arabic | ar | العربية | RTL | P3 |

**Future Candidates:**
- German (de), Italian (it), Portuguese (pt), Chinese (zh), Japanese (ja), Korean (ko)

---

## Appendix C: Jira Import Template

### Epic Structure
```
Epic: Internationalization (i18n)
├── Story: Foundation & Setup
│   ├── INTL-1: i18n Library Setup
│   ├── INTL-2: Translation Key Structure
│   ├── INTL-3: Language Selector
│   └── INTL-4: RTL Layout Support
├── Story: UI Text Extraction
│   ├── INTL-5: Auth Screens
│   ├── INTL-6: Dashboard
│   ├── INTL-7: Shopping
│   ├── INTL-8: Recipes
│   ├── INTL-9: Chores
│   ├── INTL-10: Settings
│   ├── INTL-11: Common Components
│   └── INTL-12: Errors & Validation
├── Story: Grocery Database
│   ├── INTL-13: Schema Migration
│   ├── INTL-14: Top 500 Items
│   ├── INTL-15: Batch Translation
│   ├── INTL-16: Categories
│   └── INTL-17: Search Logic
├── Story: Dynamic Content
│   ├── INTL-18: Date/Time Formatting
│   ├── INTL-19: Numbers/Currency
│   └── INTL-20: Pluralization
├── Story: Backend
│   ├── INTL-21: Backend Setup
│   ├── INTL-22: API Errors
│   └── INTL-23: Email Templates
├── Story: Testing & QA
│   ├── INTL-24: Automated Tests
│   ├── INTL-25: Completeness Check
│   └── INTL-26: Visual QA
└── Story: Optimization
    ├── INTL-27: Bundle Size
    ├── INTL-28: Performance
    └── INTL-29: Documentation
```

Each ticket should include:
- Description from this plan
- Acceptance criteria
- Dependencies
- Estimated hours
- Priority
- Labels: `i18n`, `internationalization`, `translations`
