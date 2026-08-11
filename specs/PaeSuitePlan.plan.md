# PaeSuitePlan

## Application Overview

`PaeSuitePlan` is the central test plan for all automated PAE workflows. It organizes coverage by application feature and records each scenario's identifier, purpose, setup, steps, expected results, implementation file, and current status. Tests should start from a controlled state, use deterministic or unique QA data, avoid dependencies on execution order, and verify both visible behavior and relevant network contracts. Feature-specific setup, shared-data risks, known product gaps, and execution limitations must be documented in their corresponding sections. Existing seeds should remain lightweight and prepare only the authentication, navigation, permissions, and data required by each workflow.

## Test Scenarios

### 1. Bulk beneficiary import

**Seed:** `tests/Beneficiary/seed.spec.ts`

#### 1.1. BEN-BULK-001 — Import a valid workbook successfully - ✅

**File:** `tests/Beneficiary/importation/bulk-import-valid-workbook.spec.ts`

**Steps:**

1. From Beneficiarios, open the actions menu and select Registro masivo. - expect: The bulk-registration panel is visible and offers a file selector.
2. Upload a valid workbook containing unique beneficiary and attendant data. - expect: The selected filename is shown and Importar beneficiarios becomes available.
3. Start the import and wait for the import request and processing result. - expect: Processing completes without a page crash or duplicate submission.
4. Dismiss the optional feedback popup if it appears. - expect: The processing summary remains usable.
5. Review the processing summary. - expect: Total procesados matches the workbook rows, successful rows are reported correctly, and no unexpected validation errors appear.
6. Close the summary and search for one imported document number. - expect: The imported beneficiary is present with the expected enrollment state and core data.

#### 1.2. BEN-BULK-002 — Reject unsupported file type - ✅

**File:** `tests/Beneficiary/importation/bulk-import-unsupported-file.spec.ts`

**Steps:**

1. Open Registro masivo and attempt to choose a non-spreadsheet file. - expect: The file is rejected or Importar beneficiarios remains unavailable.
2. Observe the validation feedback. - expect: A clear supported-format message is shown and no import request is sent.

#### 1.3. BEN-BULK-003 — Report a missing required field - ✅

**File:** `tests/Beneficiary/importation/bulk-import-missing-required-field.spec.ts`

**Steps:**

1. Upload a workbook where one row omits the required `grado` value. - expect: The workbook is accepted and Importar beneficiarios becomes available.
2. Start the import. - expect: The result reports `Missing required field: grado` for the malformed row.
3. Close the summary and search for document `521643231`. - expect: `No se encontraron beneficiarios que coincidan con los filtros` confirms the malformed row was not imported.

#### 1.4. BEN-BULK-004 — Report row-level invalid values - ✅

**File:** `tests/Beneficiary/importation/bulk-import-mixed-results.spec.ts`

**Steps:**

1. Upload a workbook containing valid rows and five rows with missing required values. - expect: The workbook is accepted for validation.
2. Start the import and wait for completion. - expect: Total procesados is 6, Errores is 5, and each missing-field report is visible in Detalle de novedades.
3. Search for documents `65869700` and `11510266`. - expect: The valid record is present and the malformed record returns the no-matching-beneficiaries message.

#### 1.5. BEN-BULK-005 — Apply the last row for a repeated document ✅

**File:** `tests/Beneficiary/importation/bulk-import-duplicates.spec.ts`

**Steps:**

1. Upload `student-data-alright - repeated - attendant  - x2 - repeated-update-verify.xlsx`, containing two rows with document `4466443`. - expect: The file is accepted for validation.
2. Start the import. - expect: The rows are processed and the last row overwrites the earlier values. The missing repeated-key warning is recorded as a product gap in `next improvements.md`.
3. Search for document `4466443`. - expect: Only one beneficiary record is present and its updated name is `Brad Pitt`.

#### 1.6. BEN-BULK-006 — Cancel bulk registration without importing ✅

**File:** `tests/Beneficiary/importation/bulk-import-cancel.spec.ts`

**Steps:**

