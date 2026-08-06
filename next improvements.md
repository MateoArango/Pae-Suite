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

## Gaps and improvements

### Required beneficiary fields rely on color alone

- Related scenario: `BEN-SINGLE-002`.
- Empty required fields receive red invalid outlines, but no written validation message explains what must be corrected.
- Accessibility gap: users who cannot perceive the color change may not know which fields are invalid or why submission was blocked.
- Improvement: display `Este campo es obligatorio` for each missing value, associate it with the control through `aria-describedby`, and expose a form-level validation summary when submission fails.

### Duplicate beneficiary document has no user feedback

- Related scenario: `BEN-SINGLE-003`.
- File: `tests/Beneficiary/register-duplicate-beneficiary.spec.ts`.
- Status: Implemented; the test validates the rejected API response and its `message: "The government id already exists"` contract while visible UI feedback remains unavailable.
- The application prevents creation when the government ID already exists, but no toast or validation message explains why the beneficiary was not created.
- Product gap: the form appears not to submit successfully without telling the user that the document number is duplicated.
- Improvement: show a visible error toast such as `Ya existe un beneficiario con el número de documento ingresado`, keep the entered values available for correction, and expose the message through an accessible `alert` or `aria-live` region.

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
