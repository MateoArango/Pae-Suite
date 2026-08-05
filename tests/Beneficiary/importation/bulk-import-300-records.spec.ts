// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import path from 'node:path';
import { test, expect } from '../../fixtures';
import { BeneficiaryBulkPage } from '../../pages/BeneficiaryBulkPage';
import { LoginPage } from '../../pages/LoginPage';

const workbookName =
  'student-data-alright - repeated - attendant  - x300 - correct importation.xlsx';

const representativeBeneficiaries = [
  { documentNumber: '78910604', name: 'Isabella María Muñoz Morales' },
  { documentNumber: '60443039', name: 'Daniela Sánchez Jiménez' },
  { documentNumber: '44620387', name: 'Martín José Reyes Sánchez' },
  { documentNumber: '73741600', name: 'Camila David Ortiz González' },
  { documentNumber: '68002934', name: 'Santiago López Rivera' },
  { documentNumber: '38137751', name: 'Samuel Antonio Flores Jiménez' },
  { documentNumber: '31177911', name: 'Sebastián Andrea Díaz Sánchez' },
  { documentNumber: '94305528', name: 'Isabella José Flores Martínez' },
  { documentNumber: '43298994', name: 'Camila José Ortiz Morales' },
  { documentNumber: '43412580', name: 'Lucía José Martínez Flores' },
] as const;

test.describe('Beneficiaries bulk import', () => {
  test('BEN-BULK-007 — Import 300 valid records successfully', async ({
    page,
  }) => {
    test.slow();

    const workbookPath = path.resolve(
      __dirname,
      '../../../fixtures',
      workbookName,
    );
    const loginPage = new LoginPage(page);
    const beneficiaryPage = new BeneficiaryBulkPage(page);

    // 1. Authenticate and navigate to Beneficiarios.
    await loginPage.goto('/auth/login');
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === '/dashboard');
    await loginPage.dismissFeedbackPopup();
    await beneficiaryPage.buttonBeneficiaries.click();
    await expect(page).toHaveURL((url) => url.pathname === '/beneficiaries');

    // 2. Open Registro masivo and upload the valid 300-record workbook.
    await beneficiaryPage.openBulkRegistration();
    await expect(beneficiaryPage.bulkRegistrationPanel).toBeVisible();
    await beneficiaryPage.uploadWorkbook(workbookPath);
    await expect(beneficiaryPage.uploader).toContainText(workbookName);
    await expect(beneficiaryPage.importBeneficiariesButton).toBeEnabled();

    // 3. Import the workbook and verify the bulk-load request succeeds.
    const bulkImportResponsePromise = page.waitForResponse((response) =>
      beneficiaryPage.isBulkImportCall(
        response.url(),
        response.request().method(),
      ),
    );
    await beneficiaryPage.importBeneficiariesButton.click();
    const bulkImportResponse = await bulkImportResponsePromise;

    expect(bulkImportResponse.ok()).toBe(true);
    await loginPage.dismissFeedbackPopupImproveProcess(3_000);

    // 4. Verify all 300 rows were processed without import errors.
    await expect(beneficiaryPage.totalProcessedLabel).toBeVisible();
    await expect(
      beneficiaryPage.totalProcessedLabel.locator('..'),
    ).toContainText('300');
    await expect(beneficiaryPage.errorsLabel.locator('..')).toContainText('0');
    await beneficiaryPage.closeSummaryButton.click();

    // 5. Verify 10 evenly distributed beneficiaries, including the first and last rows.
    for (const beneficiary of representativeBeneficiaries) {
      const searchResponse = await beneficiaryPage.searchByDocument(
        beneficiary.documentNumber,
      );

      expect(searchResponse.ok()).toBe(true);
      await expect(
        page.getByText(beneficiary.name, { exact: true }),
      ).toBeVisible();
    }
  });
});
