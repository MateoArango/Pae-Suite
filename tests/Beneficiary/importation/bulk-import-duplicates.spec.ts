// spec: specs/beneficiaries.plan.md

import path from 'node:path';
import { test, expect } from '../../fixtures';
import { BeneficiaryPage } from '../../pages/BeneficiaryPage';
import { LoginPage } from '../../pages/LoginPage';

const workbookName =
  'student-data-alright - repeated - attendant  - x2 - repeated-update-verify.xlsx';
const repeatedDocumentNumber = '4466443';
const expectedUpdatedFullName = 'Brad Pitt';

test.describe('Beneficiaries bulk import', () => {
  test('BEN-BULK-005 — Apply the last row for a repeated document', async ({
    page,
  }) => {
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

    // 1. Upload a workbook containing two rows with the same N-Documento.
    await beneficiaryPage.uploadWorkbook(workbookPath);
    await expect(beneficiaryPage.uploader).toContainText(workbookName);
    await expect(beneficiaryPage.importBeneficiariesButton).toBeEnabled();

    // 2. Import the workbook and wait for the bulk operation to finish.
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
    await beneficiaryPage.closeSummaryButton.click();

    // 3. Verify that the last row updated document 4466443 to Brad Pitt.
    const searchResponse = await beneficiaryPage.searchByDocument(
      repeatedDocumentNumber,
    );

    expect(searchResponse.ok()).toBe(true);
    const updatedBeneficiary = page
      .getByRole('heading', {
        name: expectedUpdatedFullName,
        exact: true,
      })
      .locator('..');

    await expect(updatedBeneficiary).toContainText(
      `C.C. ${repeatedDocumentNumber}`,
    );
  });
});
