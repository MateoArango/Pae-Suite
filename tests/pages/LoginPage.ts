import { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly authenticationError: Locator;
  readonly authenticatedAccount: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator(
      '[test-id="auth-login-form-user-input"]',
    );
    this.passwordInput = page.locator(
      '[test-id="auth-login-form-password-input"]',
    );
    this.submitButton = page.locator(
      '[test-id="auth-login-form-submit-button"]',
    );
    this.authenticationError = page.getByText(
      'Usuario o contraseña incorrectos',
      { exact: true },
    );
    this.authenticatedAccount = page.getByText('Desarrollo Prisma');
  }

  async open(): Promise<void> {
    await this.goto('/auth/login');
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submitAndWaitForAuthentication(): Promise<Response> {
    const authenticationResponsePromise = this.page.waitForResponse(
      (response) =>
        this.isAuthenticationCall(
          response.url(),
          response.request().method(),
        ),
    );

    await this.submitButton.click();
    return authenticationResponsePromise;
  }

  isAuthenticationCall(url: string, method: string): boolean {
    return (
      method === 'POST' && new URL(url).pathname === '/v1.0/auth/login'
    );
  }
}
