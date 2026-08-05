import { Locator, Page, Response } from '@playwright/test';
import { BasePage } from './BasePage';

export class BeneficiaryBulkPage extends BasePage {
  readonly actionsMenuButton: Locator;
  readonly bulkRegistrationButton: Locator;
  readonly bulkRegistrationPanel: Locator;
  readonly uploader: Locator;
  readonly fileInput: Locator;
  readonly unsupportedFileError: Locator;
  readonly missingRequiredGradeError: Locator;
  readonly importBeneficiariesButton: Locator;
  readonly totalProcessedLabel: Locator;
  readonly errorsLabel: Locator;
  readonly importDetailsLabel: Locator;
  readonly closeSummaryButton: Locator;
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly noMatchingBeneficiariesMessage: Locator;
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
    this.uploader = page.getByTestId(
      'resgister-massive-upload-file-beneficiaries',
    );
    this.fileInput = this.uploader.locator('input[type="file"]');
    this.unsupportedFileError = page.getByText(
      'Solo se admiten archivos .xlsx.',
      { exact: true },
    );
    this.missingRequiredGradeError = page.locator('p').filter({
      hasText: 'Missing required field: grado',
    });
    this.importBeneficiariesButton = page.getByTestId(
      'resgister-massive-import-beneficiaries',
    );
    this.totalProcessedLabel = page.getByText('Total procesados', {
      exact: true,
    });
    this.errorsLabel = page.getByText('Errores', { exact: true });
    this.importDetailsLabel = page.getByText('Detalle de novedades', {
      exact: true,
    });
    this.closeSummaryButton = page.getByTestId(
      'resgister-massive-cancel-beneficiaries',
    );
    this.searchButton = page.getByTestId('interactive-searchbar-open-button');
    this.searchInput = page.getByTestId('interactive-searchbar-input');
    this.noMatchingBeneficiariesMessage = page.getByText(
      'No se encontraron beneficiarios que coincidan con los filtros',
      { exact: true },
    );

    this.buttonBeneficiaries = page.getByTestId(
      'sidebar-nav-item-beneficiarios',
    );
  }

  async openBulkRegistration(): Promise<void> {
    if (!(await this.bulkRegistrationButton.isVisible())) {
      await this.actionsMenuButton.click();
    }

    await this.bulkRegistrationButton.click();
  }

  async uploadWorkbook(workbookPath: string): Promise<void> {
    await this.fileInput.setInputFiles(workbookPath);
  }

  isBulkImportCall(url: string, method: string): boolean {
    return (
      method === 'POST' &&
      new URL(url).pathname === '/v1.0/beneficiaries/bulk-load'
    );
  }

  isBeneficiarySearchCall(
    url: string,
    method: string,
    documentNumber: string,
  ): boolean {
    const requestUrl = new URL(url);

    return (
      method === 'GET' &&
      requestUrl.pathname ===
        '/v1.0/beneficiaries/with-campuses-and-attendants' &&
      requestUrl.searchParams.get('searchBar') === documentNumber
    );
  }

  bulkImportError(message: string): Locator {
    return this.page.locator('p').filter({ hasText: message });
  }

  async searchByDocument(documentNumber: string): Promise<Response> {
    if (await this.searchButton.isVisible()) {
      await this.searchButton.click();
    }

    const searchResponsePromise = this.page.waitForResponse((response) =>
      this.isBeneficiarySearchCall(
        response.url(),
        response.request().method(),
        documentNumber,
      ),
    );

    await this.searchInput.fill(documentNumber);
    await this.searchInput.press('Enter');

    return searchResponsePromise;
  }
}
