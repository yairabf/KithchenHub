# Senior Staff Engineer Code Review: Catalog Item i18n Scripts

**Status:** ✅ Addressed (shared CSV lib, tests, JSDoc, constants, failure logging + exit code).

**Scope:** Backend scripts for catalog item i18n (Hebrew export/import, auto-translate, seed).  
**Files reviewed:**  
- `backend/scripts/import-catalog-item-i18n-he.ts`  
- `backend/scripts/export-catalog-item-i18n-he-template.ts`  
- `backend/scripts/auto-translate-catalog-item-i18n-he.ts`  
- `backend/scripts/seed-catalog-item-i18n.ts`  

---

## 1. Summary of Overall Code Quality

The scripts are **functionally correct** and achieve the goal: export a CSV template, optionally auto-translate via Google Translate, import Hebrew names into `catalog_item_i18n`, and seed from catalog + aliases. CSV parsing correctly handles quoted fields and escaped quotes.  

**Main gaps:** duplicated CSV/parsing logic across files (violates “centralize common operations”), no shared CSV utility or tests, missing JSDoc/file-level docs, and one correctness edge case in the import script. Overall: **request changes** — refactor shared logic, add docs and tests, then approve.

---

## 2. Detailed Issue List

### Issue 1: **VIOLATION – Duplicated CSV Logic (Centralize Common Operations)**

**Rule violated:** Coding Rule #3 – "Centralize common operations in utilities"

**Explanation:**  
`parseCsv()` and `rowsToObjects()` are copy-pasted in `import-catalog-item-i18n-he.ts` and `auto-translate-catalog-item-i18n-he.ts` (same ~55 lines). `csvEscape()` is duplicated in `export-catalog-item-i18n-he-template.ts` and `auto-translate-catalog-item-i18n-he.ts`. This increases maintenance cost and risk of divergence.

**Relevant code (example – same in both files):**
```typescript
// import-catalog-item-i18n-he.ts lines 35–86
// auto-translate-catalog-item-i18n-he.ts lines 41–92
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentField = '';
  // ... identical logic
  return rows;
}
```

**Recommended fix:**  
- Add a shared module, e.g. `backend/scripts/lib/catalog-i18n-csv.ts`, that exports:
  - `parseCsv(content: string): string[][]`
  - `rowsToCatalogI18nRows(rows: string[][]): CsvRow[]` (with required columns and type)
  - `csvEscape(value: string): string`
  - Type `CsvRow` (or a minimal shape used by both scripts).
- Have both import and auto-translate scripts import from this module and remove their local copies.
- Have export script import `csvEscape` (and optionally a `writeCsvRows` helper) from the same module.

---

### Issue 2: **VIOLATION – No Tests (TDD / Test Coverage)**

**Rule violated:** Coding Rule #9 (parameterized tests), #10 (TDD – tests first)

**Explanation:**  
There are no unit tests for CSV parsing, escaping, or the mapping logic. Parsing and escaping are ideal for parameterized tests; a bug there could corrupt bulk imports or exports.

**Recommended fix:**  
- Add `backend/scripts/lib/__tests__/catalog-i18n-csv.spec.ts` (or similar) with tests for:
  - `parseCsv`: empty input, single row, quoted fields, escaped quotes, commas inside quotes, `\r\n` vs `\n`, trailing newline.
  - `csvEscape`: no special chars, contains `"`, contains `,`, contains newline, empty string.
  - `rowsToCatalogI18nRows` / equivalent: valid headers, missing column throws, row mapping and trimming.
- Use `describe.each` for multiple CSV/escape scenarios per project standards.

**Example (conceptual):**
```typescript
describe.each([
  ['empty', '', []],
  ['quoted field', '"a,b",c', [['a,b', 'c']]],
  ['escaped quote', '"a""b",c', [['a"b', 'c']]],
])('parseCsv %s', (_label, input, expected) => {
  it('returns expected rows', () => {
    expect(parseCsv(input)).toEqual(expected);
  });
});
```

---

### Issue 3: **VIOLATION – Missing JSDoc / File-Level Documentation**

**Rule violated:** Coding Rule #6 – "Document behaviors with language-appropriate comments"

**Explanation:**  
None of the four scripts have a file-level description, and exported/important functions lack JSDoc (purpose, params, return value, notable edge cases).

**Relevant code (example):**
```typescript
// import-catalog-item-i18n-he.ts – no file header, no JSDoc on getFilePath, parseCsv, rowsToObjects, main
function getFilePath(): string {
  const arg = process.argv.find((item) => item.startsWith('--file='));
```

**Recommended fix:**  
- At the top of each script, add a short comment describing: purpose, inputs (env, CLI args, files), outputs/side effects, and typical usage.
- Add JSDoc for all exported or non-trivial functions, e.g.:

```typescript
/**
 * Reads CSV path from --file= CLI arg or default template path.
 * Relative paths are resolved against process.cwd().
 */
function getFilePath(): string {
```

---

### Issue 4: **Correctness – Import Script Default Lang When Empty**

**Explanation:**  
In `import-catalog-item-i18n-he.ts`, when `row.lang` is empty you default to `'he'`:

```typescript
// import-catalog-item-i18n-he.ts lines 132–137
const toUpsert = parsed
  .map((row) => ({
    catalogItemId: row.catalog_item_id.trim(),
    lang: row.lang.trim() || 'he',
    name: row.he_name.trim(),
  }))
```

If the CSV has a typo (e.g. `lang` = `" h e "`), `trim()` is non-empty so you get `" h e "` instead of `'he'`, which can create unexpected rows or violate uniqueness. Not critical for a known template, but worth tightening.

