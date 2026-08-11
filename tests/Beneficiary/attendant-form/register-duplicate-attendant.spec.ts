// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { randomInt } from "node:crypto";
import { test, expect } from "../../fixtures";
import { AttendantFormPage } from "../../pages/AttendantFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

test.describe("Single attendant registration", () => {
  test("ATT-SINGLE-004 — Reassign a beneficiary to another attendant", async ({
    page,
  }) => {
    test.slow();

    const loginPage = new LoginPage(page);
    const attendantForm = new AttendantFormPage(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    const firstName = "Reassignment";
    const firstLastName = `Automation${randomInt(100_000, 1_000_000)}`;
    const attendantFullName = `${firstName} ${firstLastName}`;

    // 1. Open Registrar acudiente and create a different attendant.
    await loginPage.goto("/auth/login");
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === "/dashboard");
    await loginPage.dismissFeedbackPopup();
    await attendantForm.openBeneficiaries();
    await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");
    await attendantForm.openAttendantsPanel();
    await attendantForm.openCreateForm();
    await expect(attendantForm.form).toBeVisible();

    await attendantForm.fillPersonalData({
      documentType: "Cédula de Ciudadanía",
      documentNumber: generateGovernmentId(),
      firstName,
      firstLastName,
      phoneNumber: `3${randomInt(0, 1_000_000_000)
        .toString()
        .padStart(9, "0")}`,
    });

    // 2. Select the first beneficiary and save the new relationship.
    await attendantForm.addBeneficiary();
    const [beneficiary] =
      await attendantForm.selectFirstBeneficiariesAndGetDocuments(1);
    await attendantForm.confirmBeneficiarySelection();

    const creationResponsePromise = page.waitForResponse((response) =>
      attendantForm.isCreateAttendantCall(
        response.url(),
        response.request().method(),
      ),
    );
    await attendantForm.save();
    const creationResponse = await creationResponsePromise;

    expect(creationResponse.status()).toBe(201);
    await expect(attendantForm.successToast).toBeVisible();
    await expect(attendantForm.form).toBeHidden();

    // 3. Search by the unique document and open the intended beneficiary.
    await editBeneficiary.searchMainBeneficiaries(beneficiary.documentNumber);
    await editBeneficiary.openBeneficiaryByDocument(
      beneficiary.documentNumber,
    );
    await expect(editBeneficiary.form).toBeVisible();
    await expect(
      editBeneficiary.attendantName(attendantFullName),
    ).toBeVisible();
  });
});
