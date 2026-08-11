// spec: specs/PaeSuitePlan.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { expect, test } from "../../fixtures";
import { BeneficiarySingleForm } from "../../pages/BeneficiarySingleFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

test.describe("Beneficiary editing", () => {
  test("BEN-EDIT-002 — Validate required fields while editing", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    const documentNumber = generateGovernmentId();
    let updateRequestCount = 0;

    const requiredValues = {
      firstName: "Benrequired",
      firstLastName: "Validation",
      documentType: "Tarjeta de Identidad",
      documentNumber,
      academicGrade: "Sexto",
      group: "a",
      populationType: "Indigena",
    };

    page.on("request", (request) => {
      if (
        editBeneficiary.isUpdateBeneficiaryCall(
          request.url(),
          request.method(),
        )
      ) {
        updateRequestCount += 1;
      }
    });

    // 1. Create a unique beneficiary, reopen it, and enable editing.
    await loginPage.goto("/auth/login");
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();
    expect(authenticationResponse.ok()).toBe(true);
    await loginPage.dismissFeedbackPopup();
    await beneficiaryForm.buttonBeneficiaries.click();
    await beneficiaryForm.openSingleRegistration();
    await beneficiaryForm.fillRequiredFields(requiredValues);
    await beneficiaryForm.save();
    await expect(
      beneficiaryForm.successToast(
        requiredValues.firstName,
        requiredValues.firstLastName,
      ),
    ).toBeVisible();
    await loginPage.dismissFeedbackPopup();

    await page.reload();
    const searchResponse =
      await editBeneficiary.searchByDocument(documentNumber);
    expect(searchResponse.ok()).toBe(true);
    await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
    await editBeneficiary.openBeneficiaryByDocument(documentNumber);
    await expect(editBeneficiary.form).toBeVisible();
    await editBeneficiary.enableEditButton.click();
    await expect(editBeneficiary.firstNameInput).toBeEditable();

    // 2. Clear every required text field and attempt to save.
    const requiredTextControls = [
      {
        control: editBeneficiary.firstNameInput,
        restoredValue: requiredValues.firstName,
      },
      {
        control: editBeneficiary.firstLastNameInput,
        restoredValue: requiredValues.firstLastName,
      },
      {
        control: editBeneficiary.documentNumberInput,
        restoredValue: requiredValues.documentNumber,
      },
      {
        control: editBeneficiary.groupInput,
        restoredValue: requiredValues.group,
      },
    ];

    for (const { control } of requiredTextControls) {
      await control.fill("");
    }

    await expect(editBeneficiary.saveFooterButton).toBeEnabled();
    await editBeneficiary.saveFooterButton.click();

    // The required selects cannot be cleared in the current edit UI and retain valid values.
    await expect(editBeneficiary.academicGradeSelect).toContainText(
      requiredValues.academicGrade,
    );
    await expect(editBeneficiary.populationTypeSelect).toContainText(
      requiredValues.populationType,
    );

    for (const { control } of requiredTextControls) {
      await expect(
        editBeneficiary.requiredFieldContainer(control),
      ).toHaveClass(/mat-form-field-invalid/);
    }

    await expect(editBeneficiary.form).toBeVisible();
    expect(updateRequestCount).toBe(0);

    // 3. Restore required fields incrementally and verify their validation state.
    for (let index = 0; index < requiredTextControls.length; index += 1) {
      const { control, restoredValue } = requiredTextControls[index];
      await control.fill(restoredValue);
      await expect(
        editBeneficiary.requiredFieldContainer(control),
      ).not.toHaveClass(/mat-form-field-invalid/);

      for (const unresolved of requiredTextControls.slice(index + 1)) {
        await expect(
          editBeneficiary.requiredFieldContainer(unresolved.control),
        ).toHaveClass(/mat-form-field-invalid/);
      }
    }

    await expect(editBeneficiary.form).toBeVisible();
    expect(updateRequestCount).toBe(0);
  });
});
