// spec: specs/login.plan.md
// seed: tests/Login/seed.spec.ts

import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Test Plan', () => {
  test('LOGIN-002 — Invalid credentials are rejected safely', async ({ page }) => {
    const invalidUsername = 'qa.login.nonexistent';
    const invalidPassword = 'invalid-password-LOGIN-002';
    const loginPage = new LoginPage(page);

    let authenticationRequestCount = 0;
    page.on('request', (request) => {
      if (loginPage.isAuthenticationCall(request.url(), request.method())) {
        authenticationRequestCount += 1;
      }
    });

    await loginPage.open();

    // 1. Enter a reserved nonexistent username and a non-secret invalid password.
    await loginPage.fillCredentials(invalidUsername, invalidPassword);

    // 2. Submit the form.
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    // 3. Wait for the authentication response or visible error state.
    await expect(loginPage.authenticationError).toBeVisible();

    // 4. Verify the user remains on "/auth/login".
    await expect(page).toHaveURL((url) => url.pathname === '/auth/login');

    // 5. Verify a clear, generic error is displayed.
    expect(authenticationResponse.status()).toBe(401);
    expect(authenticationRequestCount).toBe(1);
    await expect(loginPage.authenticationError).toBeVisible();
    await expect(loginPage.authenticationError).not.toContainText(
      invalidUsername,
    );

    // 6. Verify no authenticated dashboard content is visible.
    await expect(loginPage.authenticatedAccount).toHaveCount(0);

    // 7. Verify the password is still masked and no credential is included in the URL.
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    expect(page.url()).not.toContain(invalidUsername);
    expect(page.url()).not.toContain(invalidPassword);
  });
});
