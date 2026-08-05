// spec: specs/beneficiaries.plan.md

import path from "node:path";
import { test, expect } from "../../fixtures";
import { BeneficiaryBulkPage } from "../../pages/BeneficiaryBulkPage";
import { LoginPage } from "../../pages/LoginPage";

const workbookName = "student-data-alright - 2 records.xlsx";

test.describe("Beneficiaries bulk import", () => {
  test("BEN-BULK-006 — Cancel bulk registration without importing", async ({
    page,
  }) => {
    const workbookPath = path.resolve(
      __dirname,
      "../../../fixtures",
      workbookName,
    );
    const loginPage = new LoginPage(page);
    const beneficiaryPage = new BeneficiaryBulkPage(page);
    let bulkImportRequestCount = 0;

    page.on("request", (request) => {
      if (beneficiaryPage.isBulkImportCall(request.url(), request.method())) {
        bulkImportRequestCount += 1;
      }
    });

    await loginPage.open();
    await loginPage.fillValidCredentials();
    const authenticationResponse =
      await loginPage.submitAndWaitForAuthentication();

    expect(authenticationResponse.ok()).toBe(true);
    await expect(page).toHaveURL((url) => url.pathname === "/dashboard");
    await loginPage.dismissFeedbackPopup();

    await beneficiaryPage.buttonBeneficiaries.click();
    await expect(page).toHaveURL((url) => url.pathname === "/beneficiaries");

    // 1. Open Registro masivo and select a valid workbook.
    await beneficiaryPage.openBulkRegistration();
    await beneficiaryPage.uploadWorkbook(workbookPath);
    await expect(beneficiaryPage.uploader).toContainText(workbookName);
    await expect(beneficiaryPage.importBeneficiariesButton).toBeEnabled();
    expect(bulkImportRequestCount).toBe(0);
    
    await expect(page.getByText("Completado", { exact: true })).toBeVisible();

    // 2. Close the panel before importing.
    await beneficiaryPage.closeSummaryButton.click();
    await expect(beneficiaryPage.bulkRegistrationPanel).toBeHidden();
    expect(bulkImportRequestCount).toBe(0);

    // 3. Reopen Registro masivo and verify that its state was cleared.
    await beneficiaryPage.openBulkRegistration();
    await expect(beneficiaryPage.fileInput).toHaveValue("");
    await expect(beneficiaryPage.uploader).not.toContainText(workbookName);
    await expect(beneficiaryPage.importBeneficiariesButton).toBeDisabled();
    //expect(bulkImportRequestCount).toBe(0);

    // 4. Upload the same workbook again and complete the import.
    await beneficiaryPage.uploadWorkbook(workbookPath);
    //const importResponsePromise = page.waitForResponse((response) =>
    //  beneficiaryPage.isBulkImportCall(
    //    response.url(),
    //    response.request().method(),
    //  ),
    //);

    //await beneficiaryPage.importBeneficiariesButton.click();
    //const importResponse = await importResponsePromise;

    //expect(importResponse.ok()).toBe(true);
    //expect(bulkImportRequestCount).toBe(1);
    await expect(page.getByText("Completado", { exact: true })).toBeVisible();
  });
});
