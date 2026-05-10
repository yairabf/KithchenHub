import { test, expect, type Page } from '@playwright/test';

const APP_URL = process.env.E2E_APP_URL || 'http://localhost:8081';

const SEEDED_USER = {
  id: 'playwright-user',
  email: 'playwright@example.com',
  name: 'Playwright User',
  householdId: 'household-1',
  isGuest: false,
  role: 'owner',
};

async function seedMockSession(page: Page) {
  await page.goto(APP_URL);

  const acceptButton = page.getByRole('button', { name: 'Accept & Continue' });
  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }

  await page.evaluate((user) => {
    const makeEnvelope = (data: unknown[]) => JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      data,
    });

    const mainList = {
      id: 'list-main',
      localId: 'list-main-local',
      name: 'Main List',
      itemCount: 0,
      icon: 'cart-outline',
      color: '#4CAF50',
      isMain: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('@kitchen_hub_legal_accepted_v1', 'true');
    localStorage.setItem('@kitchen_hub_user', JSON.stringify(user));
    localStorage.setItem('kitchen_hub_access_token', 'fake-access-token');
    localStorage.setItem('kitchen_hub_refresh_token', 'fake-refresh-token');
    localStorage.setItem('@kitchen_hub_guest_shopping_lists', makeEnvelope([mainList]));
    localStorage.setItem('@kitchen_hub_guest_shopping_items', makeEnvelope([]));
  }, SEEDED_USER);

  await page.reload();
  const acceptAfterReload = page.getByRole('button', { name: 'Accept & Continue' });
  if (await acceptAfterReload.isVisible().catch(() => false)) {
    await acceptAfterReload.click();
  }
  await expect(page.getByPlaceholder('Search groceries...')).toBeVisible({ timeout: 15000 });
}

test.describe('Mock item consistency across recipe and shopping flows', () => {
  test('recipe add-all preserves canonical catalog metadata, catalog ids, and unique local item ids', async ({ page }) => {
    await seedMockSession(page);

    await page.getByRole('tab', { name: 'RECIPES' }).click();
    const pancakesCardTitle = page.getByText('Pancakes', { exact: true }).first();
    await expect(pancakesCardTitle).toBeVisible({ timeout: 10000 });
    await pancakesCardTitle.click();

    await expect(page.getByRole('button', { name: 'Add all ingredients to shopping list' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Add all ingredients to shopping list' }).click();

    await page.waitForTimeout(500);

    const shoppingItems = await page.evaluate(() => {
      const raw = localStorage.getItem('@kitchen_hub_guest_shopping_items');
      return raw ? JSON.parse(raw).data : [];
    });

    const flour = shoppingItems.find((item: any) => item.name === 'All-purpose Flour');
    const milk = shoppingItems.find((item: any) => item.name === 'Milk');
    const butter = shoppingItems.find((item: any) => item.name === 'Butter');
    const largeEggs = shoppingItems.find((item: any) => item.name === 'Large Eggs');
    const duplicateIds = shoppingItems
      .map((item: any) => item.id)
      .filter((id: string, index: number, all: string[]) => all.indexOf(id) !== index);

    expect(shoppingItems).toHaveLength(6);

    expect(flour).toMatchObject({
      category: 'baking',
      image: 'https://images.unsplash.com/photo-1628273876255-d4c1c7e8e20d?w=100',
      catalogItemId: 'g81',
    });

    expect(milk).toMatchObject({
      category: 'dairy',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100',
      catalogItemId: 'g27',
    });

    expect(butter).toMatchObject({
      category: 'dairy',
      image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=100',
      catalogItemId: 'g36',
    });

    expect(largeEggs).toMatchObject({
      category: 'dairy',
      image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100',
      catalogItemId: 'g30',
    });

    expect(duplicateIds).toEqual([]);
  });
});
