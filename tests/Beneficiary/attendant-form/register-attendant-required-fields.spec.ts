// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { test, expect } from '../../fixtures';
import { AttendantFormPage } from '../../pages/AttendantFormPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Single attendant registration', () => {
  test('ATT-SINGLE-002 — Validate required attendant fields', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const attendantForm = new AttendantFormPage(page);
    let creationRequestCount = 0;

    page.on('request', (request) => {
      if (
        attendantForm.isCreateAttendantCall(
          request.url(),
          request.method(),
        )
      ) {
        creationRequestCount += 1;
      }
    });

    // 1. Open the attendant form and associate one available beneficiary.
    await loginPage.goto('/auth/login');
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === '/dashboard');
    await loginPage.dismissFeedbackPopup();
    await attendantForm.openBeneficiaries();
    await expect(page).toHaveURL((url) => url.pathname === '/beneficiaries');
    await attendantForm.openAttendantsPanel();
    await attendantForm.openCreateForm();
    await expect(attendantForm.form).toBeVisible();

    //- Check toast with no beneficiary selected is displayed when trying to save
    await attendantForm.save();
    await expect(attendantForm.missingBeneficiaryFeedback).toBeVisible();
    await attendantForm.addBeneficiary();
    const firstBeneficiaryCheckbox = attendantForm.form
      .locator('[test-id^="attendants-beneficiaries-checkbox-"]')
      .first();
    await expect(firstBeneficiaryCheckbox).toBeVisible();
    await attendantForm.selectFirstBeneficiary();
    await expect(attendantForm.confirmBeneficiarySelectionButton).toBeEnabled();
    await attendantForm.confirmBeneficiarySelection();

    // 2. Save with the required personal fields empty.
    await attendantForm.save();

    await expect(attendantForm.requiredFieldsToast).toBeVisible();
    await expect(attendantForm.form).toBeVisible();
    expect(creationRequestCount).toBe(0);

    const requiredControls = [
      attendantForm.documentTypeSelect,
      attendantForm.documentNumberInput,
      attendantForm.firstNameInput,
      attendantForm.firstLastNameInput,
      attendantForm.phoneNumberInput,
    ];

    // The current UI does not add red invalid styling to these controls.
    for (const control of requiredControls) {
      await expect(
        attendantForm.requiredFieldContainer(control),
      ).not.toHaveClass(/mat-form-field-invalid|mat-mdc-form-field-invalid/);
    }

    // 3. Complete required identity and contact fields incrementally.
    await attendantForm.selectDocumentType('Cédula de Ciudadanía');
    await expect(attendantForm.documentTypeSelect).toContainText(
      'Cédula de Ciudadanía',
    );

    await attendantForm.documentNumberInput.fill('1032456789');
    await expect(attendantForm.documentNumberInput).toHaveValue('1032456789');

    await attendantForm.firstNameInput.fill('Laura');
    await expect(attendantForm.documentNumberInput).toHaveValue('1032456789');
    await expect(attendantForm.firstNameInput).toHaveValue('Laura');

    await attendantForm.firstLastNameInput.fill('Pruebas');
    await expect(attendantForm.firstNameInput).toHaveValue('Laura');
    await expect(attendantForm.firstLastNameInput).toHaveValue('Pruebas');

    await attendantForm.phoneNumberInput.fill('3001234567');

    // Previously entered values remain available throughout the flow.
    await expect(attendantForm.documentNumberInput).toHaveValue('1032456789');
    await expect(attendantForm.firstNameInput).toHaveValue('Laura');
    await expect(attendantForm.firstLastNameInput).toHaveValue('Pruebas');
    await expect(attendantForm.phoneNumberInput).toHaveValue('3001234567');
    expect(creationRequestCount).toBe(0);
  });
});
