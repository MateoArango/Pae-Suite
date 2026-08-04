import { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly authenticationError: Locator;
  readonly authenticatedAccount: Locator;
  readonly feedbackPopup: Locator;
  readonly feedbackPopupCloseButton: Locator;

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
    this.feedbackPopup = page.getByText(
      '¿Cómo ha sido tu experiencia con el portal?',
      { exact: true },
    );
    this.feedbackPopupCloseButton = page.getByRole('button', {
      name: 'Cerrar popup',
      exact: true,
    });
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

  async dismissFeedbackPopup(timeout = 10_000): Promise<void> {
    const appeared = await this.feedbackPopup
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);

    if (!appeared) {
      return;
    }

    await this.feedbackPopupCloseButton.click();
    await this.feedbackPopup.waitFor({ state: 'hidden' });
  }
}
