// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { randomInt } from 'node:crypto';
import { test, expect } from '../../fixtures';
import { AttendantFormPage } from '../../pages/AttendantFormPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateGovernmentId } from '../../utils/generateGovernmentId';

test.describe('Single attendant registration', () => {
  test('ATT-SINGLE-001 — Register one attendant with valid data', async ({
    page,
  }) => {
    test.slow();

    const uniqueLetters = Array.from({ length: 6 }, () =>
      String.fromCharCode(65 + randomInt(0, 26)),
    ).join('');
    const firstName = 'Mateo';
    const firstLastName = `Automation${uniqueLetters}`;
    const fullName = `${firstName} ${firstLastName}`;
    const documentNumber = generateGovernmentId();
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

    // 1. Authenticate, open Beneficiarios, and open Registrar acudiente.
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
    await expect(attendantForm.formTitle).toBeVisible();

    // 2. Complete valid identity and contact information.
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

    // 3. Add one available beneficiary and confirm the selection.
    await attendantForm.addBeneficiary();
    const firstBeneficiaryCheckbox = attendantForm.form
      .locator('[test-id^="attendants-beneficiaries-checkbox-"]')
      .first();
    await expect(firstBeneficiaryCheckbox).toBeVisible();
    await attendantForm.selectFirstBeneficiary();
    await expect(attendantForm.confirmBeneficiarySelectionButton).toBeEnabled();
    await attendantForm.confirmBeneficiarySelection();

    // 4. Save once and verify the observed attendant creation contract.
    const creationResponsePromise = page.waitForResponse((response) =>
      attendantForm.isCreateAttendantCall(
        response.url(),
        response.request().method(),
      ),
    );
    await attendantForm.save();
    const creationResponse = await creationResponsePromise;
    const creationBody: unknown = await creationResponse.json();

    expect(creationResponse.status()).toBe(201);
    expect(creationRequestCount).toBe(1);
    expect(creationBody).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ id: expect.any(Number) }),
        entity: 'ScanServices',
        message: 'Created',
      }),
    );
    await expect(attendantForm.successToast).toBeVisible();

    // 5. Search the attendants panel and verify the newly created attendant.
    await expect(attendantForm.form).toBeHidden();
    await attendantForm.openAttendantsPanel();
    await attendantForm.searchAttendants(fullName);
    await expect(attendantForm.attendantItemByText(fullName)).toBeVisible();
  });
});
