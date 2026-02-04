import { test, expect, Page } from '@playwright/test';

/**
 * Interactive test to debug OAuth login flow
 * 
 * This test will pause at each step and wait for your approval before proceeding.
 * Use this to debug why the login page isn't navigating after successful OAuth.
 */

test.describe('OAuth Login Debug', () => {
  let page: Page;
  const APP_URL = process.env.E2E_APP_URL || 'http://localhost:19006';
  const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:3000';

  test.beforeEach(async ({ browser }) => {
    // Create a new context with storage state cleared
    const context = await browser.newContext({
      storageState: undefined,
    });
    page = await context.newPage();
    
    // Enable console logging to see what's happening
    page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));
    page.on('pageerror', (error) => console.error(`[Page Error] ${error.message}`));
  });

  test('Debug: OAuth login flow and navigation', async () => {
    // Step 1: Navigate to login page
    console.log('\n📱 Step 1: Navigating to login page...');
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');
    
    // Wait for login screen to appear
    await expect(page.locator('text=Kitchen Hub')).toBeVisible({ timeout: 10000 });
    console.log('✅ Login page loaded');
    
    // Pause for approval
    await page.pause(); // This will open Playwright Inspector - approve to continue
    
    // Step 2: Check current URL and user state
    console.log('\n🔍 Step 2: Checking initial state...');
    const initialUrl = page.url();
    console.log(`Current URL: ${initialUrl}`);
    
    // Check if user is already logged in (check localStorage/AsyncStorage)
    const userState = await page.evaluate(() => {
      // Check AsyncStorage (stored in localStorage on web)
      const asyncStorageKey = '@kitchen_hub_user';
      const userData = localStorage.getItem(asyncStorageKey);
      return userData ? JSON.parse(userData) : null;
    });
    console.log('User state:', userState);
    
    // Check token storage
    const tokenState = await page.evaluate(async () => {
      // On web, SecureStore uses localStorage
      const tokenKey = 'kitchen_hub_access_token';
      return localStorage.getItem(tokenKey);
    });
    console.log('Token exists:', !!tokenState);
    
    await page.pause(); // Approve to continue
    
    // Step 3: Click "Continue with Google" button
    console.log('\n🔵 Step 3: Clicking "Continue with Google"...');
    const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Sign in with Google")').first();
    await expect(googleButton).toBeVisible();
    await googleButton.click();
    
    console.log('✅ Clicked Google sign-in button');
    console.log('⏳ Waiting for redirect to Google OAuth...');
    
    // Wait for navigation to Google or backend OAuth endpoint
    await page.waitForURL(/accounts\.google\.com|localhost:3000.*auth\/google/, { timeout: 10000 });
    const oauthUrl = page.url();
    console.log(`Current URL after click: ${oauthUrl}`);
    
    await page.pause(); // Approve to continue (you'll need to complete Google OAuth manually)
    
    // Step 4: After OAuth completes, check callback URL
    console.log('\n🔄 Step 4: Checking OAuth callback...');
    
    // Wait for redirect back to app (with token in URL or after URL cleanup)
    await page.waitForURL(new RegExp(APP_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), { timeout: 30000 });
    const callbackUrl = page.url();
    console.log(`URL after OAuth callback: ${callbackUrl}`);
    
    // Check URL parameters
    const urlParams = new URL(page.url()).searchParams;
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const isNewHousehold = urlParams.get('isNewHousehold');
    
    console.log('URL params:', {
      token: token ? `${token.substring(0, 20)}...` : null,
      error,
      isNewHousehold,
    });
    
    await page.pause(); // Approve to continue
    
    // Step 5: Wait for app to process callback and check user state
    console.log('\n⏳ Step 5: Waiting for app to process OAuth callback...');
    
    // Wait a bit for the app to process
    await page.waitForTimeout(2000);
    
    // Check if user state was set
    const userStateAfter = await page.evaluate(() => {
      const asyncStorageKey = '@kitchen_hub_user';
      const userData = localStorage.getItem(asyncStorageKey);
      return userData ? JSON.parse(userData) : null;
    });
    console.log('User state after callback:', userStateAfter);
    
    // Check token storage
    const tokenStateAfter = await page.evaluate(() => {
      const tokenKey = 'kitchen_hub_access_token';
      return localStorage.getItem(tokenKey);
    });
    console.log('Token after callback:', tokenStateAfter ? `${tokenStateAfter.substring(0, 20)}...` : null);
    
    await page.pause(); // Approve to continue
    
    // Step 6: Check if navigation occurred
    console.log('\n🧭 Step 6: Checking navigation state...');
    
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    
    // Check if we're still on login page or moved to main app
    const isOnLoginPage = await page.locator('text=Kitchen Hub').isVisible().catch(() => false);
    const isOnMainApp = await page.locator('text=Dashboard, text=Shopping, text=Recipes').first().isVisible().catch(() => false);
    
    console.log('Still on login page:', isOnLoginPage);
    console.log('On main app:', isOnMainApp);
    
    // Check React component state via console
    const reactState = await page.evaluate(() => {
      // Try to access React DevTools or component state
      return {
        user: (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 'DevTools available' : 'Not available',
      };
    });
    console.log('React state:', reactState);
    
    await page.pause(); // Final approval
    
    // Step 7: Manual checks
    console.log('\n📋 Step 7: Manual verification checklist');
    console.log('Please verify:');
    console.log('1. Is the user object set in AuthContext?');
    console.log('2. Is isLoading false?');
    console.log('3. Does RootNavigator show MainNavigator?');
    console.log('4. Check browser console for any errors');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-login-state.png', fullPage: true });
    console.log('📸 Screenshot saved: debug-login-state.png');
  });
});
