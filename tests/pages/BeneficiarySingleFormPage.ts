import { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export type BeneficiaryRequiredData = {
  firstName: string;
  firstLastName: string;
  documentType: string;
  documentNumber: string;
  academicGrade: string;
  group: string;
  populationType: string;
};

export class BeneficiarySingleForm extends BasePage {
  readonly form: Locator;
  readonly closeButton: Locator;
  readonly enrolmentButton: Locator;
  readonly firstNameInput: Locator;
  readonly secondNameInput: Locator;
  readonly firstLastNameInput: Locator;
  readonly secondLastNameInput: Locator;
  readonly documentTypeSelect: Locator;
  readonly documentNumberInput: Locator;
  readonly academicGradeSelect: Locator;
  readonly groupInput: Locator;
  readonly populationTypeSelect: Locator;
  readonly headerSaveButton: Locator;
  readonly desktopSaveButton: Locator;
  readonly cancelButton: Locator;
  readonly actionsMenuButton: Locator;
  readonly singleRecordButton: Locator;
  readonly buttonBeneficiaries: Locator;
  readonly searchButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);

    this.form = page.locator(
      '[test-id="form-beneficiaries-submit-beneficiaries"]',
    );
    this.closeButton = this.form.locator(
      '[test-id="form-beneficiaries-close-dialog-beneficiaries"]',
    );
    this.enrolmentButton = this.form.locator(
      '[test-id="form-beneficiaries-open-enrolment-beneficiaries"]',
    );
    this.firstNameInput = this.form.locator(
      '[test-id="form-beneficiaries-input-first-name-beneficiaries"]',
    );
    this.secondNameInput = this.form.locator(
      '[test-id="form-beneficiaries-input-second-name-beneficiaries"]',
    );
    this.firstLastNameInput = this.form.locator(
      '[test-id="form-beneficiaries-input-first-last-name-beneficiaries"]',
    );
    this.secondLastNameInput = this.form.locator(
      '[test-id="form-beneficiaries-input-second-last-name-beneficiaries"]',
    );
    this.documentTypeSelect = this.form.locator(
      '[test-id="form-beneficiaries-select-document-type-beneficiaries"]',
    );
    this.documentNumberInput = this.form.locator(
      '[test-id="form-beneficiaries-input-document-number-beneficiaries"]',
    );
    this.academicGradeSelect = this.form.locator(
      '[test-id="form-beneficiaries-select-academic-grade-beneficiaries"]',
    );
    this.groupInput = this.form.locator(
      '[test-id="form-beneficiaries-input-group-beneficiaries"]',
    );
    this.populationTypeSelect = this.form.locator(
      '[test-id="form-beneficiaries-select-population-type-beneficiaries"]',
    );
    this.headerSaveButton = this.form.locator(
      '[test-id="form-beneficiaries-save-header-new-beneficiaries"]',
    );
    this.desktopSaveButton = this.form.locator(
      '[test-id="form-beneficiaries-save-desktop-beneficiaries"]',
    );
    this.cancelButton = this.form.locator(
      '[test-id="form-beneficiaries-cancel-desktop-beneficiaries"]',
    );
    this.actionsMenuButton = page.getByRole('button', {
      name: 'Abrir menú de acciones',
    });
    this.singleRecordButton = page.getByRole('button', {
      name: 'Registro único',
    });
    this.buttonBeneficiaries = page.locator(
      '[test-id="sidebar-nav-item-beneficiarios"]',
    );
    this.searchButton = page.locator(
      '[test-id="interactive-searchbar-open-button"]',
    );
    this.searchInput = page.locator(
      '[test-id="interactive-searchbar-input"]',
    );
  }

  async openSingleRegistration(): Promise<void> {
    if (!(await this.singleRecordButton.isVisible())) {
      await this.actionsMenuButton.click();
    }

    await this.singleRecordButton.click();
  }

  private async selectOption(
    select: Locator,
    optionName: string,
  ): Promise<void> {
    await select.click();
    await this.page
      .getByRole('option', { name: optionName, exact: true })
      .click();
  }

  async selectDocumentType(documentType: string): Promise<void> {
    await this.selectOption(this.documentTypeSelect, documentType);
  }

  async selectAcademicGrade(academicGrade: string): Promise<void> {
    await this.selectOption(this.academicGradeSelect, academicGrade);
  }

  async selectPopulationType(populationType: string): Promise<void> {
    await this.selectOption(this.populationTypeSelect, populationType);
  }

  async fillRequiredFields(data: BeneficiaryRequiredData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.firstLastNameInput.fill(data.firstLastName);
    await this.selectDocumentType(data.documentType);
    await this.documentNumberInput.fill(data.documentNumber);
    await this.selectAcademicGrade(data.academicGrade);
    await this.groupInput.fill(data.group);
    await this.selectPopulationType(data.populationType);
  }

  isCreateBeneficiaryCall(url: string, method: string): boolean {
    return (
      method === 'POST' && new URL(url).pathname === '/v1.0/beneficiaries'
    );
  }

  successToast(firstName: string, firstLastName: string): Locator {
    return this.page.getByText(
      `Beneficiario ${firstName} ${firstLastName} creado exitosamente`,
      { exact: true },
    );
  }

  async searchByDocument(documentNumber: string): Promise<Response> {
    if (await this.searchButton.isVisible()) {
      await this.searchButton.click();
    }

    const responsePromise = this.page.waitForResponse((response) => {
      const requestUrl = new URL(response.url());

      return (
        response.request().method() === 'GET' &&
        requestUrl.pathname ===
          '/v1.0/beneficiaries/with-campuses-and-attendants' &&
        requestUrl.searchParams.get('searchBar') === documentNumber
      );
    });

    await this.searchInput.fill(documentNumber);
    await this.searchInput.press('Enter');

    return responsePromise;
  }

  async save(): Promise<void> {
    await this.desktopSaveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}
