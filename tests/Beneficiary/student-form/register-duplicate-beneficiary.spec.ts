// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { test, expect } from '../../fixtures';
import { BeneficiarySingleForm } from '../../pages/BeneficiarySingleFormPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateGovernmentId } from '../../utils/generateGovernmentId';

test.describe('Single beneficiary registration', () => {
  test('BEN-SINGLE-003 — Prevent duplicate beneficiary document', async ({
    page,
  }) => {
    test.slow();

    const documentNumber = generateGovernmentId();
    const originalFirstName = 'Mateo';
    const originalFirstLastName = 'Prueba';
    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);

    await loginPage.goto('/auth/login');
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === '/dashboard');
    await loginPage.dismissFeedbackPopup();
    await beneficiaryForm.buttonBeneficiaries.click();
    await expect(page).toHaveURL((url) => url.pathname === '/beneficiaries');

    // Precondition: create a beneficiary with a unique government ID.
    await beneficiaryForm.openSingleRegistration();
    await beneficiaryForm.fillRequiredFields({
      firstName: originalFirstName,
      firstLastName: originalFirstLastName,
      documentType: 'Cédula de Ciudadanía',
      documentNumber,
      academicGrade: 'Quinto',
      group: 'a',
      populationType: 'No aplica',
    });

    const initialCreationResponsePromise = page.waitForResponse((response) =>
      beneficiaryForm.isCreateBeneficiaryCall(
        response.url(),
        response.request().method(),
      ),
    );
    await beneficiaryForm.save();
    const initialCreationResponse = await initialCreationResponsePromise;
    expect(initialCreationResponse.status()).toBe(201);

    // 1. Open Registrar estudiante and reuse the existing government ID.
    await loginPage.dismissFeedbackPopupImproveProcess();
    await beneficiaryForm.openSingleRegistration();
    await beneficiaryForm.fillRequiredFields({
      firstName: 'Duplicado',
      firstLastName: 'No Debe Reemplazar',
      documentType: 'Cédula de Ciudadanía',
      documentNumber,
      academicGrade: 'Quinto',
      group: 'b',
      populationType: 'No aplica',
    });

    await expect(beneficiaryForm.documentNumberInput).toHaveValue(
      documentNumber,
    );

    // 2. Submit once and verify that the API rejects the duplicate document.
    let duplicateRequestCount = 0;
    page.on('request', (request) => {
      if (
        beneficiaryForm.isCreateBeneficiaryCall(
          request.url(),
          request.method(),
        )
      ) {
        duplicateRequestCount += 1;
      }
    });

    const duplicateResponsePromise = page.waitForResponse((response) =>
      beneficiaryForm.isCreateBeneficiaryCall(
        response.url(),
        response.request().method(),
      ),
    );
    await beneficiaryForm.save();
    const duplicateResponse = await duplicateResponsePromise;
    const duplicateResponseBody: unknown = await duplicateResponse.json();

    expect(duplicateResponse.ok()).toBe(false);
    expect(duplicateRequestCount).toBe(1);
    expect(duplicateResponseBody).toEqual(
      expect.objectContaining({
        message: 'The government id already exists',
      }),
    );

    /*
     * Current product gap: the API response explains the duplicated government
     * ID through `message`, but the form does not present it to the user.
     * Keep this response assertion until the UI exposes an accessible error;
     * then add the visible alert/toast assertion described in next improvements.md.
     */

    // Verify that the rejected request did not replace the existing record.
    await beneficiaryForm.cancel();
    const searchResponse = await beneficiaryForm.searchByDocument(
      documentNumber,
    );

    expect(searchResponse.ok()).toBe(true);
    const originalBeneficiaryCard = page
      .getByRole('heading', {
        name: `${originalFirstName} ${originalFirstLastName}`,
        exact: true,
      })
      .locator('..');

    await expect(originalBeneficiaryCard).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Duplicado No Debe Reemplazar',
        exact: true,
      }),
    ).toHaveCount(0);
  });
});