1. Open Registro masivo and select a valid workbook. - expect: The file is displayed but processing has not started.
2. Close or cancel the panel before importing. - expect: The panel closes and no import request is sent.
3. Reopen Registro masivo. - expect: The previous file selection and transient validation state are cleared.
4. Repeat the import with the same workbook. - expect: The uploaded msg 'Completado' is displayed.

#### 1.7. BEN-BULK-007 — Import 300 valid records successfully ✅

**File:** `tests/Beneficiary/importation/bulk-import-300-records.spec.ts`

**Steps:**

1. From Beneficiarios, open Registro masivo and upload the valid 300-record workbook. - expect: The selected filename is shown and Importar beneficiarios becomes available.
2. Submit the workbook and wait for `POST /v1.0/beneficiaries/bulk-load`. - expect: The request succeeds, `Total procesados` is `300`, and `Errores` is `0`.
3. Search for 10 evenly distributed beneficiary documents, including the first and last workbook rows. - expect: Every search succeeds and displays the expected beneficiary name.

### 2. Single beneficiary registration

**Seed:** `tests/Beneficiary/seed.spec.ts`

#### 2.1. BEN-SINGLE-001 — Register one beneficiary with valid required data - ✅

**File:** `tests/Beneficiary/register-single-beneficiary.spec.ts`

**Steps:**

1. From Beneficiarios, open the actions menu and select Registro único. - expect: The Registrar estudiante form is visible.
2. Complete all required personal and schooling fields using a unique document number and valid catalog selections. - expect: Each value is retained.
3. Submit the form once and wait for the creation response. - expect: Exactly one successful creation request occurs and a clear success state is shown.
4. Close the form and search by the new document number. - expect: The new beneficiary appears with the entered identity data and expected not enrolled status.

#### 2.2. BEN-SINGLE-002 — Validate required beneficiary fields - ✅

**File:** `tests/Beneficiary/register-beneficiary-required-fields.spec.ts`

**Steps:**

1. Open Registrar estudiante and submit without entering data. - expect: No creation request is sent and every required field exposes associated validation feedback.
2. Complete one required field and submit again. - expect: Completed fields keep their values and only unresolved requirements remain invalid.
3. Use keyboard navigation through invalid fields. - expect: Focus is visible and reaches the first invalid field in a logical order. Fill one required field and verify his validation state is cleared.

#### 2.3. BEN-SINGLE-003 — Prevent duplicate beneficiary document - ✅

**File:** `tests/Beneficiary/register-duplicate-beneficiary.spec.ts`

**Steps:**

1. Open Registrar estudiante and enter valid data using the document number of an existing beneficiary. - expect: The form accepts input but does not alter the existing record.
2. Submit the form. - expect: Creation is rejected with a clear duplicate-document message and no second record is created.

#### 2.4. BEN-SINGLE-004 — Validate document format and stale data - ✅

**File:** `tests/Beneficiary/register-beneficiary-document-validation.spec.ts`

**Covered document rules:**

- CC accepts and retains numeric characters.
- CC removes non-numeric characters.
- NIUP accepts letters and numbers up to its 15-character limit.
- Changing NIUP to CC sanitizes stale alphanumeric data according to the CC rule.

**Steps:**

1. Select NIUP and enter the alphanumeric value `QAutomationTeo123`. - expect: NIUP accepts letters and numbers while enforcing its 15-character boundary, resulting in `QAutomationTeo1`.
2. Change the document type to Cédula de Ciudadanía. - expect: CC removes the stale letters and retains the valid numeric remainder, `1`.
3. Enter `´´+´+` as the CC document and complete the remaining required fields. - expect: CC sanitizes the invalid characters to an empty, invalid field while the Save button remains enabled.
4. Click Save with the invalid CC document. - expect: The form remains open, no creation request is sent, and no success toast appears.

###

#### 2.6. BEN-SINGLE-006 — Cancel registration and handle the delayed feedback overlay — Partial ✅

**File:** `tests/Beneficiary/register-beneficiary-cancel-and-overlay.spec.ts`

**Test cases:**

- `X closes without creating a beneficiary` — `test.fixme`; clicking X currently creates the beneficiary.
- `Cancelar closes without creating a beneficiary` — active regression coverage; Cancelar sends no creation request.

