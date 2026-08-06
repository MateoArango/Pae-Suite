// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { BeneficiarySingleForm } from '../../pages/BeneficiarySingleFormPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateGovernmentId } from '../../utils/generateGovernmentId';

async function openRegistration(page: Page): Promise<{
  beneficiaryForm: BeneficiarySingleForm;
  loginPage: LoginPage;
}> {
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

  return { beneficiaryForm, loginPage };
}

async function fillUnsavedBeneficiary(
  beneficiaryForm: BeneficiarySingleForm,
): Promise<void> {
  await beneficiaryForm.fillRequiredFields({
    firstName: 'Cancel',
    firstLastName: 'Regression',
    documentType: 'Cédula de Ciudadanía',
    documentNumber: generateGovernmentId(),
    academicGrade: 'Quinto',
    group: 'a',
    populationType: 'No aplica',
  });
}

async function creationRequestWasSent(
  page: Page,
  beneficiaryForm: BeneficiarySingleForm,
  action: () => Promise<void>,
): Promise<boolean> {
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

  await action();
  return creationRequestPromise;
}

test.describe('Single beneficiary registration', () => {
  // Known defect: clicking X currently submits the valid form and creates a
  // beneficiary. Enable this expected-behavior regression test after the fix.
  test.fixme(
    'BEN-SINGLE-006 — X closes without creating a beneficiary',
    async ({ page }) => {
      const { beneficiaryForm } = await openRegistration(page);
      await fillUnsavedBeneficiary(beneficiaryForm);

      const requestWasSent = await creationRequestWasSent(
        page,
        beneficiaryForm,
        () => beneficiaryForm.close(),
      );

      expect(requestWasSent).toBe(false);
      await expect(beneficiaryForm.form).toBeHidden();
    },
  );

  test('BEN-SINGLE-006 — Cancelar closes without creating a beneficiary', async ({
    page,
  }) => {
    const { beneficiaryForm } = await openRegistration(page);
    await fillUnsavedBeneficiary(beneficiaryForm);

    const requestWasSent = await creationRequestWasSent(
      page,
      beneficiaryForm,
      () => beneficiaryForm.cancel(),
    );

    expect(requestWasSent).toBe(false);
    await expect(beneficiaryForm.form).toBeHidden();

    // Reopening starts with a clean form after Cancelar.
    await beneficiaryForm.openSingleRegistration();
    await expect(beneficiaryForm.form).toBeVisible();
    await expect(beneficiaryForm.firstNameInput).toHaveValue('');
    await expect(beneficiaryForm.documentNumberInput).toHaveValue('');
  });
});
