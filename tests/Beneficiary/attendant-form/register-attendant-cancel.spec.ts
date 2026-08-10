// spec: specs/beneficiaries.plan.md
// seed: tests/Login/seed.spec.ts

import { randomInt } from 'node:crypto';
import { test, expect } from '../../fixtures';
import { AttendantFormPage } from '../../pages/AttendantFormPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateGovernmentId } from '../../utils/generateGovernmentId';

test.describe('Single attendant registration', () => {
  test('ATT-SINGLE-006 — Cancel attendant registration without partial data', async ({
    page,
  }) => {
    const runSuffix = randomInt(100_000, 1_000_000).toString();
    const documentNumber = generateGovernmentId();
    const firstName = 'Cancelattendant';
    const firstLastName = `Automation${runSuffix}`;
    const phoneNumber = `3${randomInt(0, 1_000_000_000)
      .toString()
      .padStart(9, '0')}`;
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

    // 1. Open Registrar acudiente from the authenticated Beneficiarios page.
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

    // 2. Enter valid personal data without saving or selecting a beneficiary.
    await attendantForm.fillPersonalData({
      documentType: 'Cédula de Ciudadanía',
      documentNumber,
      firstName,
      firstLastName,
      phoneNumber,
    });

    await expect(attendantForm.documentNumberInput).toHaveValue(
      documentNumber,
    );
    await expect(attendantForm.firstNameInput).toHaveValue(firstName);
    await expect(attendantForm.firstLastNameInput).toHaveValue(firstLastName);
    await expect(attendantForm.phoneNumberInput).toHaveValue(phoneNumber);
    expect(creationRequestCount).toBe(0);

    // 3. Close the form and verify cancellation sends no creation request.
    await attendantForm.close();
    await expect(attendantForm.form).toBeHidden();
    expect(creationRequestCount).toBe(0);

    // 4. Reopen the form and verify none of the cancelled values remain.
    await attendantForm.openCreateForm();
    await expect(attendantForm.form).toBeVisible();
    await expect(attendantForm.documentNumberInput).toHaveValue('');
    await expect(attendantForm.firstNameInput).toHaveValue('');
    await expect(attendantForm.firstLastNameInput).toHaveValue('');
    await expect(attendantForm.phoneNumberInput).toHaveValue('');
    expect(creationRequestCount).toBe(0);
  });
});
