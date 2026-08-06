// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { test, expect } from '../../fixtures';
import { BeneficiarySingleForm } from '../../pages/BeneficiarySingleFormPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Single beneficiary registration', () => {
  test('BEN-SINGLE-004 — Validate document format and stale data', async ({
    page,
  }) => {
    const invalidCcDocument = '´´+´+';
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
    await beneficiaryForm.openSingleRegistration();
    await expect(beneficiaryForm.form).toBeVisible();

    // 1. Enter a NIUP value, then switch to CC and verify stale data is sanitized.
    await beneficiaryForm.selectDocumentType('NIUP');
    await beneficiaryForm.documentNumberInput.fill('QAutomationTeo123');
    await expect(beneficiaryForm.documentNumberInput).toHaveValue(
      'QAutomationTeo1',
    );

    await beneficiaryForm.selectDocumentType('Cédula de Ciudadanía');
    await expect(beneficiaryForm.documentNumberInput).toHaveValue('1');

    // 2. Complete the form with the observed invalid CC characters.
    await beneficiaryForm.firstNameInput.fill('Quality');
    await beneficiaryForm.firstLastNameInput.fill('Automation');
    await beneficiaryForm.documentNumberInput.fill(invalidCcDocument);
    await beneficiaryForm.selectAcademicGrade('Quinto');
    await beneficiaryForm.groupInput.fill('a');
    await beneficiaryForm.selectPopulationType('No aplica');

    await expect(beneficiaryForm.documentNumberInput).toHaveValue('');
    await expect(
      beneficiaryForm.requiredFieldContainer(
        beneficiaryForm.documentNumberInput,
      ),
    ).toHaveClass(/mat-form-field-invalid/);
    await expect(beneficiaryForm.desktopSaveButton).toBeEnabled();

    // 3. Save remains clickable, but the frontend silently sends no request.
    const creationRequestPromise = page
      .waitForRequest(
        (request) =>
          beneficiaryForm.isCreateBeneficiaryCall(
            request.url(),
            request.method(),
          ),
        { timeout: 2_000 },
      )
      .then(() => true)
      .catch(() => false);

    await beneficiaryForm.save();
    const creationRequestWasSent = await creationRequestPromise;

    expect(creationRequestWasSent).toBe(false);
    await expect(beneficiaryForm.form).toBeVisible();
    await expect(beneficiaryForm.documentNumberInput).toHaveValue('');
    await expect(page.getByText(/creado exitosamente/i)).toHaveCount(0);
  });
});
