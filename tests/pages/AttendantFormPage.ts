import { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export type AttendantPersonalData = {
  documentType: string;
  documentNumber: string;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  phoneNumber: string;
  email?: string;
};

export class AttendantFormPage extends BasePage {
  readonly attendantsTabButton: Locator;
  readonly beneficiariesNavigationButton: Locator;
  readonly panelCloseButton: Locator;
  readonly openCreateAttendantButton: Locator;
  readonly panelSearchInput: Locator;
  readonly attendantItems: Locator;
  readonly mainBeneficiarySearchInput: Locator;
  readonly mainBeneficiarySearchInputLens: Locator;
  readonly beneficiaryDetailTitle: Locator;
  readonly beneficiaryAttendantRole: Locator;
  readonly form: Locator;
  readonly formTitle: Locator;
  readonly closeButton: Locator;
  readonly addBeneficiaryCard: Locator;
  readonly beneficiarySearchButton: Locator;
  readonly beneficiarySearchInput: Locator;
  readonly confirmBeneficiarySelectionButton: Locator;
  readonly saveButton: Locator;
  readonly documentTypeSelect: Locator;
  readonly documentNumberInput: Locator;
  readonly firstNameInput: Locator;
  readonly secondNameInput: Locator;
  readonly firstLastNameInput: Locator;
  readonly secondLastNameInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly emailInput: Locator;
  readonly missingBeneficiaryFeedback: Locator;
  readonly requiredFieldsToast: Locator;
  readonly saveErrorToast: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    super(page);

    this.attendantsTabButton = page.getByTestId(
      "students-tab-open-attendants-beneficiaries",
    );
    this.beneficiariesNavigationButton = page.getByTestId(
      "sidebar-nav-item-beneficiarios",
    );
    this.panelCloseButton = page.getByTestId(
      "attendants-rail-panel-close-beneficiaries",
    );
    this.openCreateAttendantButton = page.getByTestId(
      "attendants-rail-panel-open-create-attendant-beneficiaries",
    );
    this.panelSearchInput = page.getByTestId(
      "attendants-rail-panel-search-beneficiaries",
    );
    this.attendantItems = page.locator(
      '[test-id^="attendants-rail-panel-open-attendant-beneficiaries-"]',
    );
    this.mainBeneficiarySearchInput = page.getByTestId(
      "interactive-searchbar-input",
    );
    this.mainBeneficiarySearchInputLens = page.getByTestId("students-tab-search-beneficiaries");
    this.beneficiaryDetailTitle = page.getByText("Detalle beneficiario", {
      exact: true,
    });
    this.beneficiaryAttendantRole = page.getByText("Titular", { exact: true });

    this.form = page.getByTestId("attendants-form-root");
    this.formTitle = this.form.getByText("Registrar acudiente", {
      exact: true,
    });
    this.closeButton = this.form.getByTestId("attendants-form-close-button");
    this.addBeneficiaryCard = this.form.getByTestId(
      "attendants-form-add-beneficiary-card",
    );
    this.beneficiarySearchButton = this.form.getByTestId(
      "attendants-beneficiaries-search-button",
    );
    this.beneficiarySearchInput = this.form.getByTestId(
      "attendants-beneficiaries-search-input",
    );
    this.confirmBeneficiarySelectionButton = this.form.getByTestId(
      "attendants-form-confirm-beneficiary-selection-button",
    );
    this.saveButton = this.form.getByTestId("attendants-form-save-button");

    // These controls do not expose test-id yet, so they are scoped to the
    // stable form root and selected by their observed form-control names.
    this.documentTypeSelect = this.form.locator('[name="documentType"]');
    this.documentNumberInput = this.form.locator('[name="documentNumber"]');
    this.firstNameInput = this.form.locator('[name="firstName"]');
    this.secondNameInput = this.form.locator('[name="secondName"]');
    this.firstLastNameInput = this.form.locator('[name="firstLastName"]');
    this.secondLastNameInput = this.form.locator('[name="secondLastName"]');
    this.phoneNumberInput = this.form.locator('[name="phoneNumber"]');
    this.emailInput = this.form.locator('[name="email"]');
    this.missingBeneficiaryFeedback = this.form.getByText(
      "Debes asociar al menos un estudiante antes de guardar.",
      { exact: true },
    );
    this.requiredFieldsToast = page.getByText(
      "Por favor complete todos los campos obligatorios.",
      { exact: true },
    );
    this.saveErrorToast = page.getByText(
      "Error al guardar el acudiente. Intenta nuevamente.",
      { exact: true },
    );
    this.successToast = page.getByText("Acudiente agregado correctamente.", {
      exact: true,
    });
  }

  attendantItem(attendantId: number | string): Locator {
    return this.page.getByTestId(
      `attendants-rail-panel-open-attendant-beneficiaries-${attendantId}`,
    );
  }

  beneficiaryRow(beneficiaryId: number | string): Locator {
    return this.form.getByTestId(
      `attendants-beneficiaries-row-${beneficiaryId}`,
    );
  }

  beneficiaryCheckbox(beneficiaryId: number | string): Locator {
    return this.form.getByTestId(
      `attendants-beneficiaries-checkbox-${beneficiaryId}`,
    );
  }

  attendantItemByText(text: string): Locator {
    return this.attendantItems.filter({ hasText: text });
  }

  isCreateAttendantCall(url: string, method: string): boolean {
    return method === "POST" && new URL(url).pathname === "/v1.0/attendants";
  }

  requiredFieldContainer(control: Locator): Locator {
    return control.locator("xpath=ancestor::mat-form-field");
  }

  async openAttendantsPanel(): Promise<void> {
    await this.attendantsTabButton.click();
  }

  async openBeneficiaries(): Promise<void> {
    await this.beneficiariesNavigationButton.click();
  }

  async closeAttendantsPanel(): Promise<void> {
    await this.panelCloseButton.click();
  }

  async openCreateForm(): Promise<void> {
    await this.openCreateAttendantButton.click();
  }

  async searchAttendants(searchTerm: string): Promise<void> {
    await this.panelSearchInput.fill(searchTerm);
  }

  async openAttendant(attendantId: number | string): Promise<void> {
    await this.attendantItem(attendantId).click();
  }

  async searchMainBeneficiaries(searchTerm: string): Promise<void> {
    await this.mainBeneficiarySearchInputLens.click();
    await this.mainBeneficiarySearchInput.fill(searchTerm);
  }

  async openBeneficiaryDetailByName(beneficiaryName: string): Promise<void> {
    await this.page.getByText(beneficiaryName, { exact: true }).first().click();
  }

  private async selectOption(
    select: Locator,
    optionName: string,
  ): Promise<void> {
    const option = this.page.getByRole("option", {
      name: optionName,
      exact: true,
    });

    await select.click();

    try {
      await option.waitFor({ state: "visible", timeout: 5_000 });
    } catch {
      await select.press("Space");
      await option.waitFor({ state: "visible" });
    }

    await option.click();
  }

  async selectDocumentType(documentType: string): Promise<void> {
    await this.selectOption(this.documentTypeSelect, documentType);
  }

  async fillPersonalData(data: AttendantPersonalData): Promise<void> {
    await this.selectDocumentType(data.documentType);
    await this.documentNumberInput.fill(data.documentNumber);
    await this.firstNameInput.fill(data.firstName);
    await this.secondNameInput.fill(data.secondName ?? "");
    await this.firstLastNameInput.fill(data.firstLastName);
    await this.secondLastNameInput.fill(data.secondLastName ?? "");
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.emailInput.fill(data.email ?? "");
  }

  async addBeneficiary(): Promise<void> {
    await this.addBeneficiaryCard.click();
  }

  async searchBeneficiaries(searchTerm: string): Promise<void> {
    if (!(await this.beneficiarySearchInput.isVisible())) {
      await this.beneficiarySearchButton.click();
    }

    await this.beneficiarySearchInput.fill(searchTerm);
  }

  async selectBeneficiary(beneficiaryId: number | string): Promise<void> {
    await this.beneficiaryCheckbox(beneficiaryId).click();
  }

  async selectFirstBeneficiary(): Promise<void> {
    await this.form
      .locator('[test-id^="attendants-beneficiaries-checkbox-"]')
      .first()
      .click();
  }

  async selectFirstBeneficiaryAndGetName(): Promise<string> {
    const firstBeneficiaryCheckbox = this.form
      .locator('[test-id^="attendants-beneficiaries-checkbox-"]')
      .first();
    const checkboxTestId =
      await firstBeneficiaryCheckbox.getAttribute("test-id");
    const beneficiaryId = checkboxTestId?.replace(
      "attendants-beneficiaries-checkbox-",
      "",
    );

    if (!beneficiaryId) {
      throw new Error("The first beneficiary checkbox has no beneficiary ID.");
    }

    const beneficiaryRowText =
      await this.beneficiaryRow(beneficiaryId).innerText();
    const beneficiaryName = beneficiaryRowText
      .split("\n")
      .map((value) => value.trim())
      // The first row label is the beneficiary's one-letter avatar (for
      // example, "T"). Skip it and capture the first substantive label.
      .find((value) => value.length > 1);

    if (!beneficiaryName) {
      throw new Error("The first beneficiary row has no visible name.");
    }

    await firstBeneficiaryCheckbox.click();
    return beneficiaryName;
  }

  async confirmBeneficiarySelection(): Promise<void> {
    await this.confirmBeneficiarySelectionButton.click();
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}
