# Beneficiarios Test Plan

## Application Overview

Validate the three primary Beneficiarios creation paths in PAE: bulk import from a workbook, single-beneficiary registration, and single-attendant registration. Each scenario starts from an authenticated, fresh browser context with deterministic QA data and must clean up or use unique document numbers so scenarios can run independently and in any order. The existing seed establishes login and navigation but also performs a real import; generators should refactor it into a lightweight setup before automating these scenarios.

## Test Scenarios

### 1. Bulk beneficiary import

**Seed:** `tests/Beneficiary/seed.spec.ts`

#### 1.1. BEN-BULK-001 — Import a valid workbook successfully - ✅

**File:** `tests/Beneficiary/importation/bulk-import-valid-workbook.spec.ts`

**Steps:**
  1. From Beneficiarios, open the actions menu and select Registro masivo.
    - expect: The bulk-registration panel is visible and offers a file selector.
  2. Upload a valid workbook containing unique beneficiary and attendant data.
    - expect: The selected filename is shown and Importar beneficiarios becomes available.
  3. Start the import and wait for the import request and processing result.
    - expect: Processing completes without a page crash or duplicate submission.
  4. Dismiss the optional feedback popup if it appears.
    - expect: The processing summary remains usable.
  5. Review the processing summary.
    - expect: Total procesados matches the workbook rows, successful rows are reported correctly, and no unexpected validation errors appear.
  6. Close the summary and search for one imported document number.
    - expect: The imported beneficiary is present with the expected enrollment state and core data.

#### 1.2. BEN-BULK-002 — Reject unsupported file type - ✅

**File:** `tests/Beneficiary/importation/bulk-import-unsupported-file.spec.ts`

**Steps:**
  1. Open Registro masivo and attempt to choose a non-spreadsheet file.
    - expect: The file is rejected or Importar beneficiarios remains unavailable.
  2. Observe the validation feedback.
    - expect: A clear supported-format message is shown and no import request is sent.

#### 1.3. BEN-BULK-003 — Report a missing required field - ✅

**File:** `tests/Beneficiary/importation/bulk-import-missing-required-field.spec.ts`

**Steps:**
  1. Upload a workbook where one row omits the required `grado` value.
    - expect: The workbook is accepted and Importar beneficiarios becomes available.
  2. Start the import.
    - expect: The result reports `Missing required field: grado` for the malformed row.
  3. Close the summary and search for document `521643231`.
    - expect: `No se encontraron beneficiarios que coincidan con los filtros` confirms the malformed row was not imported.

#### 1.4. BEN-BULK-004 — Report row-level invalid values - ✅

**File:** `tests/Beneficiary/importation/bulk-import-mixed-results.spec.ts`

**Steps:**
  1. Upload a workbook containing valid rows and five rows with missing required values.
    - expect: The workbook is accepted for validation.
  2. Start the import and wait for completion.
    - expect: Total procesados is 6, Errores is 5, and each missing-field report is visible in Detalle de novedades.
  3. Search for documents `65869700` and `11510266`.
    - expect: The valid record is present and the malformed record returns the no-matching-beneficiaries message.

#### 1.5. BEN-BULK-005 — Apply the last row for a repeated document ✅

**File:** `tests/Beneficiary/importation/bulk-import-duplicates.spec.ts`

**Steps:**
  1. Upload `student-data-alright - repeated - attendant  - x2 - repeated-update-verify.xlsx`, containing two rows with document `4466443`.
    - expect: The file is accepted for validation.
  2. Start the import.
    - expect: The rows are processed and the last row overwrites the earlier values. The missing repeated-key warning is recorded as a product gap in `next improvements.md`.
  3. Search for document `4466443`.
    - expect: Only one beneficiary record is present and its updated name is `Brad Pitt`.

#### 1.6. BEN-BULK-006 — Cancel bulk registration without importing ✅

**File:** `tests/Beneficiary/importation/bulk-import-cancel.spec.ts`

**Steps:**
  1. Open Registro masivo and select a valid workbook.
    - expect: The file is displayed but processing has not started.
  2. Close or cancel the panel before importing.
    - expect: The panel closes and no import request is sent.
  3. Reopen Registro masivo.
    - expect: The previous file selection and transient validation state are cleared.
  4. Repeat the import with the same workbook.
    - expect: The uploaded msg 'Completado' is displayed.

