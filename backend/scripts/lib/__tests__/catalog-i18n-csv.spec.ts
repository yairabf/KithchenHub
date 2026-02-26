import {
  parseCsv,
  rowsToCatalogI18nRows,
  csvEscape,
  toCsv,
  type CatalogI18nCsvRow,
} from '../catalog-i18n-csv';

describe('parseCsv', () => {
  describe.each([
    ['empty string', '', []],
    ['single field', 'a', [['a']]],
    ['two fields', 'a,b', [['a', 'b']]],
    ['quoted field with comma', '"a,b",c', [['a,b', 'c']]],
    ['escaped quote', '"a""b",c', [['a"b', 'c']]],
    [
      'two rows',
      'a,b\nc,d',
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
    ],
    ['trailing newline', 'a,b\n', [['a', 'b']]],
    [
      'CRLF',
      'a,b\r\nc,d',
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
    ],
    [
      'empty row skipped',
      'a,b\n\nc,d',
      [
        ['a', 'b'],
        ['c', 'd'],
      ],
    ],
    ['quoted newline', '"a\nb",c', [['a\nb', 'c']]],
    [
      'UTF-8 BOM on first field',
      '\uFEFFcatalog_item_id,lang,en_name,he_name,category',
      [['catalog_item_id', 'lang', 'en_name', 'he_name', 'category']],
    ],
  ])('%s', (_label, input, expected) => {
    it('returns expected rows', () => {
      expect(parseCsv(input)).toEqual(expected);
    });
  });
});

describe('csvEscape', () => {
  describe.each([
    ['no special chars', 'hello', 'hello'],
    ['empty string', '', ''],
    ['contains double quote', 'say "hi"', '"say ""hi"""'],
    ['contains comma', 'a,b', '"a,b"'],
    ['contains newline', 'a\nb', '"a\nb"'],
    ['contains CR', 'a\rb', '"a\rb"'],
    ['multiple quotes', '"x"', '"""x"""'],
  ])('%s', (_label, input, expected) => {
    it('returns escaped value', () => {
      expect(csvEscape(input)).toBe(expected);
    });
  });
});

describe('rowsToCatalogI18nRows', () => {
  it('returns empty array for empty rows', () => {
    expect(rowsToCatalogI18nRows([])).toEqual([]);
  });

  it('maps header row to object keys', () => {
    const rows = [
      ['catalog_item_id', 'lang', 'en_name', 'he_name', 'category'],
      ['id1', 'he', 'Milk', 'חלב', 'dairy'],
    ];
    expect(rowsToCatalogI18nRows(rows)).toEqual([
      {
        catalog_item_id: 'id1',
        lang: 'he',
        en_name: 'Milk',
        he_name: 'חלב',
        category: 'dairy',
      },
    ]);
  });

  it('throws when required column is missing', () => {
    const rows = [['catalog_item_id', 'lang', 'en_name', 'he_name']];
    expect(() => rowsToCatalogI18nRows(rows)).toThrow(
      'CSV missing required column: category',
    );
  });

  it('uses empty string for missing cell', () => {
    const rows = [
      ['catalog_item_id', 'lang', 'en_name', 'he_name', 'category'],
      ['id1', '', 'Milk', '', 'dairy'],
    ];
    expect(rowsToCatalogI18nRows(rows)).toEqual([
      {
        catalog_item_id: 'id1',
        lang: '',
        en_name: 'Milk',
        he_name: '',
        category: 'dairy',
      },
    ]);
  });

  it('accepts CSV content with UTF-8 BOM (Excel/Sheets export)', () => {
    const content =
      '\uFEFFcatalog_item_id,lang,en_name,he_name,category\nid1,he,Milk,חלב,dairy';
    const rows = parseCsv(content);
    expect(rowsToCatalogI18nRows(rows)).toEqual([
      {
        catalog_item_id: 'id1',
        lang: 'he',
        en_name: 'Milk',
        he_name: 'חלב',
        category: 'dairy',
      },
    ]);
  });
});

describe('toCsv', () => {
  it('outputs header and one row', () => {
    const rows: CatalogI18nCsvRow[] = [
      {
        catalog_item_id: 'id1',
        lang: 'he',
        en_name: 'Milk',
        he_name: 'חלב',
        category: 'dairy',
      },
    ];
    const out = toCsv(rows);
    expect(out).toContain('catalog_item_id,lang,en_name,he_name,category');
    expect(out).toContain('id1,he,Milk,');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('escapes fields with commas', () => {
    const rows: CatalogI18nCsvRow[] = [
      {
        catalog_item_id: 'id1',
        lang: 'he',
        en_name: 'Milk, whole',
        he_name: 'חלב',
        category: 'dairy',
      },
    ];
    const out = toCsv(rows);
    expect(out).toContain('"Milk, whole"');
  });
});
