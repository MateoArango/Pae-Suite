import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EditBeneficiaryPage extends BasePage {
  readonly form: Locator;
  readonly mainBeneficiarySearchInputLens: Locator;
  readonly mainBeneficiarySearchInput: Locator;
  readonly closeDialogButton: Locator;
  readonly saveHeaderButton: Locator;
  readonly enableEditButton: Locator;
  readonly firstNameInput: Locator;
  readonly secondNameInput: Locator;
  readonly firstLastNameInput: Locator;
  readonly secondLastNameInput: Locator;
  readonly documentTypeSelect: Locator;
  readonly documentNumberInput: Locator;
  readonly academicGradeSelect: Locator;
  readonly groupInput: Locator;
  readonly populationTypeSelect: Locator;
  readonly deleteBeneficiaryButton: Locator;
  readonly cancelFooterButton: Locator;
  readonly saveFooterButton: Locator;
  readonly openAddAttendantButton: Locator;
  readonly attendantSearchInput: Locator;
  readonly saveAttendantSelectionButton: Locator;
  readonly removePrimaryAttendantButton: Locator;
  readonly openPrimaryAttendantDetailButton: Locator;
  readonly attendantDetailTitle: Locator;
  readonly closeAttendantDetailButton: Locator;
  readonly updateSuccessToast: Locator;

  constructor(page: Page) {
    super(page);

    this.form = page.getByTestId('form-beneficiaries-submit-beneficiaries');
    this.mainBeneficiarySearchInputLens = page.getByTestId(
      'students-tab-search-beneficiaries',
    );
    this.mainBeneficiarySearchInput = page.getByTestId(
      'interactive-searchbar-input',
    );
    this.closeDialogButton = this.form.getByTestId(
      'form-beneficiaries-close-dialog-beneficiaries',
    );
    this.saveHeaderButton = this.form.getByTestId(
      'form-beneficiaries-save-header-edit-beneficiaries',
    );
    this.enableEditButton = this.form.getByTestId(
      'form-beneficiaries-enable-edit-beneficiaries',
    );
    this.firstNameInput = this.form.getByTestId(
      'form-beneficiaries-input-first-name-beneficiaries',
    );
    this.secondNameInput = this.form.getByTestId(
      'form-beneficiaries-input-second-name-beneficiaries',
    );
    this.firstLastNameInput = this.form.getByTestId(
      'form-beneficiaries-input-first-last-name-beneficiaries',
    );
    this.secondLastNameInput = this.form.getByTestId(
      'form-beneficiaries-input-second-last-name-beneficiaries',
    );
    this.documentTypeSelect = this.form.getByTestId(
      'form-beneficiaries-select-document-type-beneficiaries',
    );
    this.documentNumberInput = this.form.getByTestId(
      'form-beneficiaries-input-document-number-beneficiaries',
    );
    this.academicGradeSelect = this.form.getByTestId(
      'form-beneficiaries-select-academic-grade-beneficiaries',
    );
    this.groupInput = this.form.getByTestId(
      'form-beneficiaries-input-group-beneficiaries',
    );
    this.populationTypeSelect = this.form.getByTestId(
      'form-beneficiaries-select-population-type-beneficiaries',
    );
    this.deleteBeneficiaryButton = this.form.getByTestId(
      'form-beneficiaries-delete-beneficiary-beneficiaries',
    );
    this.cancelFooterButton = this.form.getByTestId(
      'form-beneficiaries-cancel-footer-beneficiaries',
    );
    this.saveFooterButton = this.form.getByTestId(
      'form-beneficiaries-save-footer-beneficiaries',
    );
    this.openAddAttendantButton = this.form.getByTestId(
      'form-beneficiaries-open-add-attendant-beneficiaries',
    );
    this.attendantSearchInput = this.form.getByTestId(
      'selected-attendants-search-beneficiaries',
    );
    this.saveAttendantSelectionButton = this.form.getByTestId(
      'form-beneficiaries-save-attendant-selection-beneficiaries',
    );
    this.removePrimaryAttendantButton = this.form.getByTestId(
      'form-beneficiaries-remove-attendant-titular-beneficiaries',
    );
    this.openPrimaryAttendantDetailButton = this.form.getByTestId(
      'form-beneficiaries-open-attendant-titular-beneficiaries',
    );
    this.attendantDetailTitle = page.getByText('Detalle acudiente', {
      exact: true,
    });
    this.closeAttendantDetailButton = page.getByRole('button', {
      name: 'Cerrar',
      exact: true,
    });
    this.updateSuccessToast = page.getByText(
      'El estudiante ha sido actualizado correctamente.',
      { exact: true },
    );
  }

  beneficiaryRecord(beneficiaryName: string): Locator {
    return this.page.getByRole('heading', {
      name: beneficiaryName,
      exact: true,
    });
  }

  deletionSuccessToast(beneficiaryName: string): Locator {
    return this.page.getByText(
      `El estudiante ${beneficiaryName} ha sido eliminado correctamente`,
      { exact: true },
    );
  }

  attendantOption(attendantName: string): Locator {
    return this.form.getByText(attendantName, { exact: true });
  }

  attendantName(attendantName: string): Locator {
    return this.form.getByText(attendantName, { exact: true });
  }

  async searchMainBeneficiaries(searchTerm: string): Promise<void> {
    if (!(await this.mainBeneficiarySearchInput.isVisible())) {
      await this.mainBeneficiarySearchInputLens.click();
    }

    await this.mainBeneficiarySearchInput.fill(searchTerm);
    await this.mainBeneficiarySearchInput.press('Enter');
  }

  async openBeneficiary(beneficiaryName: string): Promise<void> {
    await this.beneficiaryRecord(beneficiaryName).click();
  }

  async openBeneficiaryByDocument(documentNumber: string): Promise<void> {
    await this.page.getByText(documentNumber, { exact: false }).click();
  }

  async associateAttendant(attendantName: string): Promise<void> {
    await this.openAddAttendantButton.click();
    await this.attendantSearchInput.fill(attendantName);
    await this.attendantOption(attendantName).click();
    await this.saveAttendantSelectionButton.click();
  }

  async openPrimaryAttendantDetail(): Promise<void> {
    await this.openPrimaryAttendantDetailButton.click();
  }

  async closeAttendantDetail(): Promise<void> {
    await this.closeAttendantDetailButton.click();
  }

  async close(): Promise<void> {
    await this.closeDialogButton.click();
  }
}
