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

## Gaps and improvements

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