#### 1.7. BEN-BULK-007 — Import 300 valid records successfully ✅

**File:** `tests/Beneficiary/importation/bulk-import-300-records.spec.ts`

**Steps:**
  1. From Beneficiarios, open Registro masivo and upload the valid 300-record workbook.
    - expect: The selected filename is shown and Importar beneficiarios becomes available.
  2. Submit the workbook and wait for `POST /v1.0/beneficiaries/bulk-load`.
    - expect: The request succeeds, `Total procesados` is `300`, and `Errores` is `0`.
  3. Search for 10 evenly distributed beneficiary documents, including the first and last workbook rows.
    - expect: Every search succeeds and displays the expected beneficiary name.

### 2. Single beneficiary registration

**Seed:** `tests/Beneficiary/seed.spec.ts`

#### 2.1. BEN-SINGLE-001 — Register one beneficiary with valid required data - ✅

**File:** `tests/Beneficiary/register-single-beneficiary.spec.ts`

**Steps:**
  1. From Beneficiarios, open the actions menu and select Registro único.
    - expect: The Registrar estudiante form is visible.
  2. Complete all required personal and schooling fields using a unique document number and valid catalog selections.
    - expect: Each value is retained.
  3. Submit the form once and wait for the creation response.
    - expect: Exactly one successful creation request occurs and a clear success state is shown.
  4. Close the form and search by the new document number.
    - expect: The new beneficiary appears with the entered identity data and expected not enrolled status.

#### 2.2. BEN-SINGLE-002 — Validate required beneficiary fields - ✅

**File:** `tests/Beneficiary/register-beneficiary-required-fields.spec.ts`

**Steps:**
  1. Open Registrar estudiante and submit without entering data.
    - expect: No creation request is sent and every required field exposes associated validation feedback.
  2. Complete one required field and submit again.
    - expect: Completed fields keep their values and only unresolved requirements remain invalid.
  3. Use keyboard navigation through invalid fields.
    - expect: Focus is visible and reaches the first invalid field in a logical order. Fill one required field and verify his validation state is cleared.

#### 2.3. BEN-SINGLE-003 — Prevent duplicate beneficiary document - ✅

**File:** `tests/Beneficiary/register-duplicate-beneficiary.spec.ts`

**Steps:**
  1. Open Registrar estudiante and enter valid data using the document number of an existing beneficiary.
    - expect: The form accepts input but does not alter the existing record.
  2. Submit the form.
    - expect: Creation is rejected with a clear duplicate-document message and no second record is created.

#### 2.4. BEN-SINGLE-004 — Validate document format and stale data - ✅

**File:** `tests/Beneficiary/register-beneficiary-document-validation.spec.ts`

**Covered document rules:**
- CC accepts and retains numeric characters.
- CC removes non-numeric characters.
- NIUP accepts letters and numbers up to its 15-character limit.
- Changing NIUP to CC sanitizes stale alphanumeric data according to the CC rule.

**Steps:**
  1. Select NIUP and enter the alphanumeric value `QAutomationTeo123`.
    - expect: NIUP accepts letters and numbers while enforcing its 15-character boundary, resulting in `QAutomationTeo1`.
  2. Change the document type to Cédula de Ciudadanía.
    - expect: CC removes the stale letters and retains the valid numeric remainder, `1`.
  3. Enter `´´+´+` as the CC document and complete the remaining required fields.
    - expect: CC sanitizes the invalid characters to an empty, invalid field while the Save button remains enabled.
  4. Click Save with the invalid CC document.
    - expect: The form remains open, no creation request is sent, and no success toast appears.

#### 2.5. BEN-SINGLE-005 — Keep dependent schooling fields consistent  -- NO ❌

**File:** `tests/Beneficiary/register-beneficiary-dependent-fields.spec.ts`

**Steps:**
  1. Open Registrar estudiante and inspect schooling fields before choosing a grade or preceding catalog value.
    - expect: Dependent controls are disabled or empty until their prerequisites are selected.
  2. Select prerequisite values, then choose valid dependent values.
    - expect: Only compatible options are offered.
  3. Change an upstream selection.
    - expect: Incompatible downstream values are cleared and must be selected again before submission.

