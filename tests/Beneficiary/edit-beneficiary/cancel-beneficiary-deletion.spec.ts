// spec: specs/PaeSuitePlan.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { expect, test } from "../../fixtures";
import { BeneficiarySingleForm } from "../../pages/BeneficiarySingleFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

test.describe("Beneficiary editing", () => {
  test("BEN-EDIT-007 — Cancel beneficiary deletion", async ({ page }) => {
    test.slow();

    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    const beneficiary = {
      firstName: "Bencanceldelete",
      firstLastName: "Automation",
      fullName: "Bencanceldelete Automation",
      documentType: "Tarjeta de Identidad",
      documentNumber: generateGovernmentId(),
      academicGrade: "Quinto",
      group: "a",
      populationType: "No aplica",
    };
    let deleteRequestCount = 0;

    page.on("request", (request) => {
      if (
        editBeneficiary.isDeleteBeneficiaryCall(
          request.url(),
          request.method(),
        )
      ) {
        deleteRequestCount += 1;
      }
    });

    const searchAndOpenBeneficiary = async () => {
      await page.reload();
      await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");
      const searchResponse = await editBeneficiary.searchByDocument(
        beneficiary.documentNumber,
      );
      expect(searchResponse.ok()).toBe(true);
      await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
      await editBeneficiary.openBeneficiaryByDocument(
        beneficiary.documentNumber,
      );
      await expect(editBeneficiary.form).toBeVisible();
    };

    const openDeleteConfirmation = async () => {
      await editBeneficiary.enableEditButton.click();
      await expect(editBeneficiary.deleteBeneficiaryButton).toBeVisible();
      await loginPage.dismissFeedbackPopup();
      await editBeneficiary.deleteBeneficiaryButton.click();
      await expect(editBeneficiary.deleteConfirmationDialog).toBeVisible();
      await expect(editBeneficiary.deleteConfirmationTitle).toBeVisible();
      await expect(
        editBeneficiary.deleteConfirmationMessage(beneficiary.fullName),
      ).toBeVisible();
    };

    // 1. Create a beneficiary with a unique document number and retain its generated full name.
    await loginPage.goto("/auth/login");
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();
    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === "/dashboard");
    await loginPage.dismissFeedbackPopup();
    await beneficiaryForm.buttonBeneficiaries.click();
    await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");
    await beneficiaryForm.openSingleRegistration();
    await expect(beneficiaryForm.form).toBeVisible();
    await beneficiaryForm.fillRequiredFields(beneficiary);

    const creationResponsePromise = page.waitForResponse((response) =>
      beneficiaryForm.isCreateBeneficiaryCall(
        response.url(),
        response.request().method(),
      ),
    );
    await beneficiaryForm.save();
    const creationResponse = await creationResponsePromise;
    expect(creationResponse.status()).toBe(201);
    await expect(
      beneficiaryForm.successToast(
        beneficiary.firstName,
        beneficiary.firstLastName,
      ),
    ).toBeVisible();

    await searchAndOpenBeneficiary();

    // 2. Open the beneficiary, enable editing, and click Eliminar estudiante.
    await openDeleteConfirmation();

    // 3. Cancel the first deletion attempt and verify that no delete request is sent.
    await editBeneficiary.cancelDeleteButton.click();
    await expect(editBeneficiary.deleteConfirmationDialog).toBeHidden();
    await expect(editBeneficiary.form).toBeVisible();
    expect(deleteRequestCount).toBe(0);

    // 4. Search for and reopen the beneficiary, then verify its persisted information.
    await editBeneficiary.cancelFooterButton.click();
    await expect(editBeneficiary.enableEditButton).toBeVisible();
    await editBeneficiary.close();
    await expect(editBeneficiary.form).toBeHidden();
    await searchAndOpenBeneficiary();
    await editBeneficiary.enableEditButton.click();
    await expect(editBeneficiary.firstNameInput).toHaveValue(
      beneficiary.firstName,
    );
    await expect(editBeneficiary.firstLastNameInput).toHaveValue(
      beneficiary.firstLastName,
    );
    await expect(editBeneficiary.documentNumberInput).toHaveValue(
      beneficiary.documentNumber,
    );
    expect(deleteRequestCount).toBe(0);

    // 5. Initiate deletion again, confirm it, and verify that the beneficiary is removed.
    await editBeneficiary.deleteBeneficiaryButton.click();
    await expect(editBeneficiary.deleteConfirmationDialog).toBeVisible();
    const deletionResponsePromise = page.waitForResponse((response) =>
      editBeneficiary.isDeleteBeneficiaryCall(
        response.url(),
        response.request().method(),
      ),
    );
    await editBeneficiary.confirmDeleteButton.click();
    const deletionResponse = await deletionResponsePromise;

    expect(deletionResponse.ok()).toBe(true);
    expect(deleteRequestCount).toBe(1);
    await expect(
      editBeneficiary.deletionSuccessToast(beneficiary.fullName),
    ).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");
    const finalSearchResponse = await editBeneficiary.searchByDocument(
      beneficiary.documentNumber,
    );
    expect(finalSearchResponse.ok()).toBe(true);
    await expect(
      page.getByText(
        "No se encontraron beneficiarios que coincidan con los filtros",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      editBeneficiary.beneficiaryRecord(beneficiary.fullName),
    ).toHaveCount(0);
  });
});
