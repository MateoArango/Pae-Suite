import { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private readonly validUsername = 'desarrollo.prisma';
  private readonly validPassword = '1234567890';
  readonly invalidUsername = 'qa.login.nonexistent';
  readonly invalidPassword = 'invalid-password-LOGIN-002';
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly authenticationError: Locator;
  readonly authenticatedAccount: Locator;
  readonly feedbackPopup: Locator;
  readonly feedbackPopupImproveProcess: Locator;
  readonly feedbackPopupCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByTestId('auth-login-form-user-input');
    this.passwordInput = page.getByTestId('auth-login-form-password-input');
    this.submitButton = page.getByTestId('auth-login-form-submit-button');
    this.authenticationError = page.getByText(
      'Usuario o contraseña incorrectos',
      { exact: true },
    );
    this.authenticatedAccount = page.getByText('Mateo Ada');
    this.feedbackPopup = page.getByText(
      '¿Cómo ha sido tu experiencia con el portal?',
      { exact: true },
    );
    this.feedbackPopupCloseButton = page.getByRole('button', {
      name: 'Cerrar popup',
      exact: true,
    });
    this.feedbackPopupImproveProcess = page.getByText(
      '¿Cómo puede mejorar el proceso de registrar estudiantes?',
      { exact: true },
    );
  }

  async open(): Promise<void> {
    await this.goto('/auth/login');
  }

  private async fillCredentials(
    username: string,
    password: string,
  ): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async fillValidCredentials(): Promise<void> {
    await this.fillCredentials('mateo.ada', 'mateo123');
  }

  async fillInvalidCredentials(): Promise<void> {
    await this.fillCredentials(this.invalidUsername, this.invalidPassword);
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
  async dismissFeedbackPopupImproveProcess(timeout = 10_000): Promise<void> {
    const appeared = await this.feedbackPopupImproveProcess
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);

    if (!appeared) {
      return;
    }

    await this.feedbackPopupCloseButton.click();
    await this.feedbackPopupImproveProcess.waitFor({ state: 'hidden' });
  }
}
