# Login Test Plan

## Objective

Verify the PAE login flow beyond a basic form submission, including successful authentication, validation, keyboard behavior, session handling, and protection against repeated requests.

Password recovery is explicitly outside this plan.

## Test-data assumptions

- Every scenario starts in a new browser context with no cookies or local storage.
- A dedicated active QA account is available.
- Valid credentials are supplied through environment variables or a secure CI secret; they must not be added directly to new test files.
- Invalid-login scenarios use a reserved nonexistent username so a real account cannot be locked.
- Scenarios are independent and may run in any order.

## Priority summary

| ID | Priority | Scenario |
| --- | --- | --- |
| LOGIN-001 | P0 | Successful login redirects to the dashboard |
| LOGIN-002 | P0 | Invalid credentials are rejected safely |
| LOGIN-003 | P0 | Empty and partially completed forms are validated |
| LOGIN-004 | P1 | Enter submits the completed form once |
| LOGIN-005 | P1 | Password visibility control masks and restores the value |
| LOGIN-006 | P1 | Repeated clicks produce only one authentication request |
| LOGIN-007 | P1 | Authenticated session survives a reload |
| LOGIN-008 | P1 | An authenticated user cannot return to the login form |
| LOGIN-009 | P2 | Login controls have appropriate browser and accessibility metadata |

## Scenarios

### LOGIN-001 — Successful login redirects to the dashboard

**Starting state:** Fresh browser context on `/auth/login`; the QA account is active.

1. Confirm the username and password fields are empty.
2. Enter the valid QA username and password from secure configuration.
3. Click **Iniciar sesión**.
4. Wait for the authentication response and the resulting navigation.
5. Verify the authentication response is successful.
6. Verify the final URL is `/dashboard`.
7. Verify a dashboard-specific element is visible.

**Success criteria:** Exactly one successful authentication request occurs and the authenticated dashboard is displayed.

**Failure conditions:** The page remains on login, an error appears, more than one request occurs, or the dashboard is not usable.

### LOGIN-002 — Invalid credentials are rejected safely

**Starting state:** Fresh browser context on `/auth/login`.

1. Enter a reserved nonexistent username and a non-secret invalid password.
2. Submit the form.
3. Wait for the authentication response or visible error state.
4. Verify the user remains on `/auth/login`.
5. Verify a clear, generic error is displayed.
6. Verify no authenticated dashboard content is visible.
7. Verify the password is still masked and no credential is included in the URL.

**Success criteria:** Authentication is rejected without revealing whether a particular account exists.

**Failure conditions:** The user reaches the dashboard, credentials appear in the URL or message, or the page crashes.

### LOGIN-003 — Empty and partially completed forms are validated

**Starting state:** Fresh browser context on `/auth/login`.

1. Submit both fields empty.
2. Verify required-field feedback is associated with both inputs.
3. Verify no authentication request is sent.
4. Enter only the username and submit again.
5. Verify only the password requirement remains unresolved.
6. Reload into a fresh state, enter only the password, and submit.
7. Verify only the username requirement remains unresolved.

**Success criteria:** Missing fields receive specific feedback and incomplete forms never call the authentication endpoint.

**Failure conditions:** An incomplete form sends a request, no feedback appears, or focus does not move to the first invalid field.

> Current observation: submitting both fields empty leaves `aria-invalid="false"` and shows no visible validation message. This scenario is expected to expose a product validation gap until the application is corrected.

### LOGIN-004 — Enter submits the completed form once

**Starting state:** Fresh browser context on `/auth/login`; valid QA credentials are available.

1. Fill the username and password.
2. Keep focus in the password field.
3. Press Enter once.
4. Count authentication requests.
5. Verify navigation to `/dashboard`.

**Success criteria:** Keyboard submission behaves like the button and sends exactly one request.

**Failure conditions:** Enter does nothing, sends duplicate requests, or causes a different result from clicking the button.

### LOGIN-005 — Password visibility control masks and restores the value

**Starting state:** Fresh browser context on `/auth/login`.

1. Verify the password input type is `password`.
2. Enter a sample non-secret value.
3. Activate the visibility control.
4. Verify the input becomes readable and retains the same value.
5. Activate the control again.
6. Verify the input returns to type `password` and still retains the value.
7. Verify the control exposes an accessible name describing its current action.

**Success criteria:** Visibility changes reliably without clearing or modifying the password.

**Failure conditions:** The value changes, the state does not toggle, or assistive technology cannot identify the control.

### LOGIN-006 — Repeated clicks produce only one authentication request

**Starting state:** Fresh browser context on `/auth/login`; valid QA credentials are available.

1. Fill the valid username and password.
2. Trigger two rapid clicks on **Iniciar sesión**.
3. Count requests to the authentication endpoint.
4. Observe the button while the first request is pending.
5. Verify navigation completes normally.

**Success criteria:** Only one request is sent and the control prevents additional submission while authentication is pending.

**Failure conditions:** Duplicate authentication requests are sent, multiple sessions are created, or conflicting messages appear.

### LOGIN-007 — Authenticated session survives a reload

**Starting state:** Fresh browser context on `/auth/login`; valid QA credentials are available.

1. Log in successfully.
2. Confirm `/dashboard` is displayed.
3. Reload the page.
4. Verify the application remains authenticated.
5. Verify dashboard content is restored without showing the login form.

**Success criteria:** A valid session remains usable across a normal page reload.

**Failure conditions:** Reload returns to login unexpectedly, displays a blank page, or exposes an authorization error.

### LOGIN-008 — Authenticated user cannot return to the login form

**Starting state:** Fresh browser context; valid QA credentials are available.

1. Log in successfully.
2. Navigate directly to `/auth/login` in the same context.
3. Wait for routing and session checks to settle.
4. Verify the user is redirected to `/dashboard` or another authorized landing page.
5. Verify the login form is not displayed to the active session.

**Success criteria:** The application recognizes the existing session and avoids presenting a redundant login form.

**Failure conditions:** The active user can interact with the login form or creates a second inconsistent session.

### LOGIN-009 — Login controls expose appropriate metadata

**Starting state:** Fresh browser context on `/auth/login`.

1. Verify the username and password inputs have programmatically associated names.
2. Verify the username uses `autocomplete="username"`.
3. Verify the password uses `autocomplete="current-password"`.
4. Verify the password is masked initially.
5. Navigate through the controls using Tab.
6. Verify focus is visible and reaches username, password, visibility control, and submit button in a logical order.
7. Verify the submit and visibility controls have accessible names.

**Success criteria:** The form supports keyboard users, assistive technology, and password managers without weakening password masking.

**Failure conditions:** A control lacks an accessible name, focus is lost, or autocomplete metadata is missing or incorrect.

> Current observation: neither input currently exposes an `autocomplete` value. Treat this as an accessibility and password-manager improvement candidate.

## Recommended automation order

1. Implement `LOGIN-001` through `LOGIN-003` first because they cover the critical authentication contract.
2. Add `LOGIN-004` through `LOGIN-006` for interaction reliability.
3. Add `LOGIN-007` and `LOGIN-008` once the expected session policy is confirmed.
4. Keep `LOGIN-009` as a focused accessibility and UX contract.

