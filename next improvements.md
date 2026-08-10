# PAE test coverage and next improvements

Update this file whenever a new automated test is created or testing exposes a product or testability gap.

## Implemented tests

### LOGIN-001 — Successful login redirects to the dashboard

- File: `tests/Login/successful-login-redirects-to-dashboard.spec.ts`
- Status: Implemented and passing.
- Coverage: Successful authentication, one authentication request, `/dashboard` navigation, and authenticated account content.

### LOGIN-002 — Invalid credentials are rejected safely

- File: `tests/Login/invalid-credentials-are-rejected-safely.spec.ts`
- Status: Implemented and passing.
- Coverage: `401` rejection, generic error, one authentication request, remaining on `/auth/login`, no dashboard content, masked password, and no credentials in the URL.

### LOGIN-007 — Authenticated session survives a reload

- File: `tests/Login/authenticated-session-survives-a-reload.spec.ts`
- Status: Implemented and passing.
- Coverage: Successful authentication, initial dashboard state, browser reload, persistent `/dashboard` route, restored authenticated account content, and absence of the login form.

### BEN-BULK-006 — Cancel bulk registration without importing

- File: `tests/Beneficiary/importation/bulk-import-cancel.spec.ts`
- Status: Implemented and passing.
- Coverage: Valid workbook selection, cancellation before import, zero bulk-load requests, cleared upload state after reopening, and successful import of the same workbook afterward.

### BEN-BULK-007 — Import 300 valid records successfully

- File: `tests/Beneficiary/importation/bulk-import-300-records.spec.ts`
- Status: Implemented; browser execution pending.
- Coverage: Successful 300-row bulk-load response, `Total procesados = 300`, `Errores = 0`, and 10 representative document/name searches distributed across the workbook.

### BEN-SINGLE-001 — Register one beneficiary with valid required data

- File: `tests/Beneficiary/register-single-beneficiary.spec.ts`
- Status: Implemented and passing.
- Coverage: Randomized government ID, retained required values, exactly one `POST /v1.0/beneficiaries`, `201 Created`, green success toast, beneficiary search proof, and `No enrolado` state.

### BEN-SINGLE-002 — Validate required beneficiary fields

- File: `tests/Beneficiary/register-beneficiary-required-fields.spec.ts`
- Status: Implemented and passing.
- Coverage: Empty submission, Angular invalid state on all seven required controls, zero beneficiary creation requests, and persistent form state. Fill one required field and verify his validation state is cleared.

### ATT-SINGLE-001 — Register one attendant with valid data

- File: `tests/Beneficiary/attendant-form/register-single-attendant.spec.ts`
- Status: Implemented and passing in focused Chromium execution.
- Coverage: Unique attendant identity, numeric phone, beneficiary association, exactly one `POST /v1.0/attendants`, `201 Created` response contract, success message, and attendant-panel search proof.

### ATT-SINGLE-003 — Validate attendant boundaries and duplicate identifiers

- File: `tests/Beneficiary/attendant-form/register-attendant-boundaries-and-duplicates.spec.ts`.
- Status: Implemented and passing in focused Chromium execution.
- Coverage: verified the 15-character government-ID boundary, all four 30-character name boundaries, missing phone/email length limits, one successful baseline creation, distinct duplicate API messages, the shared generic error toast, and exactly one successful response across three creation requests.

### ATT-SINGLE-006 — Cancel attendant registration without partial data

- File: `tests/Beneficiary/attendant-form/register-attendant-cancel.spec.ts`.
- Status: Implemented and passing in focused Chromium execution.
- Coverage: valid unsaved personal data, zero `POST /v1.0/attendants` requests after closing with X, hidden form state, and clean document, name, surname, and phone values after reopening.

## Gaps and improvements

### Allow attendants to share a phone number

- Related scenario: `ATT-SINGLE-003`.
- Business rule: uniqueness belongs to the attendant government document, not the phone number.
- Current API behavior: a second attendant with a unique government ID and an existing phone is rejected with `message: "The phone number already exists"`.
- Current UI behavior: both duplicate-government-ID and duplicate-phone failures display only `Error al guardar el acudiente. Intenta nuevamente.`.
- Improvement: allow a valid phone number to be shared by multiple attendants, and reserve uniqueness enforcement for the government ID.
- Feedback improvement: when a save is rejected, translate the API reason into specific accessible UI feedback instead of the same generic toast for every conflict.

### Attendant phone and email have no length boundaries

- Related scenario: `ATT-SINGLE-003`.
- Confirmed boundaries: government ID accepts up to 15 characters; first name, second name, first last name, and second last name accept up to 30 characters each.
- Current gap: phone and email expose no input-length limit, allowing values far beyond practical production lengths to remain in the form.
- Improvement: define business-approved maximum lengths for phone and email, enforce the same limits in the UI and API, and provide field-specific validation feedback.

### Reassigning a beneficiary to another attendant has no warning

