import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const APP_URL = process.env.E2E_APP_URL || 'http://localhost:8081';
const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:3000';
const BACKEND_DIR = path.resolve(__dirname, '../../backend');

function getVerificationTokenFromDatabase(email: string): string {
  const script = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: ${JSON.stringify(email)} },
    select: { emailVerificationToken: true },
  });
  process.stdout.write(user?.emailVerificationToken || '');
}
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

  const output = execFileSync('node', ['-r', 'dotenv/config', '-e', script], {
    cwd: BACKEND_DIR,
    encoding: 'utf8',
  }).trim();

  if (!output) {
    throw new Error(`No verification token found for ${email}`);
  }

  return output;
}

test.describe('Email Auth (Non-Google) Flow', () => {
  test.setTimeout(120000);

  test('registers user, blocks login before verify, verifies email, logs in successfully', async ({ page, request }) => {
    const email = `playwright.email.auth.${Date.now()}@example.com`;
    const password = 'StrongPass1';
    const name = 'Playwright Email User';

    await page.goto(APP_URL);
    await expect(page.getByText('FullHouse')).toBeVisible({ timeout: 15000 });

    const acceptContinueButton = page.getByRole('button', {
      name: 'Accept & Continue',
    });
    if (await acceptContinueButton.isVisible().catch(() => false)) {
      await acceptContinueButton.click();
      await expect(acceptContinueButton).not.toBeVisible({ timeout: 5000 });
    }

    await page.getByRole('button', { name: 'Create account' }).click({
      force: true,
    });
    await expect(page.getByText('Sign up to get started')).toBeVisible();

    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Confirm password', { exact: true }).fill(password);

    const registerDialogPromise = page
      .waitForEvent('dialog', { timeout: 5000 })
      .catch(() => null);
    await page
      .getByRole('button', { name: 'Create account' })
      .last()
      .click({ force: true });

    const registerDialog = await registerDialogPromise;
    if (registerDialog) {
      expect(registerDialog.message()).toContain(
        'Please check your email to verify your account',
      );
      await registerDialog.accept();
    }

    await expect(page.getByText('FullHouse')).toBeVisible({ timeout: 10000 });

    const openEmailLoginFormIfNeeded = async () => {
      const emailField = page.getByLabel('Email', { exact: true });
      const emailFieldVisible = await emailField.isVisible().catch(() => false);
      if (!emailFieldVisible) {
        await page.getByRole('button', { name: 'Sign in with email' }).click();
      }
    };

    await openEmailLoginFormIfNeeded();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);

    const blockedDialogPromise = page
      .waitForEvent('dialog', { timeout: 5000 })
      .catch(() => null);
    await page.getByRole('button', { name: 'Sign in' }).click();

    const blockedDialog = await blockedDialogPromise;
    if (blockedDialog) {
      expect(blockedDialog.message()).toContain(
        'Please verify your email before logging in',
      );
      await blockedDialog.accept();
    }

    const verificationToken = getVerificationTokenFromDatabase(email);
    const verifyResponse = await request.get(
      `${BACKEND_URL}/api/v1/auth/verify-email?token=${verificationToken}`,
    );

    expect(verifyResponse.ok()).toBeTruthy();
    const verifyPayload = await verifyResponse.json();
    expect(verifyPayload.success).toBe(true);

    await openEmailLoginFormIfNeeded();
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('tab', { name: 'HOME' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Sign Out')).toBeVisible({ timeout: 15000 });
  });
});
