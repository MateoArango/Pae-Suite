// spec: specs/PaeSuitePlan.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { expect, test } from "../../fixtures";
import { BeneficiarySingleForm } from "../../pages/BeneficiarySingleFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

test.describe("Beneficiary editing", () => {
  test("BEN-EDIT-004 — Validate field boundaries and the unbounded Grupo error", async ({
    page,
  }) => {
    test.slow();

    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    const initialDocumentNumber = generateGovernmentId();
    const updatedDocumentNumber = generateGovernmentId();
    const originalGroup = "a";
    const oversizedGroup = "g".repeat(500);
    
    const boundaryValues = {
      firstName: "f".repeat(30),
      secondName: "s".repeat(30),
      firstLastName: "l".repeat(30),
      secondLastName: "m".repeat(30),
      documentNumber: updatedDocumentNumber,
      documentType: "Cédula de Ciudadanía",
      academicGrade: "Sexto",
      populationType: "No aplica",
    };
const boundaryValuesCamelCase = {
      firstName: "Ffffffffffffffffffffffffffffff",
      secondName: "Ssssssssssssssssssssssssssssss",
      firstLastName: "Llllllllllllllllllllllllllllll",
      secondLastName: "Mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm",
    };
    const boundedControls = [
      {
        control: editBeneficiary.firstNameInput,
        attempted: `${boundaryValues.firstName}F`,
        expected: boundaryValuesCamelCase.firstName,
      },
      {
        control: editBeneficiary.secondNameInput,
        attempted: `${boundaryValues.secondName}S`,
        expected: boundaryValuesCamelCase.secondName,
      },
      {
        control: editBeneficiary.firstLastNameInput,
        attempted: `${boundaryValues.firstLastName}L`,
        expected: boundaryValuesCamelCase.firstLastName,
      },
      {
        control: editBeneficiary.secondLastNameInput,
        attempted: `${boundaryValues.secondLastName}M`,
        expected: boundaryValuesCamelCase.secondLastName,
      },
    ];

    let updateRequestCount = 0;

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

    const reloadSearchOpen = async () => {
      await page.reload();
      await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");
      const searchResponse = await editBeneficiary.searchByDocument(
        updatedDocumentNumber,
      );
      expect(searchResponse.ok()).toBe(true);
      await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
      await loginPage.dismissFeedbackPopup();
      await editBeneficiary.openBeneficiaryByDocument(updatedDocumentNumber);
      await expect(editBeneficiary.form).toBeVisible();
      await editBeneficiary.enableEditButton.click();
      await expect(editBeneficiary.firstNameInput).toBeEditable();
    };

    // 1. Create a unique beneficiary, reopen it, and exercise every bounded edit field.
    await loginPage.goto("/auth/login");
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();
    expect(authenticationResponse.ok()).toBe(true);
    await loginPage.dismissFeedbackPopup();
    await beneficiaryForm.buttonBeneficiaries.click();
    await beneficiaryForm.openSingleRegistration();
    await beneficiaryForm.fillRequiredFields({
      firstName: "Boundary",
      firstLastName: "Beneficiary",
      documentType: boundaryValues.documentType,
      documentNumber: initialDocumentNumber,
      academicGrade: boundaryValues.academicGrade,
      group: originalGroup,
      populationType: boundaryValues.populationType,
    });
    await beneficiaryForm.save();
    await expect(
      beneficiaryForm.successToast("Boundary", "Beneficiary"),
    ).toBeVisible();
    await loginPage.dismissFeedbackPopup();

    await page.reload();
    const initialSearchResponse =
      await editBeneficiary.searchByDocument(initialDocumentNumber);
    expect(initialSearchResponse.ok()).toBe(true);
    await editBeneficiary.openBeneficiaryByDocument(initialDocumentNumber);
    await editBeneficiary.enableEditButton.click();


    for (const { control, attempted, expected } of boundedControls) {
      await control.fill("");
      await control.pressSequentially(attempted);
      await expect(control).toHaveValue(expected);
    }

    // NIUP currently accepts letters, but those values can later break beneficiary opening; keep this persisted boundary check numeric under CC.
    await editBeneficiary.documentNumberInput.fill("");
    await editBeneficiary.documentNumberInput.pressSequentially(
      `${boundaryValues.documentNumber}9`,
    );
    await expect(editBeneficiary.documentNumberInput).toHaveValue(
      boundaryValues.documentNumber,
    );
    await expect(editBeneficiary.groupInput).toHaveValue(originalGroup);

    // 2. Save the valid boundary values once and capture the update response.
    const boundaryUpdateResponsePromise = page.waitForResponse((response) =>
      editBeneficiary.isUpdateBeneficiaryCall(
        response.url(),
        response.request().method(),
      ),
    );
    await editBeneficiary.saveFooterButton.click();
    const boundaryUpdateResponse = await boundaryUpdateResponsePromise;
    expect(boundaryUpdateResponse.ok()).toBe(true);
    expect(updateRequestCount).toBe(1);

    // 3. Reload, search by the updated document, and verify all persisted boundary values.
    await reloadSearchOpen();
    
    await expect(editBeneficiary.firstNameInput).toHaveValue(
      boundaryValuesCamelCase.firstName,
    );
    await expect(editBeneficiary.secondNameInput).toHaveValue(
      boundaryValuesCamelCase.secondName,
    );
    await expect(editBeneficiary.firstLastNameInput).toHaveValue(
      boundaryValuesCamelCase.firstLastName,
    );
    await expect(editBeneficiary.secondLastNameInput).toHaveValue(
      boundaryValuesCamelCase.secondLastName,
    );
    await expect(editBeneficiary.documentTypeSelect).toContainText(
      boundaryValues.documentType,
    );
    await expect(editBeneficiary.documentNumberInput).toHaveValue(
      boundaryValues.documentNumber,
    );
    await expect(editBeneficiary.academicGradeSelect).toContainText(
      boundaryValues.academicGrade,
    );
    await expect(editBeneficiary.populationTypeSelect).toContainText(
      boundaryValues.populationType,
    );
    await expect(editBeneficiary.groupInput).toHaveValue(originalGroup);

    // 4. Submit a 100-character Grupo value and verify the observed server error.
    await editBeneficiary.groupInput.fill(oversizedGroup);
    await expect(editBeneficiary.groupInput).toHaveValue(oversizedGroup);
    const failedUpdateResponsePromise = page.waitForResponse((response) =>
      editBeneficiary.isUpdateBeneficiaryCall(
        response.url(),
        response.request().method(),
      ),
    );
    await editBeneficiary.saveFooterButton.click();
    const failedUpdateResponse = await failedUpdateResponsePromise;
    const failedUpdateBody: unknown = await failedUpdateResponse.json();

    expect(failedUpdateResponse.status()).toBe(500);
    expect(failedUpdateBody).toEqual({
      timestamp: expect.any(String),
      status: 500,
      error: "Internal Server Error",
      path: new URL(failedUpdateResponse.url()).pathname,
    });
    expect(new URL(failedUpdateResponse.url()).pathname).toMatch(
      /^\/v1\.0\/beneficiaries\/\d+$/,
    );
    await expect(editBeneficiary.form).toBeVisible();
    expect(updateRequestCount).toBe(2);

    // 5. Cancel without resubmitting, reopen, and verify the invalid Grupo value was not persisted.
    await editBeneficiary.cancelFooterButton.click();
    await expect(editBeneficiary.enableEditButton).toBeVisible();
    await editBeneficiary.close();
    await expect(page.getByText("1 resultado", { exact: true })).toBeVisible();
    await editBeneficiary.openBeneficiaryByDocument(updatedDocumentNumber);
    await editBeneficiary.enableEditButton.click();
    await expect(editBeneficiary.groupInput).toBeEditable();
    await expect(editBeneficiary.groupInput).toHaveValue(originalGroup);
    await expect(editBeneficiary.groupInput).not.toHaveValue(oversizedGroup);
    expect(updateRequestCount).toBe(2);
  });
});