- Related scenario: `ATT-SINGLE-004`.
- File: `tests/Beneficiary/register-duplicate-attendant.spec.ts`.
- Current behavior: registering a different attendant with a beneficiary who already has an attendant updates the beneficiary's relationship without notifying the user or requesting confirmation.
- Product risk: a user can unintentionally replace the beneficiary's attendant relationship without understanding that the existing association will change.
- Improvement: before reassigning the beneficiary, display the current and proposed attendants, explain that the existing relationship will be replaced, and require explicit confirmation. Cancelling must retain the original relationship, while confirming must update only the relationship without overwriting either attendant's personal data or creating a duplicate association.

### Required beneficiary fields rely on color alone

- Related scenario: `BEN-SINGLE-002`.
- Empty required fields receive red invalid outlines, but no written validation message explains what must be corrected.
- Accessibility gap: users who cannot perceive the color change may not know which fields are invalid or why submission was blocked.
- Improvement: display `Este campo es obligatorio` for each missing value, associate it with the control through `aria-describedby`, and expose a form-level validation summary when submission fails.

### Required attendant fields are not identified individually

- Related scenario: `ATT-SINGLE-002`.
- Current behavior: after associating a beneficiary, submitting with empty personal data displays `Por favor complete todos los campos obligatorios.`, but the required controls do not receive red invalid styling or field-level messages.
- Accessibility gap: the form-level message does not identify each missing identity and contact value at its control.
- Improvement: mark each missing control invalid, display an associated `Este campo es obligatorio` message, and move focus to the first invalid control.

### Duplicate beneficiary document has no user feedback

- Related scenario: `BEN-SINGLE-003`.
- File: `tests/Beneficiary/register-duplicate-beneficiary.spec.ts`.
- Status: Implemented; the test validates the rejected API response and its `message: "The government id already exists"` contract while visible UI feedback remains unavailable.
- The application prevents creation when the government ID already exists, but no toast or validation message explains why the beneficiary was not created.
- Product gap: the form appears not to submit successfully without telling the user that the document number is duplicated.
- Improvement: show a visible error toast such as `Ya existe un beneficiario con el número de documento ingresado`, keep the entered values available for correction, and expose the message through an accessible `alert` or `aria-live` region.

### Closing beneficiary registration with X creates the beneficiary

- Related scenario: `BEN-SINGLE-006`.
- File: `tests/Beneficiary/register-beneficiary-cancel-and-overlay.spec.ts`.
- Status: the X expected-behavior regression test is marked `test.fixme`; the separate Cancelar test remains active.
- Current behavior: with valid unsaved values, clicking X creates the beneficiary, while Cancelar closes the form without sending `POST /v1.0/beneficiaries`.
- Product risk: a user can create a record while explicitly trying to dismiss the form.
- Improvement: make X a non-submit button, close without invoking creation, and keep both X and Cancelar aligned with the zero-request contract.

### Invalid beneficiary document fails silently

- Related scenario: `BEN-SINGLE-004`.
- File: `tests/Beneficiary/register-beneficiary-document-validation.spec.ts`.
- Current automated coverage: CC retains numbers, CC removes non-numeric characters, NIUP accepts letters plus numbers up to 15 characters, and changing NIUP to CC sanitizes stale alphanumeric data.
- When `´´+´+` is entered under CC, the control is sanitized to empty; Save remains enabled and clickable, but the frontend sends no beneficiary creation request.
- Product gap: the form remains open without a field-level explanation, error toast, or backend response that tells the user why registration did not continue.
- Improvement: show a specific document-format message, associate it with the document input, set an observable invalid state, and focus the invalid control after Save is clicked.

### Bulk import silently overwrites repeated document keys

- Related scenario: `BEN-BULK-005`.
- When two workbook rows contain the same `N-Documento`, the last row overwrites the earlier row, but the import summary does not report that the document key was repeated.
- Product gap: users are not warned that information from an earlier row was replaced, which can cause unnoticed data loss.
- Improvement: report each repeated `N-Documento` in `Detalle de novedades`, identify the affected workbook rows, and clearly state which row was applied.

### Authentication error accessibility

- Found while validating `LOGIN-002`.
- The message `Usuario o contraseña incorrectos` appears as temporary generic content without an observable `alert` or `status` role in the accessibility snapshot.
- Improvement: expose the message with `role="alert"` or an appropriate `aria-live` region so assistive technology announces the rejection and tests have a stable semantic locator.

### Required-field validation

- Related scenario: `LOGIN-003`.
- The current test-plan observation says empty submission leaves `aria-invalid="false"` and provides no visible required-field feedback.
- Improvement: prevent incomplete authentication requests and associate specific validation feedback with both inputs.

### Login-field metadata

- Related scenario: `LOGIN-009`.
- The current test-plan observation says the username and password inputs do not expose the expected `autocomplete` values.
- Improvement: use `autocomplete="username"` and `autocomplete="current-password"`, and ensure both visible labels are programmatically associated with their inputs.


### Login 03
**Failure conditions:** Enter does nothing, sends duplicate requests, or causes a different result from clicking the button.

### Login 008

**Failure conditions:** The active user can interact with the login form or creates a second inconsistent session. Return and again re-login -> Incomplete login.
