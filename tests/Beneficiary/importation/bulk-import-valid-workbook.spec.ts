// spec: specs/beneficiaries.plan.md

import path from 'node:path';
import { test, expect } from '../../fixtures';
import { BeneficiaryPage } from '../../pages/BeneficiaryPage';
import { LoginPage } from '../../pages/LoginPage';

const workbookName = 'student-data-alright - 2 records.xlsx';
const importedDocumentNumber = '5643231';
const importedName = 'Luis Philips';

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Set ${name} before running BEN-BULK-001.`);
  }

  return value;
}

test.describe('Beneficiaries bulk import', () => {
  test('BEN-BULK-001 — Import a valid workbook successfully', async ({
    page,
  }) => {
    const username = 'desarrollo.prisma';
    const password = '1234567890';
    const workbookPath = path.resolve(
      __dirname,
      '../../../fixtures',
      workbookName,
    );
    const loginPage = new LoginPage(page);
    const beneficiaryPage = new BeneficiaryPage(page);

    await loginPage.goto('/auth/login');
    await loginPage.fillCredentials(username, password);
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