**Steps:**

1. Open Registrar estudiante, enter unsaved values, and wait for the optional feedback overlay that may appear after login. - expect: If shown, the overlay can be dismissed through the Cerrar popup accessible button without losing the form state.
2. Exercise Cancelar and X as separate behaviors. - expect: Cancelar closes the form without sending a creation request. X should do the same, but its expected-behavior test remains `fixme` while the known creation defect exists.
3. Reopen Registrar estudiante. - expect: The form starts clean and no previous unsaved values remain.

### 3. Single attendant registration

**Seed:** `tests/Beneficiary/seed.spec.ts`

#### 3.1. ATT-SINGLE-001 — Register one attendant with valid data - ✅

**File:** `tests/Beneficiary/attendant-form/register-single-attendant.spec.ts`

**Steps:**

1. Open the Acudientes panel and select Registrar. - expect: The Registrar acudiente form is visible.
2. Complete all required identity and contact fields using a unique attendant document and numeric phone number. - expect: Entered values and valid catalog selections are retained.
3. Open Agregar estudiantes, select one available beneficiary, and confirm the selection. - expect: The beneficiary association is accepted by the form.
4. Submit once and wait for `POST /v1.0/attendants`. - expect: Exactly one `201 Created` response contains a numeric `data.id`, `entity: ScanServices`, and `message: Created`; `Acudiente agregado correctamente.` is displayed.
5. Search the Acudientes panel by the newly created attendant's full name. - expect: The newly created attendant appears in the filtered list.

#### 3.2. ATT-SINGLE-002 — Validate required attendant fields ✅

**File:** `tests/Beneficiary/attendant-form/register-attendant-required-fields.spec.ts`

**Steps:**

1. Open the attendant form and submit it without selecting a beneficiary. - expect: No creation request is sent, the form remains open, and `Debes asociar al menos un estudiante antes de guardar.` is displayed.
2. Add one available beneficiary and confirm the selection. - expect: The beneficiary relationship is retained by the form.
3. Submit while the required personal fields remain empty. - expect: No creation request is sent, the form remains open, and `Por favor complete todos los campos obligatorios.` is displayed without applying red invalid styling to the required personal-data controls.
4. Complete the required identity and contact fields incrementally. - expect: Previously entered values remain available and no creation request is sent before a final submission.

#### 3.3. ATT-SINGLE-003 — Validate attendant boundaries and duplicate identifiers - ✅

**File:** `tests/Beneficiary/attendant-form/register-attendant-boundaries-and-duplicates.spec.ts`

**Steps:**

1. Exercise the observed input-length boundaries with values at and beyond each limit: government ID 15 characters, first name 30, second name 30, first last name 30, and second last name 30. - expect: Each bounded control accepts its maximum valid length and does not retain characters beyond that boundary.
2. Enter bounded representative values in phone and email that exceed normal production lengths. - expect: The current UI retains them because phone and email expose no input-length limit; do not submit these diagnostic values.
3. Create a baseline attendant using unique identifiers, valid boundary values, and one beneficiary relationship. - expect: Exactly one `POST /v1.0/attendants` returns `201 Created`, and `Acudiente agregado correctamente.` is displayed.
4. Attempt registration with the baseline government ID and a different valid phone number. - expect: The request is rejected with `message: "The government id already exists"`; the UI displays `Error al guardar el acudiente. Intenta nuevamente.` and keeps the form open.
5. Attempt registration with a unique government ID and the baseline phone number. - expect: The request is rejected with `message: "The phone number already exists"`; the UI displays `Error al guardar el acudiente. Intenta nuevamente.` and keeps the form open.
6. Verify the resulting creation count. - expect: Only the baseline attendant was created; both duplicate attempts were rejected.

#### 3.4. ATT-SINGLE-004 — Reassign a beneficiary to another attendant ✅

**File:** `tests/Beneficiary/attendant-form/register-duplicate-attendant.spec.ts`

**Current behavior:** Registering a different attendant with a beneficiary who already has an attendant updates the beneficiary's relationship without displaying a warning or requesting confirmation.

**Steps:**

