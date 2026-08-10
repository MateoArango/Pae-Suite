// spec: specs/beneficiaries.plan.md
// seed: tests/Beneficiary/seed.spec.ts

import { randomInt } from "node:crypto";
import { Page } from "@playwright/test";
import { test, expect } from "../../fixtures";
import { AttendantFormPage } from "../../pages/AttendantFormPage";
import {
  BeneficiaryRequiredData,
  BeneficiarySingleForm,
} from "../../pages/BeneficiarySingleFormPage";
import { EditBeneficiaryPage } from "../../pages/EditBeneficiaryPage";
import { LoginPage } from "../../pages/LoginPage";
import { generateGovernmentId } from "../../utils/generateGovernmentId";

async function createBeneficiary(
  page: Page,
  beneficiaryForm: BeneficiarySingleForm,
  data: BeneficiaryRequiredData,
): Promise<void> {
  await beneficiaryForm.openSingleRegistration();
  await beneficiaryForm.fillRequiredFields(data);

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
    beneficiaryForm.successToast(data.firstName, data.firstLastName),
  ).toBeVisible();
}

test.describe("Shared attendant relationships", () => {
  test("ATT-SINGLE-005 — Link one attendant to multiple beneficiaries", async ({
    page,
  }) => {

    const runSuffix = randomInt(100_000, 1_000_000).toString();
    const beneficiaryOneFirstName = "Sharedone";
    const beneficiaryOneLastName = `Automation${runSuffix}`;
    const beneficiaryOneFullName = `${beneficiaryOneFirstName} ${beneficiaryOneLastName}`;
    const beneficiaryTwoFirstName = "Sharedtwo";
    const beneficiaryTwoLastName = `Automation${runSuffix}`;
    const beneficiaryTwoFullName = `${beneficiaryTwoFirstName} ${beneficiaryTwoLastName}`;
    const attendantFirstName = "Sharedattendant";
    const attendantLastName = `Automation${runSuffix}`;
    const attendantFullName = `${attendantFirstName} ${attendantLastName}`;
    const beneficiaryNames = [beneficiaryOneFullName, beneficiaryTwoFullName];
    const loginPage = new LoginPage(page);
    const beneficiaryForm = new BeneficiarySingleForm(page);
    const attendantForm = new AttendantFormPage(page);
    const editBeneficiary = new EditBeneficiaryPage(page);
    let dismissImproveProcessPopupPromise: Promise<void> | undefined;
    const dismissImproveProcessPopupOnce = (): Promise<void> =>
      (dismissImproveProcessPopupPromise ??=
        loginPage.dismissFeedbackPopupImproveProcess());

    let attendantCreationRequestCount = 0;

    page.on("request", (request) => {
      if (
        attendantForm.isCreateAttendantCall(request.url(), request.method())
      ) {
        attendantCreationRequestCount += 1;
      }
    });

    // Authenticate and open Beneficiarios.
    await loginPage.goto("/auth/login");
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === "/dashboard");
    await loginPage.dismissFeedbackPopup();
    await beneficiaryForm.buttonBeneficiaries.click();
    await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");

    // 1. Create one unique attendant using the first existing beneficiary.
    await attendantForm.openAttendantsPanel();
    await attendantForm.openCreateForm();
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
    await attendantForm.selectFirstBeneficiary();
    await attendantForm.confirmBeneficiarySelection();

    const attendantCreationResponsePromise = page.waitForResponse((response) =>
      attendantForm.isCreateAttendantCall(
        response.url(),
        response.request().method(),
      ),
    );
    await attendantForm.save();
    const attendantCreationResponse = await attendantCreationResponsePromise;

    expect(attendantCreationResponse.status()).toBe(201);
    expect(attendantCreationRequestCount).toBe(1);
    await expect(attendantForm.successToast).toBeVisible();
    await expect(attendantForm.form).toBeHidden();

    // 2. Create two new beneficiaries with randomized names.
    await createBeneficiary(page, beneficiaryForm, {
      firstName: beneficiaryOneFirstName,
      firstLastName: beneficiaryOneLastName,
      documentType: "Cédula de Ciudadanía",
      documentNumber: generateGovernmentId(),
      academicGrade: "Quinto",
      group: "a",
      populationType: "No aplica",
    });
    await dismissImproveProcessPopupOnce();
    await createBeneficiary(page, beneficiaryForm, {
      firstName: beneficiaryTwoFirstName,
      firstLastName: beneficiaryTwoLastName,
      documentType: "Cédula de Ciudadanía",
      documentNumber: generateGovernmentId(),
      academicGrade: "Quinto",
      group: "b",
      populationType: "No aplica",
    });
    await dismissImproveProcessPopupOnce();

    // 3. Reuse the existing attendant from each new beneficiary's edit form.
    for (const beneficiaryName of beneficiaryNames) {
      await editBeneficiary.searchMainBeneficiaries(beneficiaryName);
      await editBeneficiary.openBeneficiary(beneficiaryName);
      await expect(editBeneficiary.form).toBeVisible();
      await editBeneficiary.associateAttendant(attendantFullName);
      await expect(editBeneficiary.updateSuccessToast).toBeVisible();
      await editBeneficiary.close();
      await expect(editBeneficiary.form).toBeHidden();
    }

    // 4. Reopen both new beneficiaries and verify the shared attendant.
    for (const beneficiaryName of beneficiaryNames) {
      await editBeneficiary.searchMainBeneficiaries(beneficiaryName);
      await editBeneficiary.openBeneficiary(beneficiaryName);
      await expect(editBeneficiary.form).toBeVisible();
      await expect(
        editBeneficiary.attendantName(attendantFullName),
      ).toBeVisible();
      await editBeneficiary.openPrimaryAttendantDetail();
      await expect(editBeneficiary.attendantDetailTitle).toBeVisible();
      await expect(
        page.getByText(attendantFullName, { exact: true }),
      ).toBeVisible();
      await editBeneficiary.closeAttendantDetail();
      await expect(editBeneficiary.attendantDetailTitle).toBeHidden();
      await editBeneficiary.close();
      await expect(editBeneficiary.form).toBeHidden();
    }

    expect(attendantCreationRequestCount).toBe(1);
  });
});
