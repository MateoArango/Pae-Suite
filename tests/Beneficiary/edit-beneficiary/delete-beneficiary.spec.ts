// spec: specs/PaeSuitePlan.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { expect, test } from "../../fixtures";
import { BeneficiarySingleForm } from "../../pages/BeneficiarySingleFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

test.describe("Beneficiary editing", () => {
  test("BEN-EDIT-006 — Delete a beneficiary created by the test", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    const beneficiary = {
      firstName: "Bendelete",
      firstLastName: "Automation",
      fullName: "Bendelete Automation",
      documentType: "Tarjeta de Identidad",
      documentNumber: generateGovernmentId(),
      academicGrade: "Quinto",
      group: "a",
      populationType: "No aplica",
    };
    let deleteRequestCount = 0;

    page.on("request", (request) => {
      if (
        editBeneficiary.isDeleteBeneficiaryCall(request.url(), request.method())
      ) {
        deleteRequestCount += 1;
      }
    });

    // 1. Create a beneficiary with a unique document number and retain its full name.
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

    const initialSearchResponse = await editBeneficiary.searchByDocument(
      beneficiary.documentNumber,
    );
    expect(initialSearchResponse.ok()).toBe(true);
    await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();

    // 2. Open the created beneficiary, enable editing, and initiate deletion.
    await editBeneficiary.openBeneficiaryByDocument(beneficiary.documentNumber);
    await expect(editBeneficiary.form).toBeVisible();
    await editBeneficiary.enableEditButton.click();
    await expect(editBeneficiary.deleteBeneficiaryButton).toBeVisible();
    await loginPage.dismissFeedbackPopupImproveProcess();
    await editBeneficiary.deleteBeneficiaryButton.click();

    await expect(editBeneficiary.deleteConfirmationTitle).toBeVisible();
    await expect(
      editBeneficiary.deleteConfirmationMessage(beneficiary.fullName),
    ).toBeVisible();
    await expect(editBeneficiary.cancelDeleteButton).toBeVisible();
    await expect(editBeneficiary.confirmDeleteButton).toBeVisible();

    // 3. Confirm once and verify the delete response and success feedback.
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

    // 4. Search again and verify that the deleted beneficiary is absent.
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
