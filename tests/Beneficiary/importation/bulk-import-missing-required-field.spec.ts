// spec: specs/beneficiaries.plan.md

import path from 'node:path';
import { test, expect } from '../../fixtures';
import { BeneficiaryPage } from '../../pages/BeneficiaryPage';
import { LoginPage } from '../../pages/LoginPage';

const workbookName =
  'student-data-alright - 2 records - missed required.xlsx';
const malformedDocumentNumber = '521643231';

test.describe('Beneficiaries bulk import', () => {
  test('BEN-BULK-003 — Report a missing required field', async ({ page }) => {
    const workbookPath = path.resolve(
      __dirname,
      '../../../fixtures',
      workbookName,
    );
    const loginPage = new LoginPage(page);
    const beneficiaryPage = new BeneficiaryPage(page);

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

    await beneficiaryPage.uploadWorkbook(workbookPath);
    await expect(beneficiaryPage.uploader).toContainText(workbookName);
    await expect(beneficiaryPage.importBeneficiariesButton).toBeEnabled();

    const importResponsePromise = page.waitForResponse((response) =>
      beneficiaryPage.isBulkImportCall(
        response.url(),
        response.request().method(),
      ),
    );

    await beneficiaryPage.importBeneficiariesButton.click();
    const importResponse = await importResponsePromise;

    expect(importResponse.ok()).toBe(true);
    await loginPage.dismissFeedbackPopupImproveProcess(3_000);
    await expect(beneficiaryPage.totalProcessedLabel).toBeVisible();
    await expect(beneficiaryPage.missingRequiredGradeError).toContainText(
      'Missing required field: grado',
    );

    await beneficiaryPage.closeSummaryButton.click();
    const searchResponse = await beneficiaryPage.searchByDocument(
      malformedDocumentNumber,
    );

    expect(searchResponse.ok()).toBe(true);
    await expect(
      beneficiaryPage.noMatchingBeneficiariesMessage,
    ).toBeVisible();
  });
});
