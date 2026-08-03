// spec: specs/login.plan.md
// seed: tests/Login/seed.spec.ts

import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Test Plan', () => {
  test('LOGIN-001 — Successful login redirects to the dashboard', async ({ page }) => {
    const username = 'desarrollo.prisma';
    const password = '1234567890';
    const loginPage = new LoginPage(page);

    let authenticationRequestCount = 0;
    page.on('request', (request) => {
      if (loginPage.isAuthenticationCall(request.url(), request.method())) {
        authenticationRequestCount += 1;
      }
    });

    // 1. Confirm the username and password fields are empty.
    await loginPage.open();
    await expect(loginPage.usernameInput).toHaveValue('');
    await expect(loginPage.passwordInput).toHaveValue('');

    // 2. Enter the valid QA username and password from secure configuration.
    await loginPage.fillCredentials(username, password);

    // 3. Click "Iniciar sesión".
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    // 4. Wait for the authentication response and the resulting navigation.
    await loginPage.waitForPath('/dashboard');

    // 5. Verify the authentication response is successful.
    expect(authenticationResponse.ok()).toBe(true);
    expect(authenticationRequestCount).toBe(1);

    // 6. Verify the final URL is "/dashboard".
    await expect(page).toHaveURL((url) => url.pathname === '/dashboard');

    // 7. Verify a dashboard-specific element is visible.
    await expect(loginPage.authenticatedAccount).toBeVisible();
  });
});
