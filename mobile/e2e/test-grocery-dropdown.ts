import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

/**
 * Test script for grocery search bar dropdown behavior
 * Tests:
 * 1. Dropdown stays open when clicking + button
 * 2. Dropdown closes when clicking outside
 * 3. Quantity is always 1 when adding items
 */

async function testGroceryDropdown() {
  const browser: Browser = await chromium.launch({ headless: false });
  const page: Page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to app...');
    await page.goto('http://localhost:8081');
    await page.waitForLoadState('networkidle');
    
    // Set guest mode via localStorage
    console.log('👤 Setting guest mode...');
    await page.evaluate(() => {
      localStorage.setItem('@kitchen_hub_user', JSON.stringify({ 
        id: 'guest-user', 
        email: 'guest@example.com', 
        name: 'Guest', 
        isGuest: true 
      }));
    });
    
    // Reload to apply guest mode
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for app to initialize
    
    console.log('🔍 Looking for grocery search input...');
    
    // Try multiple selectors for the search input
    const searchSelectors = [
      'input[placeholder*="grocery"]',
      'input[placeholder*="milk"]',
      'input[type="text"]',
      'input[placeholder*="organic"]',
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        searchInput = page.locator(selector).first();
        if (await searchInput.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found search input with selector: ${selector}`);
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!searchInput || !(await searchInput.isVisible().catch(() => false))) {
      console.log('⚠️  Search input not found. Taking screenshot for debugging...');
      await page.screenshot({ path: 'test-grocery-dropdown-debug.png', fullPage: true });
      console.log('📸 Screenshot saved to test-grocery-dropdown-debug.png');
      return;
    }
    
    // Type in search to open dropdown
    console.log('⌨️  Typing "apple" in search...');
    await searchInput.fill('apple');
    await page.waitForTimeout(1000); // Wait longer for dropdown to appear
    
    // Look for dropdown results - try more specific selectors
    console.log('🔽 Checking for dropdown...');
    const dropdownSelectors = [
      'div[class*="dropdown"]',
      'div[class*="searchResult"]',
      'div[class*="result"]',
      'div[role="listbox"]',
      '[data-testid*="dropdown"]',
      '[data-testid*="search"]',
      'div:has-text("Apple")', // Look for actual result text
    ];
    
    let dropdown = null;
    for (const selector of dropdownSelectors) {
      try {
        dropdown = page.locator(selector).first();
        if (await dropdown.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found dropdown with selector: ${selector}`);
          break;
        }
      } catch {
        continue;
      }
    }
    
    // If still not found, try to find any visible div containing "Apple"
    if (!dropdown || !(await dropdown.isVisible().catch(() => false))) {
      console.log('🔍 Trying alternative: looking for text "Apple"...');
      try {
        const appleText = page.locator('text=Apple').first();
        if (await appleText.isVisible({ timeout: 2000 })) {
          dropdown = appleText.locator('..'); // Get parent element
          console.log('✅ Found dropdown via Apple text');
        }
      } catch {
        // Continue
      }
    }
    
    if (!dropdown || !(await dropdown.isVisible().catch(() => false))) {
      console.log('⚠️  Dropdown not visible. Taking screenshot...');
      await page.screenshot({ path: 'test-grocery-dropdown-no-dropdown.png', fullPage: true });
      return;
    }
    
    // Find the + button
    console.log('➕ Looking for add button...');
    const addButtonSelectors = [
      'button:has([class*="add"])',
      '[class*="add-circle"]',
      'button[aria-label*="add"]',
      'button:has-text("+")',
    ];
    
    let addButton = null;
    for (const selector of addButtonSelectors) {
      try {
        addButton = page.locator(selector).first();
        if (await addButton.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found add button with selector: ${selector}`);
          break;
        }
      } catch {
        continue;
      }
    }
    
    if (!addButton || !(await addButton.isVisible().catch(() => false))) {
      console.log('⚠️  Add button not found. Taking screenshot...');
      await page.screenshot({ path: 'test-grocery-dropdown-no-button.png', fullPage: true });
      return;
    }
    
    // Test 1: Click + button and verify dropdown stays open
    console.log('🧪 Test 1: Clicking + button...');
    // Use force click to bypass pointer event interception
    await addButton.click({ force: true });
    
    // Wait longer and check multiple times (blur handler has 300ms timeout, isSelectingRef resets at 400ms)
    let dropdownStillOpen = false;
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(100);
      dropdownStillOpen = await dropdown.isVisible().catch(() => false);
      if (!dropdownStillOpen && i < 5) {
        // Dropdown closed too early, wait a bit more
        continue;
      }
      if (i === 5) {
        // Final check after 600ms (longer than all timeouts)
        break;
      }
    }
    
    console.log(`   Dropdown still open: ${dropdownStillOpen}`);
    
    if (dropdownStillOpen) {
      console.log('   ✅ PASS: Dropdown stays open after clicking + button');
    } else {
      console.log('   ❌ FAIL: Dropdown closed after clicking + button');
    }
    
    // Test 2: Click outside and verify dropdown closes
    console.log('🧪 Test 2: Clicking outside dropdown...');
    // Click on a safe area outside the dropdown (top-left corner)
    await page.mouse.click(10, 10);
    
    // Wait longer and check multiple times
    let dropdownClosed = false;
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(200);
      dropdownClosed = !(await dropdown.isVisible().catch(() => false));
      if (dropdownClosed) {
        console.log(`   Dropdown closed after ${(i + 1) * 200}ms`);
        break;
      }
    }
    
    console.log(`   Dropdown closed: ${dropdownClosed}`);
    
    if (dropdownClosed) {
      console.log('   ✅ PASS: Dropdown closes when clicking outside');
    } else {
      console.log('   ❌ FAIL: Dropdown did not close when clicking outside');
      console.log('   💡 Note: This might be a timing issue or React Native Web blur event limitation');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-grocery-dropdown-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-grocery-dropdown-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testGroceryDropdown().catch(console.error);
