import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EditBeneficiaryPage extends BasePage {
  readonly form: Locator;
  readonly mainBeneficiarySearchInputLens: Locator;
  readonly mainBeneficiarySearchInput: Locator;
  readonly closeDialogButton: Locator;
  readonly enableEditButton: Locator;
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
    this.enableEditButton = this.form.getByTestId(
      'form-beneficiaries-enable-edit-beneficiaries',
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
