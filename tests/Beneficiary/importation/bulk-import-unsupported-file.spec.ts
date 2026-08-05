// spec: specs/beneficiaries.plan.md

import path from 'node:path';
import { test, expect } from '../../fixtures';
import { BeneficiaryBulkPage } from '../../pages/BeneficiaryBulkPage';
import { LoginPage } from '../../pages/LoginPage';

const unsupportedFileName = 'error-bulk-import.txt';

test.describe('Beneficiaries bulk import', () => {
  test('BEN-BULK-002 — Reject unsupported file type', async ({ page }) => {
    const unsupportedFilePath = path.resolve(
      __dirname,
      '../../../fixtures',
      unsupportedFileName,
    );
    const loginPage = new LoginPage(page);
    const beneficiaryPage = new BeneficiaryBulkPage(page);

    await loginPage.open();
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === '/dashboard');
    await loginPage.dismissFeedbackPopup();

    await beneficiaryPage.buttonBeneficiaries.click();
    await expect(page).toHaveURL((url) => url.pathname === '/beneficiaries');
    await beneficiaryPage.openBulkRegistration();
    await expect(beneficiaryPage.bulkRegistrationPanel).toBeVisible();
    await expect(beneficiaryPage.uploader).toBeVisible();

    const importRequestPromise = page
      .waitForRequest(
        (request) =>
          beneficiaryPage.isBulkImportCall(
            request.url(),
            request.method(),
          ),
        { timeout: 1_000 },
      )
      .catch(() => null);

    await beneficiaryPage.uploadWorkbook(unsupportedFilePath);

    await expect(beneficiaryPage.unsupportedFileError).toBeVisible();
    await expect(beneficiaryPage.importBeneficiariesButton).toBeDisabled();
    expect(await importRequestPromise).toBeNull();
  });
});
