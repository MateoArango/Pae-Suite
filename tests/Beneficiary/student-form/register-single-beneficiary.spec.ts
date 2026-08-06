// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { test, expect } from '../../fixtures';
import { BeneficiarySingleForm } from '../../pages/BeneficiarySingleFormPage';
import { LoginPage } from '../../pages/LoginPage';
import { generateGovernmentId } from '../../utils/generateGovernmentId';

test.describe('Single beneficiary registration', () => {
  test('BEN-SINGLE-001 — Register one beneficiary with valid required data', async ({
    page,
  }) => {
    const firstName = 'Felipe';
    const firstLastName = 'Neri';
    const documentNumber = generateGovernmentId();
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

    // 2. Complete the required personal and schooling fields.
    await beneficiaryForm.fillRequiredFields({
      firstName,
      firstLastName,
      documentType: 'Cédula de Ciudadanía',
      documentNumber,
      academicGrade: 'Quinto',
      group: 'a',
      populationType: 'No aplica',
    });

    await expect(beneficiaryForm.firstNameInput).toHaveValue(firstName);
    await expect(beneficiaryForm.firstLastNameInput).toHaveValue(firstLastName);
    await expect(beneficiaryForm.documentNumberInput).toHaveValue(
      documentNumber,
    );
    await expect(beneficiaryForm.groupInput).toHaveValue('a');

    // 3. Save once and verify one successful beneficiary creation request.
    const creationResponsePromise = page.waitForResponse((response) =>
      beneficiaryForm.isCreateBeneficiaryCall(
        response.url(),
        response.request().method(),
      ),
    );
    await beneficiaryForm.save();
    const creationResponse = await creationResponsePromise;

    expect(creationResponse.status()).toBe(201);
    expect(creationRequestCount).toBe(1);

    const successToast = beneficiaryForm.successToast(firstName, firstLastName);
    await expect(successToast).toBeVisible();

    const toastBackgroundColor = await successToast.evaluate((element) => {
      let current: Element | null = element;

      while (current) {
        const color = getComputedStyle(current).backgroundColor;
        if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          return color;
        }
        current = current.parentElement;
      }

      return 'transparent';
    });
    const rgb = toastBackgroundColor.match(/\d+/g)?.map(Number);

    expect(rgb, `Toast background was ${toastBackgroundColor}`).toBeDefined();
    expect(
      rgb![1] > rgb![0] && rgb![1] > rgb![2],
      `Expected a green toast, received ${toastBackgroundColor}`,
    ).toBe(true);

    // 4. Search by the generated document and verify the created beneficiary.
    const searchResponse = await beneficiaryForm.searchByDocument(
      documentNumber,
    );

    expect(searchResponse.ok()).toBe(true);
    const beneficiaryCard = page
      .getByRole('heading', {
        name: `${firstName} ${firstLastName}`,
        exact: true,
      })
      .locator('..');

    await expect(beneficiaryCard).toBeVisible();
    await expect(beneficiaryCard).toContainText('No enrolado');
  });
});
