// spec: specs/login.plan.md
// seed: tests/Login/seed.spec.ts

import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Test Plan', () => {
  test('LOGIN-007 — Authenticated session survives a reload', async ({ page }) => {
    const username = 'desarrollo.prisma';
    const password = '1234567890';
    const loginPage = new LoginPage(page);

    // 1. Log in successfully.
    await loginPage.open();
    await loginPage.fillCredentials(username, password);
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();
    expect(authenticationResponse.ok()).toBe(true);

    // 2. Confirm "/dashboard" is displayed.
    await expect(page).toHaveURL((url) => url.pathname === '/dashboard');
    await expect(loginPage.authenticatedAccount).toBeVisible();

    // 3. Reload the page.
    await loginPage.reload();

    // 4. Verify the application remains authenticated.
    await expect(page).toHaveURL((url) => url.pathname === '/dashboard');

    // 5. Verify dashboard content is restored without showing the login form.
    await expect(loginPage.authenticatedAccount).toBeVisible();
    await expect(loginPage.submitButton).toHaveCount(0);
  });
});