1. Identify a beneficiary who is already associated with an existing attendant. - expect: The beneficiary's current attendant association is visible and can be recorded for comparison.
2. Register a different attendant and select the same beneficiary. - expect: The new attendant is created successfully without a reassignment warning or confirmation prompt.
3. Search for and open the retained beneficiary by its unique document number. - expect: The intended beneficiary is opened even when other beneficiaries share its name, and it displays the newly created attendant as its titular relationship.

**Observed:** In the user-confirmed run, searching by the retained document opened the intended beneficiary and the new attendant appeared as its titular relationship. This avoids the previous ambiguity produced by repeated beneficiary names.

#### 3.5. ATT-SINGLE-005 — Link one attendant to multiple beneficiaries ✅

**File:** `tests/Beneficiary/attendant-form/register-shared-attendant.spec.ts`

**Steps:**

1. Create one randomized attendant using the first existing beneficiary shown in the relationship list. - expect: Exactly one new attendant identity is created successfully.
2. Create two beneficiaries, each with a unique document and randomized name retained by the test. - expect: Both beneficiaries are created successfully and can be found by their saved full names.
3. Open each new beneficiary, enable editing, search for the existing attendant, select it, and save the relationship. - expect: Each update displays `El estudiante ha sido actualizado correctamente.`
4. Search for and reopen both new beneficiaries. - expect: Both beneficiaries display the same attendant identity and open its attendant detail, proving that the attendant now serves three beneficiaries in total.

#### 3.6. ATT-SINGLE-006 — Cancel attendant registration without partial data ✅

**File:** `tests/Beneficiary/attendant-form/register-attendant-cancel.spec.ts`

**Steps:**

1. Open the attendant form and enter unsaved values. - expect: The form remains editable and no creation request has occurred.
2. Close the form with X. - expect: The form closes and no attendant or relationship is partially created.
3. Reopen the attendant workflow for the same beneficiary. - expect: The form is clean and the cancelled values are absent.

**Observed:** Closing with X sends zero `POST /v1.0/attendants` requests. Reopening clears the unsaved document, first name, first surname, and phone values.

#### 3.7. ATT-SINGLE-007 — Register one attendant with three beneficiaries ✅

**File:** `tests/Beneficiary/attendant-form/register-attendant-with-three-beneficiaries.spec.ts`

**Steps:**

1. Open Registrar acudiente, complete unique valid personal data, and select the first three visible beneficiaries while retaining their document numbers. - expect: Three unique beneficiary documents are retained, all three relationships are selected, and exactly one attendant is created successfully.
2. Search for and open each retained beneficiary by document number. - expect: The document search identifies the intended beneficiary even when multiple beneficiaries share the same name, and every beneficiary displays the newly created attendant as its titular relationship.
3. Open Acudientes, search for the new attendant, and open its detail. - expect: The attendant detail displays all three retained beneficiary document numbers.

**Observed:** In the user-confirmed run, all three beneficiaries were located by their unique document numbers and the attendant detail displayed the three retained documents. Repeated beneficiary names no longer affect result selection.

### 4. Beneficiary editing

**Seed:** `tests/Beneficiary/seed.spec.ts`

**Page object:** `tests/pages/EditBeneficiaryPage.ts`

**Planning mode:** Design only. Do not execute these scenarios against shared QA until the target records and mutation scope are approved. Every scenario that changes or deletes data must create its own uniquely identified beneficiary as a precondition. Capture the edit and delete request contracts during the first authorized browser run; their HTTP methods and paths are not yet confirmed in the repository.

#### 4.1. BEN-EDIT-001 — Edit beneficiary personal and schooling information

**Planned file:** `tests/Beneficiary/edit-beneficiary/edit-beneficiary-information.spec.ts`

**Steps:**

