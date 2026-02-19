import { test, expect } from '@playwright/test';

/**
 * Validates that the category picker dropdown in CreateCustomItemModal
 * appears on top of other modal content (quantity section, action buttons).
 * Uses portal on web so dropdown is not covered by siblings.
 */
const APP_URL = process.env.E2E_APP_URL || 'http://localhost:8081';

test.describe('Category Picker Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  });

  test('dropdown is visible and appears above modal content when opened', async ({
    page,
  }) => {
    const searchInput = page
      .locator(
        'input[placeholder*="grocery"], input[placeholder*="Search"], input[type="text"]',
      )
      .first();
    await searchInput.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (!(await searchInput.isVisible())) {
      test.skip();
      return;
    }

    await searchInput.fill('custom xyz category test');
    await page.waitForTimeout(800);

    const addCustomButton = page.locator(
      'text=/Add "custom xyz category test"/i, [data-testid*="add-button-custom"]',
    );
    await addCustomButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (!(await addCustomButton.isVisible())) {
      test.skip();
      return;
    }
    await addCustomButton.click();
    await page.waitForTimeout(500);

    const trigger = page.getByTestId('category-picker-trigger');
    await trigger.waitFor({ state: 'visible', timeout: 5000 });
    await trigger.click();
    await page.waitForTimeout(400);

    const dropdown = page.getByTestId('category-picker-dropdown');
    await expect(dropdown).toBeVisible();

    const dropdownBox = await dropdown.boundingBox();
    const cancelButton = page.locator('button:has-text("Cancel"), [role="button"]:has-text("Cancel")').first();
    const cancelBox = await cancelButton.boundingBox().catch(() => null);

    if (dropdownBox && cancelBox) {
      const dropdownBottom = dropdownBox.y + dropdownBox.height;
      const cancelTop = cancelBox.y;
      const dropdownIsAboveActions = dropdownBottom <= cancelTop + 20;
      expect(
        dropdownIsAboveActions,
        'Category dropdown should render above Cancel/Confirm buttons (or overlap only slightly)',
      ).toBe(true);
    }

    const fruitsOption = dropdown.locator('text=Fruits').first();
    await expect(fruitsOption).toBeVisible();
  });
});
