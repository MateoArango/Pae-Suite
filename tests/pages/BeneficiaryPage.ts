import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class BeneficiaryPage extends BasePage {
  readonly actionsMenuButton: Locator;
  readonly bulkRegistrationButton: Locator;
  readonly bulkRegistrationPanel: Locator;
  readonly uploader: Locator;
  readonly fileInput: Locator;
  readonly importBeneficiariesButton: Locator;
  readonly totalProcessedLabel: Locator;
  readonly closeSummaryButton: Locator;
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly buttonBeneficiaries: Locator;


  constructor(page: Page) {
    super(page);
    this.actionsMenuButton = page.getByRole('button', {
      name: 'Abrir menú de acciones',
    });
    this.bulkRegistrationButton = page.getByRole('button', {
      name: 'Registro masivo',
    });
    this.bulkRegistrationPanel = page.getByText('Registro masivo de');
    this.uploader = page.locator(
      '[test-id="resgister-massive-upload-file-beneficiaries"]',
    );
    this.fileInput = this.uploader.locator('input[type="file"]');
    this.importBeneficiariesButton = page.locator(
      '[test-id="resgister-massive-import-beneficiaries"]',
    );
    this.totalProcessedLabel = page.getByText('Total procesados', {
      exact: true,
    });
    this.closeSummaryButton = page.locator(
      '[test-id="resgister-massive-cancel-beneficiaries"]',
    );
    this.searchButton = page.locator(
      '[test-id="interactive-searchbar-open-button"]',
    );
    this.searchInput = page.locator(
      '[test-id="interactive-searchbar-input"]',
    );

    this.buttonBeneficiaries = page.locator(
      '[test-id = "sidebar-nav-item-beneficiarios"]',
    );
  }

  async openBulkRegistration(): Promise<void> {
    await this.actionsMenuButton.click();
    await this.bulkRegistrationButton.click();
  }

  async uploadWorkbook(workbookPath: string): Promise<void> {
    await this.fileInput.setInputFiles(workbookPath);
  }

  async searchByDocument(documentNumber: string): Promise<void> {
    await this.searchButton.click();
    await this.searchInput.fill(documentNumber);
    await this.searchInput.press('Enter');
  }
}