1. Create a beneficiary with unique data in every editable personal and schooling field. Reload, search only by its document number, and open that exact result. - expect: Exactly one matching beneficiary is displayed and every initial value is retained.
2. Enable editing. For each field (first name, second name, first surname, second surname, document type, document number, grade, group, and population type), change only that field and save once. - expect: Each save sends exactly one successful `PATCH /v1.0/beneficiaries/{id}` request. The existing `updateSuccessToast` assertion remains commented with a system-correction TODO because the successful update currently displays no toast.
3. After every individual save, reload the page, search only by the current document number, reopen the exact record, and enable editing again. - expect: The value just saved persists before the next field is changed. When the document number itself changes, all subsequent searches use the new number.
4. After the final reload and document-number search, reopen the beneficiary. - expect: All nine final personal and schooling values persist together, and exactly nine update requests occurred.

#### 4.2. BEN-EDIT-002 — Validate required fields while editing

**Planned file:** `tests/Beneficiary/edit-beneficiary/edit-beneficiary-required-fields.spec.ts`

**Steps:**

1. Create a unique beneficiary, reopen it, and enable editing. - expect: The current beneficiary values are loaded into the form.
2. Clear the required first name, first surname, document number, grade, group, and population type, then attempt to save. - expect: The form remains open, required controls expose validation feedback, and no update request is sent.
3. Restore the required fields incrementally. - expect: Restored controls clear their invalid state while unresolved required controls remain invalid.

#### 4.3. BEN-EDIT-003 — Cancel editing without saving changes

**Planned file:** `tests/Beneficiary/edit-beneficiary/edit-beneficiary-cancel.spec.ts`

**Steps:**

1. Create a unique beneficiary, reopen it, enable editing, and change representative values without saving. - expect: The edited values are visible only in the open form and no update request occurs.
2. Click the footer Cancelar button. - expect: The form closes without sending an update request.
3. Search for and reopen the same beneficiary. - expect: The original persisted values are displayed and the unsaved changes are absent.
4. Repeat the unsaved edit and close it with the header back button. - expect: No update request is sent and the original values remain persisted after reopening.

#### 4.4. BEN-EDIT-004 — Associate or replace the beneficiary's attendant

**Planned file:** `tests/Beneficiary/edit-beneficiary/edit-beneficiary-attendant.spec.ts`

**Steps:**

1. Create a unique beneficiary without an attendant and identify a deterministic attendant that the test may associate. - expect: The beneficiary and attendant preconditions are available without modifying another scenario's records.
2. Open the beneficiary, enable editing, search for the attendant, select it, and save the relationship. - expect: The update succeeds and `El estudiante ha sido actualizado correctamente.` is displayed.
3. Close and reopen the beneficiary. - expect: The selected attendant persists as the beneficiary's titular relationship and its detail can be opened.

#### 4.5. BEN-EDIT-005 — Prevent a duplicate beneficiary document during editing

**Planned file:** `tests/Beneficiary/edit-beneficiary/edit-beneficiary-duplicate-document.spec.ts`

**Steps:**

1. Create two beneficiaries with unique, different document numbers. - expect: Both records exist independently before editing.
2. Open the first beneficiary and attempt to replace its document number with the second beneficiary's document number. - expect: The update is rejected by the beneficiary-update endpoint with the observed duplicate-document response.
3. Reopen both beneficiaries. - expect: Neither persisted record was overwritten or duplicated, and the first beneficiary retains its original document number.

#### 4.6. BEN-EDIT-006 — Delete a beneficiary created by the test

**Planned file:** `tests/Beneficiary/edit-beneficiary/delete-beneficiary.spec.ts`

**Steps:**

1. Create a beneficiary with a unique document number and retain its generated full name. - expect: The beneficiary exists and can be found through the main Beneficiarios search.
2. Open the beneficiary, enable editing, and click Eliminar estudiante. - expect: The deletion flow is initiated for the selected beneficiary only; handle and verify a confirmation dialog if the application displays one.
3. Confirm deletion and observe the network operation. - expect: Exactly one successful beneficiary-delete request occurs and `El estudiante <beneficiaryName> ha sido eliminado correctamente` is displayed using the retained full name.
4. Search again by the deleted beneficiary's document number. - expect: `No se encontraron beneficiarios que coincidan con los filtros` is displayed and the deleted record cannot be reopened.

**Safety:** Never use a pre-existing shared-QA beneficiary for this scenario. If creation fails, skip the deletion action and fail during precondition setup.
