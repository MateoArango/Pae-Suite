// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { randomInt } from "node:crypto";
import { test, expect } from "../../fixtures";
import { AttendantFormPage } from "../../pages/AttendantFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

test.describe("Single attendant registration", () => {
  test("ATT-SINGLE-007 — Register one attendant with three beneficiaries", async ({
    page,
  }) => {
    test.slow();

    const runSuffix = randomInt(100_000, 1_000_000).toString();
    const attendantFirstName = "Tripleattendant";
    const attendantLastName = `Automation${runSuffix}`;
    const attendantFullName = `${attendantFirstName} ${attendantLastName}`;
    const loginPage = new LoginPage(page);
    const attendantForm = new AttendantFormPage(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    let attendantCreationRequestCount = 0;

    page.on("request", (request) => {
      if (
        attendantForm.isCreateAttendantCall(request.url(), request.method())
      ) {
        attendantCreationRequestCount += 1;
      }
    });

    // 1. Create a fresh attendant with the first three visible beneficiaries.
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
      firstName: attendantFirstName,
      firstLastName: attendantLastName,
      phoneNumber: `3${randomInt(0, 1_000_000_000)
        .toString()
        .padStart(9, "0")}`,
    });
    await attendantForm.addBeneficiary();
    const selectedBeneficiaries =
      await attendantForm.selectFirstBeneficiariesAndGetDocuments(3);
    const beneficiaryDocuments = selectedBeneficiaries.map(
      ({ documentNumber }) => documentNumber,
    );

    expect(new Set(beneficiaryDocuments).size).toBe(3);
    await expect(attendantForm.confirmBeneficiarySelectionButton).toBeEnabled();
    await attendantForm.confirmBeneficiarySelection();

    const attendantCreationResponsePromise = page.waitForResponse((response) =>
      attendantForm.isCreateAttendantCall(
        response.url(),
        response.request().method(),
      ),
    );
    await attendantForm.save();
    const attendantCreationResponse = await attendantCreationResponsePromise;
    const attendantCreationBody: unknown =
      await attendantCreationResponse.json();

    expect(attendantCreationResponse.status()).toBe(201);
    expect(attendantCreationRequestCount).toBe(1);
    expect(attendantCreationBody).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ id: expect.any(Number) }),
        entity: "ScanServices",
        message: "Created",
      }),
    );
    await expect(attendantForm.successToast).toBeVisible();
    await expect(attendantForm.form).toBeHidden();

    // 2. Search each saved beneficiary and verify the attendant relationship.
    for (const beneficiary of selectedBeneficiaries) {
      await editBeneficiary.searchMainBeneficiaries(
        beneficiary.documentNumber,
      );
      await editBeneficiary.openBeneficiaryByDocument(
        beneficiary.documentNumber,
      );
      await expect(editBeneficiary.form).toBeVisible();
      await expect(
        editBeneficiary.attendantName(attendantFullName),
      ).toBeVisible();
      await editBeneficiary.close();
      await expect(editBeneficiary.form).toBeHidden();
    }

    // 3. Search Attendants and verify all three beneficiaries in its detail.
    await attendantForm.openAttendantsPanel();
    await attendantForm.searchAttendants(attendantFullName);
    const attendantItem = attendantForm.attendantItemByText(attendantFullName);
    await expect(attendantItem).toBeVisible();
    await attendantItem.click();
    await expect(attendantForm.attendantDetailTitle).toBeVisible();

    for (const beneficiaryDocument of beneficiaryDocuments) {
      await expect(
        attendantForm.form.getByText(beneficiaryDocument, { exact: false }),
      ).toBeVisible();
    }

    expect(attendantCreationRequestCount).toBe(1);
  });
});
