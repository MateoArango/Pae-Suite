// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { test, expect } from '../../fixtures';
import { BeneficiarySingleForm } from '../../pages/BeneficiarySingleFormPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Single beneficiary registration', () => {
  test('BEN-SINGLE-002 — Validate required beneficiary fields', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);
    let creationRequestCount = 0;

    page.on('request', (request) => {
      if (
        beneficiaryForm.isCreateBeneficiaryCall(
          request.url(),
          request.method(),
        )
      ) {
        creationRequestCount += 1;
      }
    });

    // 1. Authenticate, open Beneficiarios, and select Registro único.
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

    // 2. Submit the empty form.
    await beneficiaryForm.save();

    // 3. Verify every required field enters Angular's invalid state.
    const requiredControls = [
      beneficiaryForm.firstNameInput,
      beneficiaryForm.firstLastNameInput,
      beneficiaryForm.documentTypeSelect,
      beneficiaryForm.documentNumberInput,
      beneficiaryForm.academicGradeSelect,
      beneficiaryForm.groupInput,
      beneficiaryForm.populationTypeSelect,
    ];

    for (const control of requiredControls) {
      await expect(
        beneficiaryForm.requiredFieldContainer(control),
      ).toHaveClass(/mat-form-field-invalid/);
    }

    // 4. Verify validation blocks creation and keeps the form open.
    await expect(beneficiaryForm.form).toBeVisible();
    expect(creationRequestCount).toBe(0);

    // 5. Fill one required field and verify his validation state is cleared.
    await beneficiaryForm.firstNameInput.fill('John');
    await expect(
      beneficiaryForm.requiredFieldContainer(beneficiaryForm.firstNameInput),
    ).not.toHaveClass(/mat-form-field-invalid/);
  });
});
