// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { randomInt } from 'node:crypto';
import { test, expect } from '../../fixtures';
import { AttendantFormPage } from '../../pages/AttendantFormPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateGovernmentId } from '../../utils/generateGovernmentId';

test.describe('Single attendant registration', () => {
  test('ATT-SINGLE-003 — Validate attendant boundaries and duplicate identifiers', async ({
    page,
  }) => {
    test.slow();

    const baselineDocument = generateGovernmentId();
    const duplicatePhoneDocument = generateGovernmentId();
    const baselinePhone = `3${randomInt(0, 1_000_000_000)
      .toString()
      .padStart(9, '0')}`;
    const differentPhone = `3${randomInt(0, 1_000_000_000)
      .toString()
      .padStart(9, '0')}`;
    const firstName = 'A'.repeat(30);
    const secondName = 'B'.repeat(30);
    const firstLastName = 'C'.repeat(30);
    const secondLastName = 'D'.repeat(30);
    const oversizedPhone = '3'.repeat(60);
    const oversizedEmail = `boundary.${'e'.repeat(80)}@example.com`;
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

    const addFirstBeneficiary = async () => {
      await attendantForm.addBeneficiary();
      const firstBeneficiaryCheckbox = attendantForm.form
        .locator('[test-id^="attendants-beneficiaries-checkbox-"]')
        .first();
      await expect(firstBeneficiaryCheckbox).toBeVisible();
      await attendantForm.selectFirstBeneficiary();
      await expect(
        attendantForm.confirmBeneficiarySelectionButton,
      ).toBeEnabled();
      await attendantForm.confirmBeneficiarySelection();
    };

    const reopenCreateForm = async () => {
      await page.reload();
      await expect(page).toHaveURL((url) => url.pathname === '/beneficiaries');
      await attendantForm.openAttendantsPanel();
      await attendantForm.openCreateForm();
      await expect(attendantForm.form).toBeVisible();
    };

    // 1. Exercise every observed government-ID and name boundary.
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
    await attendantForm.selectDocumentType('Cédula de Ciudadanía');

    const boundedControls = [
      {
        control: attendantForm.documentNumberInput,
        attempted: `${baselineDocument}9`,
        expected: baselineDocument,
      },
      {
        control: attendantForm.firstNameInput,
        attempted: `${firstName}A`,
        expected: firstName,
      },
      {
        control: attendantForm.secondNameInput,
        attempted: `${secondName}B`,
        expected: secondName,
      },
      {
        control: attendantForm.firstLastNameInput,
        attempted: `${firstLastName}C`,
        expected: firstLastName,
      },
      {
        control: attendantForm.secondLastNameInput,
        attempted: `${secondLastName}D`,
        expected: secondLastName,
      },
    ];

    for (const { control, attempted, expected } of boundedControls) {
      await control.pressSequentially(attempted);
      await expect(control).toHaveValue(expected);
    }

    // 2. Document that phone and email currently retain oversized values.
    await attendantForm.phoneNumberInput.pressSequentially(oversizedPhone);
    await attendantForm.emailInput.pressSequentially(oversizedEmail);
    await expect(attendantForm.phoneNumberInput).toHaveValue(oversizedPhone);
    await expect(attendantForm.emailInput).toHaveValue(oversizedEmail);

    // Replace diagnostic values before submission.
    await attendantForm.phoneNumberInput.fill(baselinePhone);
    await attendantForm.emailInput.fill('boundary@example.com');

    // 3. Create one baseline attendant with valid boundary values.
    await addFirstBeneficiary();
    const baselineResponsePromise = page.waitForResponse((response) =>
      attendantForm.isCreateAttendantCall(
        response.url(),
        response.request().method(),
      ),
    );
    await attendantForm.save();
    const baselineResponse = await baselineResponsePromise;

    expect(baselineResponse.status()).toBe(201);
    await expect(attendantForm.successToast).toBeVisible();
    await expect(attendantForm.form).toBeHidden();

    // 4. Reuse the government ID with a different valid phone number.
    await reopenCreateForm();
    await attendantForm.fillPersonalData({
      documentType: 'Cédula de Ciudadanía',
      documentNumber: baselineDocument,
      firstName: 'Duplicate',
      firstLastName: 'GovernmentId',
      phoneNumber: differentPhone,
    });
    await addFirstBeneficiary();
    const duplicateGovernmentResponsePromise = page.waitForResponse(
      (response) =>
        attendantForm.isCreateAttendantCall(
          response.url(),
          response.request().method(),
        ),
    );
    await attendantForm.save();
    const duplicateGovernmentResponse =
      await duplicateGovernmentResponsePromise;
    const duplicateGovernmentBody: unknown =
      await duplicateGovernmentResponse.json();

    expect(duplicateGovernmentResponse.ok()).toBe(false);
    expect(duplicateGovernmentBody).toEqual(
      expect.objectContaining({
        message: 'The government id already exists',
      }),
    );
    await expect(attendantForm.saveErrorToast).toBeVisible();
    await expect(attendantForm.form).toBeVisible();

    // 5. Reuse the phone number with a unique government ID.
    await reopenCreateForm();
    await attendantForm.fillPersonalData({
      documentType: 'Cédula de Ciudadanía',
      documentNumber: duplicatePhoneDocument,
      firstName: 'Duplicate',
      firstLastName: 'Phone',
      phoneNumber: baselinePhone,
    });
    await addFirstBeneficiary();
    const duplicatePhoneResponsePromise = page.waitForResponse((response) =>
      attendantForm.isCreateAttendantCall(
        response.url(),
        response.request().method(),
      ),
    );
    await attendantForm.save();
    const duplicatePhoneResponse = await duplicatePhoneResponsePromise;
    const duplicatePhoneBody: unknown = await duplicatePhoneResponse.json();

    expect(duplicatePhoneResponse.ok()).toBe(false);
    expect(duplicatePhoneBody).toEqual(
      expect.objectContaining({
        message: 'The phone number already exists',
      }),
    );
    await expect(attendantForm.saveErrorToast).toBeVisible();
    await expect(attendantForm.form).toBeVisible();

    // 6. Only the baseline request succeeded.
    expect(creationRequestCount).toBe(3);
    expect([baselineResponse, duplicateGovernmentResponse, duplicatePhoneResponse]
      .filter((response) => response.ok())).toHaveLength(1);
  });
});
