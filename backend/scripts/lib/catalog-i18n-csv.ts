/**
 * Shared CSV utilities for catalog item i18n scripts.
 * Used by export template, import Hebrew, and auto-translate scripts.
 * Handles RFC 4180-style quoted fields and escaped double quotes.
 */

/** Standard row shape for catalog_item_i18n CSV (template and translated). */
export type CatalogI18nCsvRow = {
  catalog_item_id: string;
  lang: string;
  en_name: string;
  he_name: string;
  category: string;
};

const REQUIRED_COLUMNS: ReadonlyArray<keyof CatalogI18nCsvRow> = [
  'catalog_item_id',
  'lang',
  'en_name',
  'he_name',
  'category',
];

/**
 * Parses CSV content into a matrix of string fields.
 * Supports quoted fields, "" as escaped quote, and \r\n line endings.
 *
 * @param content - Raw CSV string
 * @returns Array of rows, each row an array of field values
 */
export function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentField = '';
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }

      currentRow.push(currentField);
      currentField = '';

      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Maps raw CSV rows to CatalogI18nCsvRow objects.
 * First row must be headers; validates that all required columns exist.
 *
 * @param rows - Output of parseCsv
 * @returns Array of typed row objects
 * @throws Error if a required column is missing
 */
export function rowsToCatalogI18nRows(rows: string[][]): CatalogI18nCsvRow[] {
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((value) => value.trim());
  for (const key of REQUIRED_COLUMNS) {
    if (!headers.includes(key)) {
      throw new Error(`CSV missing required column: ${key}`);
    }
  }

  const index = Object.fromEntries(headers.map((h, i) => [h, i])) as Record<
    string,
    number
  >;

  return rows.slice(1).map((row) => ({
    catalog_item_id: row[index.catalog_item_id] ?? '',
    lang: row[index.lang] ?? '',
    en_name: row[index.en_name] ?? '',
    he_name: row[index.he_name] ?? '',
    category: row[index.category] ?? '',
  }));
}

/**
 * Escapes a CSV field: doubles quotes and wraps in quotes if needed.
 *
 * @param value - Field value
 * @returns Escaped string safe for CSV output
 */
export function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
}

const CSV_HEADER = [
  'catalog_item_id',
  'lang',
  'en_name',
  'he_name',
  'category',
];

/**
 * Serializes CatalogI18nCsvRow[] to CSV string (with trailing newline).
 *
 * @param rows - Rows to serialize
 * @returns CSV content as string
 */
export function toCsv(rows: CatalogI18nCsvRow[]): string {
  const lines = [CSV_HEADER.join(',')];
  for (const row of rows) {
    lines.push(
      [row.catalog_item_id, row.lang, row.en_name, row.he_name, row.category]
        .map((value) => csvEscape(value))
        .join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}
