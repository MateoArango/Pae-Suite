// spec: specs/PaeSuitePlan.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { expect, test } from "../../fixtures";
import { BeneficiarySingleForm } from "../../pages/BeneficiarySingleFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

test.describe("Beneficiary editing", () => {
  test("BEN-EDIT-003 — Cancel editing without saving changes", async ({
    page,
  }) => {
    test.slow();

    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    const documentNumber = generateGovernmentId();
    let updateRequestCount = 0;

    const original = {
      firstName: "Bencancel",
      firstLastName: "Original",
      documentType: "Tarjeta de Identidad",
      documentNumber,
      academicGrade: "Quinto",
      group: "a",
      populationType: "No aplica",
    };

    const unsaved = {
      firstName: "Unsaved",
      group: "z",
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

    const searchAndOpen = async () => {
      await page.reload();
      await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");
      const searchResponse =
        await editBeneficiary.searchByDocument(documentNumber);
      expect(searchResponse.ok()).toBe(true);
      await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
      await editBeneficiary.openBeneficiaryByDocument(documentNumber);
      await expect(editBeneficiary.form).toBeVisible();
    };

    const enableEditAndExpectOriginalValues = async () => {
      await editBeneficiary.enableEditButton.click();
      await expect(editBeneficiary.firstNameInput).toBeEditable();
      await expect(editBeneficiary.firstNameInput).toHaveValue(
        original.firstName,
      );
      await expect(editBeneficiary.groupInput).toHaveValue(original.group);
      await expect(editBeneficiary.populationTypeSelect).toContainText(
        original.populationType,
      );
    };

    const changeValues = async () => {
      await editBeneficiary.firstNameInput.fill(unsaved.firstName);
      await editBeneficiary.groupInput.fill(unsaved.group);
      await editBeneficiary.selectPopulationType(unsaved.populationType);
      await expect(editBeneficiary.firstNameInput).toHaveValue(
        unsaved.firstName,
      );
      await expect(editBeneficiary.groupInput).toHaveValue(unsaved.group);
      await expect(editBeneficiary.populationTypeSelect).toContainText(
        unsaved.populationType,
      );
      expect(updateRequestCount).toBe(0);
    };

    // 1. Create a unique beneficiary, reopen it, enable editing, and change values without saving.
    await loginPage.goto("/auth/login");
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();
    expect(authenticationResponse.ok()).toBe(true);
    await loginPage.dismissFeedbackPopup();
    await beneficiaryForm.buttonBeneficiaries.click();
    await beneficiaryForm.openSingleRegistration();
    await beneficiaryForm.fillRequiredFields(original);
    await beneficiaryForm.save();
    await expect(
      beneficiaryForm.successToast(original.firstName, original.firstLastName),
    ).toBeVisible();
    await loginPage.dismissFeedbackPopup();

    await searchAndOpen();
    await enableEditAndExpectOriginalValues();
    await changeValues();

    // 2. Cancel editing, return to beneficiary detail, and verify that no update is sent.
    await editBeneficiary.cancelFooterButton.click();
    await expect(editBeneficiary.enableEditButton).toBeVisible();
    await expect(editBeneficiary.firstNameInput).toHaveCount(0);
    expect(updateRequestCount).toBe(0);
    await editBeneficiary.close();
    await expect(editBeneficiary.form).toBeHidden();

    // 3. Reopen the beneficiary and verify that only the original values persisted.
    await searchAndOpen();
    await enableEditAndExpectOriginalValues();
    await expect(editBeneficiary.firstNameInput).not.toHaveValue(
      unsaved.firstName,
    );

    // 4. Repeat the unsaved edit, return with the header back button, and verify persistence again.
    await changeValues();
    await editBeneficiary.close();
    await expect(editBeneficiary.enableEditButton).toBeVisible();
    await expect(editBeneficiary.firstNameInput).toHaveCount(0);
    expect(updateRequestCount).toBe(0);
    await editBeneficiary.close();
    await expect(editBeneficiary.form).toBeHidden();

    await searchAndOpen();
    await enableEditAndExpectOriginalValues();
    expect(updateRequestCount).toBe(0);
  });
});
