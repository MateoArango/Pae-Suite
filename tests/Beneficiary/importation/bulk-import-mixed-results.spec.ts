// spec: specs/beneficiaries.plan.md

import path from 'node:path';
import { test, expect } from '../../fixtures';
import { BeneficiaryPage } from '../../pages/BeneficiaryPage';
import { LoginPage } from '../../pages/LoginPage';

const workbookName = 'bulk-004-some ok- some missing required fields.xlsx';
const createdDocumentNumber = '65869700';
const malformedDocumentNumber = '11510266';
const expectedErrors = [
  'Missing required field: primer_nombre',
  'Missing required field: primer_apellido',
  'Missing required field: grado',
  'Missing required field: grupo',
  'Missing required field: tipo_poblacion',
];

test.describe('Beneficiaries bulk import', () => {
  test('BEN-BULK-004 — Report row-level invalid values', async ({ page }) => {
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

    await expect(
      beneficiaryPage.totalProcessedLabel.locator('..'),
    ).toContainText('6');
    await expect(beneficiaryPage.errorsLabel.locator('..')).toContainText(
      '5',
    );
    await expect(beneficiaryPage.importDetailsLabel).toBeVisible();

    for (const expectedError of expectedErrors) {
      await expect(
        beneficiaryPage.bulkImportError(expectedError),
      ).toContainText(expectedError);
    }

    await beneficiaryPage.closeSummaryButton.click();

    const createdSearchResponse = await beneficiaryPage.searchByDocument(
      createdDocumentNumber,
    );
    expect(createdSearchResponse.ok()).toBe(true);
    await expect(page.getByText(createdDocumentNumber)).toBeVisible();

    const malformedSearchResponse = await beneficiaryPage.searchByDocument(
      malformedDocumentNumber,
    );
    expect(malformedSearchResponse.ok()).toBe(true);
    await expect(
      beneficiaryPage.noMatchingBeneficiariesMessage,
    ).toBeVisible();
  });
});