#### 2.6. BEN-SINGLE-006 — Cancel registration and handle the delayed feedback overlay — Partial

**File:** `tests/Beneficiary/register-beneficiary-cancel-and-overlay.spec.ts`

**Test cases:**
- `X closes without creating a beneficiary` — `test.fixme`; clicking X currently creates the beneficiary.
- `Cancelar closes without creating a beneficiary` — active regression coverage; Cancelar sends no creation request.

**Steps:**
  1. Open Registrar estudiante, enter unsaved values, and wait for the optional feedback overlay that may appear after login.
    - expect: If shown, the overlay can be dismissed through the Cerrar popup accessible button without losing the form state.
  2. Exercise Cancelar and X as separate behaviors.
    - expect: Cancelar closes the form without sending a creation request. X should do the same, but its expected-behavior test remains `fixme` while the known creation defect exists.
  3. Reopen Registrar estudiante.
    - expect: The form starts clean and no previous unsaved values remain.

### 3. Single attendant registration

**Seed:** `tests/Beneficiary/seed.spec.ts`

#### 3.1. ATT-SINGLE-001 — Register one attendant with valid data

**File:** `tests/Beneficiary/register-single-attendant.spec.ts`

**Steps:**
  1. Navigate through the single-registration flow to the attendant portion for a new or selected beneficiary, according to the product workflow.
    - expect: The attendant form is visible and clearly indicates the beneficiary being associated.
  2. Complete all required identity, relationship, and contact fields using a unique attendant document.
    - expect: Entered values and valid catalog selections are retained.
  3. Submit once and wait for the creation response.
    - expect: Exactly one successful request occurs and the relationship is saved.
  4. Open the beneficiary detail and Ver detalle acudiente titular.
    - expect: The new attendant and expected relationship data are displayed.

#### 3.2. ATT-SINGLE-002 — Validate required attendant fields

**File:** `tests/Beneficiary/register-attendant-required-fields.spec.ts`

**Steps:**
  1. Open the attendant form and submit it empty.
    - expect: No creation request is sent and required identity, relationship, and contact fields show associated feedback.
  2. Complete required fields incrementally.
    - expect: Resolved errors clear without erasing other entered values.

#### 3.3. ATT-SINGLE-003 — Validate attendant contact information

**File:** `tests/Beneficiary/register-attendant-contact-validation.spec.ts`

**Steps:**
  1. Enter malformed, whitespace-only, and boundary values in each available phone and email field.
    - expect: Invalid formats are rejected with field-specific feedback and valid boundary values are accepted.
  2. Attempt submission while a contact field is invalid.
    - expect: No creation request is sent and focus identifies the invalid control.

#### 3.4. ATT-SINGLE-004 — Prevent duplicate attendant association -- Just now it allows to update the beneficiary without notice about this decission to another attendant

**File:** `tests/Beneficiary/register-duplicate-attendant.spec.ts`

**Steps:**
  1. Attempt to register an attendant document already associated with the same beneficiary.
    - expect: The duplicate association is rejected or presented as an existing association according to the product rule.
  2. Open the beneficiary's attendant detail.
    - expect: Only one association exists and existing attendant data was not overwritten unexpectedly.

#### 3.5. ATT-SINGLE-005 — Define behavior when one attendant serves multiple beneficiaries

**File:** `tests/Beneficiary/register-shared-attendant.spec.ts`

**Steps:**
  1. Use an attendant document already associated with a different beneficiary and complete the relationship for the current beneficiary.
    - expect: The application follows the confirmed business rule: reuse/link the attendant or clearly reject the association without duplicating the person.
  2. Inspect both beneficiary details.
    - expect: Associations and attendant identity remain consistent with the confirmed rule.

#### 3.6. ATT-SINGLE-006 — Cancel attendant registration without partial data

**File:** `tests/Beneficiary/register-attendant-cancel.spec.ts`

**Steps:**
  1. Open the attendant form and enter unsaved values.
    - expect: The form remains editable and no creation request has occurred.
  2. Select Cancelar or close the form.
    - expect: The form closes and no attendant or relationship is partially created.
  3. Reopen the attendant workflow for the same beneficiary.
    - expect: The form is clean and the cancelled values are absent.
