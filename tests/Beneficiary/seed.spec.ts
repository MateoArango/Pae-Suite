import { test, expect } from '../fixtures';
import { LoginPage } from '../pages/LoginPage';


test('Beneficiaries seed', async ({ page }) => {
const loginPage = new LoginPage(page);

await loginPage.goto('/auth/login?returnUrl=%2Fbeneficiaries');
await loginPage.fillValidCredentials();
await loginPage.submitAndWaitForAuthentication();
await page.getByRole('button', { name: 'solo_dining' }).click();
await page.getByRole('heading', { name: 'Gabriela Fernanda Jiménez' }).click();
await page.getByRole('button', { name: 'Editar' }).click();
await page.getByRole('button', { name: 'Cancelar' }).click();
await page.getByRole('button', { name: 'Ver detalle acudiente titular' }).click();
await page.getByRole('button', { name: 'Editar' }).click();
await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
await page.getByText('Enrolados north_east').click();
await page.getByRole('button', { name: 'Abrir menú de acciones' }).click();
await page.getByRole('button', { name: 'Registro único' }).click();
await expect(page.getByText('Registrar estudiante')).toBeVisible();
await page.getByRole('button', { name: 'Cancelar' }).click();
await page.getByRole('button', { name: 'Registro masivo' }).click();
await expect(page.getByText('Registro masivo de')).toBeVisible();
await page.getByRole('button', { name: 'Seleccionar archivo' }).click();
await page.locator('input[type="file"]').setInputFiles('student-data-alright - 2 records.xlsx');
await page.getByRole('button', { name: 'Importar beneficiarios' }).click();
await page.getByRole('button', { name: 'Cerrar popup' }).click();
await expect(page.getByText('Total procesados')).toBeVisible();
await expect(page.getByText('Sin cambios')).toBeVisible();
await page.locator('button').filter({ hasText: 'Cerrar' }).click();
});