**Recommended fix:**  
- Normalize language: e.g. `const lang = (row.lang.trim() || 'he').toLowerCase();` and, if you only support Hebrew for this script, coerce to `'he'`: `const lang = row.lang.trim().toLowerCase() === 'he' ? 'he' : 'he';` or explicitly reject invalid lang with a clear error.

---

### Issue 5: **Security – External API Usage (Auto-Translate)**

**Explanation:**  
`auto-translate-catalog-item-i18n-he.ts` calls Google Translate’s undocumented endpoint with no API key and no rate limiting beyond a simple retry. That can break if Google blocks or changes the API; it also has ToS implications.

**Relevant code:**
```typescript
// auto-translate-catalog-item-i18n-he.ts lines 162–171
const url =
  'https://translate.googleapis.com/translate_a/single?' +
  new URLSearchParams({
    client: 'gtx',
    sl: 'en',
    tl: 'he',
    dt: 't',
    q: text,
  }).toString();
```

**Recommended fix:**  
- Add a short comment in the file that this uses an undocumented/public endpoint, may be rate-limited or deprecated, and is for one-off/script use only.
- Optionally support an env var (e.g. `GOOGLE_TRANSLATE_API_KEY`) and use the official Cloud Translation API for production or high-volume use.
- No change to behavior required for approval if the script is clearly documented as a best-effort, one-off tool.

---

### Issue 6: **Reliability – Auto-Translate Swallows Errors**

**Explanation:**  
When a translation fails, the script increments `failed` but leaves `parsed[index].he_name` as the original empty string. The output CSV is still written and the script exits 0. Callers might assume all empty targets were translated.

**Relevant code:**
```typescript
// auto-translate-catalog-item-i18n-he.ts lines 272–277
} catch (_error) {
  failed += 1;
} finally {
```

**Recommended fix:**  
- Log the failing text (or index) and the error in the catch block (e.g. `console.error(`Translation failed for row ${index}: ${text}`, error)`).
- If `failed > 0`, set `process.exitCode = 1` at the end of `main()` so CI or callers can detect partial failure.

---

### Issue 7: **Readability – Magic Numbers**

**Explanation:**  
Coding Rule #4 (expressive names) and common practice favor named constants over magic numbers.

**Examples:**
- `import-catalog-item-i18n-he.ts`: `250` (chunk size), `250` in auto-translate retry delay.
- `auto-translate-catalog-item-i18n-he.ts`: `5` (attempts), `250 * i` (backoff), `8` (concurrency), `20` (max concurrency), `100` (progress log interval).

**Recommended fix:**  
- Define named constants at the top of each script, e.g. `const IMPORT_CHUNK_SIZE = 250;`, `const TRANSLATE_MAX_ATTEMPTS = 5;`, `const TRANSLATE_BACKOFF_MS = 250;`, `const DEFAULT_CONCURRENCY = 8;`, `const MAX_CONCURRENCY = 20;`, `const PROGRESS_LOG_INTERVAL = 100;`.

---

### Issue 8: **Seed Script – Prisma Client Not Disconnected on Early Throw**

**Explanation:**  
In `seed-catalog-item-i18n.ts`, if `tableExists('public.catalog_item_i18n')` is false, `main()` throws and `.finally()` still runs, so `$disconnect()` is called. If `seedEnglishTranslations()` or `seedHebrewFromAliases()` throws, same. So disconnect is actually fine. No change needed; only noting for clarity.

---

## 3. Compliance Report

### Senior-level engineering expectations
- **Structure:** Scripts are organized and readable but duplicate logic and lack a shared utility layer.
- **Testing:** No tests; critical paths (CSV parse/escape, mapping) should be covered.
- **Documentation:** Missing file-level and JSDoc documentation.
- **Reliability:** Auto-translate should expose failures (exit code + logging) and document API/ToS caveats.

**Verdict:** Does not fully meet senior-level expectations until shared CSV module, tests, and documentation are in place.

### `.cursor/rules/coding_rule.mdc`
- **Descriptive names:** Largely good (`getFilePath`, `rowsToObjects`, `csvEscape`). Some names could be more specific (e.g. `runPool` → `runConcurrentWorkers`).
- **Break down complex operations:** `main()` in auto-translate is long; could extract “load CSV”, “build target list”, “run translation pool”, “write output” into helpers.
- **Centralize common operations:** **Violation** – CSV parse/escape/row mapping duplicated.
- **Single responsibility:** Mostly yes; import script does “read CSV + upsert” which is acceptable for a script.
- **TDD / tests first:** **Violation** – no tests.
- **JSDoc / file purpose:** **Violation** – missing.
- **Edge cases / strict TypeScript:** Null/undefined handled with `??`; types are used. Import script lang default is the only real edge-case fix suggested above.

**Verdict:** Partially compliant; centralization, tests, and documentation are required for full compliance.

---

## 4. Final Recommendation

**Request changes**

Before merge, please:

1. **Required**
   - Introduce a shared CSV utility module and use it in both import and auto-translate (and optionally export) scripts. Remove duplicated `parseCsv`, `rowsToObjects`, and `csvEscape`.
   - Add a unit test file for the shared CSV/escape/row-mapping logic with parameterized cases.
   - Add a short file-level comment and JSDoc for public/non-trivial functions in all four scripts.
   - In auto-translate: log translation failures and set `process.exitCode = 1` when `failed > 0`.

2. **Recommended**
   - Normalize and validate `lang` in the import script (e.g. default to `'he'`, reject or coerce invalid values).
   - Replace magic numbers with named constants in import and auto-translate scripts.
   - Add a brief comment in auto-translate about use of an undocumented Google endpoint and optional future use of the official Translation API.

After these changes, the code will be in good shape for production use and compliant with the project’s coding standards.
