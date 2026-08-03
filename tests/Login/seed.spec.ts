import { test } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';

test('Seed login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.open();
  await loginPage.fillCredentials('desarrollo.prisma', '1234567890');
  await loginPage.submitAndWaitForAuthentication();
});
