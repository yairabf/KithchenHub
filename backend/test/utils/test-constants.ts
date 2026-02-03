/**
 * Test constants for E2E tests.
 * Centralizes hard-coded values to improve maintainability.
 */

export const TEST_CONSTANTS = {
  API_URL: '/api/v1',

  SHOPPING_LIST: {
    NAME_1: 'Test Shopping List',
    NAME_2: 'Second Shopping List',
    NAME_3: 'List One',
    NAME_4: 'List Two',
    COLOR_1: '#FF0000',
    COLOR_2: '#00FF00',
    COLOR_3: '#0000FF',
    COLOR_4: '#FFFF00',
  },

  SHOPPING_ITEM: {
    CUSTOM_NAME_1: 'My Custom Item',
    CUSTOM_NAME_2: 'Temporary Custom Item',
    QUANTITY_1: 2,
    QUANTITY_2: 1,
    QUANTITY_3: 3,
    UNIT_PIECES: 'pieces',
  },

  RECIPE: {
    TITLE_1: 'Test Recipe',
    TITLE_2: 'Updated Test Recipe',
    TITLE_3: 'Recipe One',
    TITLE_4: 'Recipe Two',
    PREP_TIME_1: 30,
    PREP_TIME_2: 45,
    PREP_TIME_3: 20,
    PREP_TIME_4: 25,
    INGREDIENT_FLOUR: { name: 'Flour', quantity: 2, unit: 'cups' },
    INGREDIENT_SUGAR: { name: 'Sugar', quantity: 1, unit: 'cup' },
    INSTRUCTION_1: { step: 1, instruction: 'Mix dry ingredients' },
    INSTRUCTION_2: { step: 2, instruction: 'Add wet ingredients' },
  },

  CHORE: {
    TITLE_1: 'Test Chore',
    TITLE_2: 'Updated Test Chore',
    TITLE_3: 'Chore One',
    TITLE_4: 'Chore Two',
    DAYS_OFFSET_1: 1,
    DAYS_OFFSET_2: 2,
  },

  HOUSEHOLD: {
    NAME_1: 'Updated Test Household',
  },

  USER: {
    PASSWORD: 'testpassword123',
    NAME: 'Test User',
  },
} as const;

/**
 * Generates a unique test email address
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}@example.com`;
}

/**
 * Creates a date offset by the specified number of days from now
 */
export function createDateWithOffset(daysOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}
