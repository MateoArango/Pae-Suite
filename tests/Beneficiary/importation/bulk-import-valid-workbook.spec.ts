// spec: specs/beneficiaries.plan.md

import path from 'node:path';
import { test, expect } from '../../fixtures';
import { BeneficiaryBulkPage } from '../../pages/BeneficiaryBulkPage';
import { LoginPage } from '../../pages/LoginPage';

const workbookName = 'student-data-alright - 2 records.xlsx';
const importedDocumentNumber = '5643231';
const importedName = 'Luis Philips';

test.describe('Beneficiaries bulk import', () => {
  test('BEN-BULK-001 — Import a valid workbook successfully', async ({
    page,
  }) => {
    const workbookPath = path.resolve(
      __dirname,
      '../../../fixtures',
      workbookName,
    );
    const loginPage = new LoginPage(page);
    const beneficiaryPage = new BeneficiaryBulkPage(page);

    await loginPage.goto('/auth/login');
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

    await beneficiaryPage.uploadWorkbook(workbookPath);
    await expect(beneficiaryPage.uploader).toContainText(workbookName);
    await expect(beneficiaryPage.importBeneficiariesButton).toBeEnabled();

    await beneficiaryPage.importBeneficiariesButton.click();
    await loginPage.dismissFeedbackPopupImproveProcess(3_000);

    await expect(beneficiaryPage.totalProcessedLabel).toBeVisible();
    await expect(
      beneficiaryPage.totalProcessedLabel.locator('..'),
    ).toContainText('2');

    await beneficiaryPage.closeSummaryButton.click();
    await beneficiaryPage.searchByDocument(importedDocumentNumber);

    await expect(
      page.getByText(importedName, { exact: true }),
    ).toBeVisible();
  });
});
