import { test } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';

test('Seed login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.fillValidCredentials();
  await loginPage.submitAndWaitForAuthentication();
});
