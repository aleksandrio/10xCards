# Authentication Module - Technical Specification

This document outlines the technical architecture for implementing user authentication in the 10xCards application, based on PRD requirements US-001 to US-004 and the defined tech stack (Astro, React, Supabase).

## 1. USER INTERFACE ARCHITECTURE

The UI will be expanded to support authentication states, guest-only pages, and protected user-only areas.

### 1.1. Layouts

-   **`src/layouts/Layout.astro`**: This main layout will be updated to conditionally render navigation elements based on the user's authentication state.
    -   **Contract**: It will receive a `session` object (or `null`) from the pages that use it. This session object will be sourced from `Astro.locals.session` provided by the authentication middleware.
    -   **Unauthenticated State**: Displays "Log In" and "Sign Up" navigation links in the header.
    -   **Authenticated State**: Hides "Log In" and "Sign Up" links and renders a `UserNav` component displaying the user's email and a "Sign Out" option.

### 1.2. Pages (Astro)

New pages will be created to host the authentication forms. Existing pages will be protected.

-   **`src/pages/login.astro`**:
    -   **Description**: A public page containing the login form.
    -   **UI**: Renders the `LoginForm.tsx` React component.
    -   **Logic**: If an authenticated user visits this page, they should be redirected to `/dashboard`. This logic will be handled by the middleware.

-   **`src/pages/register.astro`**:
    -   **Description**: A public page containing the user registration form.
    -   **UI**: Renders the `RegisterForm.tsx` React component.
    -   **Logic**: If an authenticated user visits this page, they should be redirected to `/dashboard` by the middleware.

-   **`src/pages/forgot-password.astro`**:
    -   **Description**: A public page for initiating the password reset process.
    -   **UI**: Renders the `ForgotPasswordForm.tsx` React component.

-   **`src/pages/update-password.astro`**:
    -   **Description**: A protected page allowing a user with a valid (password-recovery) session to set a new password.
    -   **UI**: Renders the `UpdatePasswordForm.tsx` React component.
    -   **Logic**: Access is controlled by the middleware. If a user lands here without a session, they are redirected to `/login`.

-   **`src/pages/api/auth/callback.astro`**:
    -   **Description**: An API route to handle the server-side exchange of an auth code for a session, which is part of the Supabase OAuth flow used for password recovery links.
    -   **Logic**: This endpoint is required by Supabase's server-side auth helpers to securely manage session cookies.

-   **Protected Pages (`/dashboard`, `/decks/[deckId]`)**:
    -   **`src/pages/dashboard.astro`**: This page will now be protected.
    -   **`src/pages/decks/[deckId].astro`**: This page will now be protected.
    -   **Logic**: Access control will be enforced by the `src/middleware/index.ts`. Unauthenticated users will be redirected to `/login`. Authenticated users will be granted access, and the page will receive session data via `Astro.locals`.

### 1.3. Components (React)

A new `src/components/auth/` directory will house all authentication-related React components. These components are responsible for form state management, client-side validation, and communication with the Supabase client.

-   **`src/components/auth/LoginForm.tsx`**:
    -   **Responsibility**: Manages the state for email and password fields, handles form submission, displays validation errors, and shows error messages from the authentication provider (e.g., "Invalid credentials").
    -   **Contract**: On successful login, it redirects the user to `/dashboard`.

-   **`src/components/auth/RegisterForm.tsx`**:
    -   **Responsibility**: Manages state for email, password, and password confirmation. Performs client-side validation to ensure passwords match.
    -   **Contract**: On successful registration, it redirects the user to `/dashboard`. It will display errors like "Email already in use".

-   **`src/components/auth/ForgotPasswordForm.tsx`**:
    -   **Responsibility**: Manages the state for an email input field.
    -   **Contract**: On form submission, it calls the Supabase client to send a password reset email. It will display a confirmation message to the user upon success.

-   **`src/components/auth/UpdatePasswordForm.tsx`**:
    -   **Responsibility**: Manages state for "new password" and "confirm new password" fields. Performs client-side validation.
    -   **Contract**: On form submission, it calls `supabase.auth.updateUser()` with the new password. On success, it redirects the user to `/dashboard`.

-   **`src/components/layout/UserNav.tsx`**:
    -   **Responsibility**: A small component to be displayed in the header for authenticated users.
    -   **Contract**: It receives the user's email as a prop. It contains a button that, when clicked, triggers the `signOut` function from the Supabase client and redirects to `/login`.

### 1.4. Scenarios & Validation

-   **Client-Side Validation**: Forms will provide immediate feedback for required fields, email format, and password matching using Zod schemas defined in `src/lib/schemas.ts`.
-   **Server Error Handling**: Components will handle and display API errors returned from Supabase (e.g., invalid credentials, user already exists) in a user-friendly format near the relevant form fields or as a general form alert.
-   **Navigation**:
    -   **Success**: Login/Registration leads to `/dashboard`. Logout leads to `/`.
    -   **Failure**: User remains on the form page with errors displayed.
    -   **Access Denied**: Attempting to access a protected page while unauthenticated redirects to `/login`.

## 2. BACKEND LOGIC

The backend logic is minimal, as Supabase handles the core authentication service. The primary server-side responsibility is to integrate with Supabase via middleware to manage sessions and protect pages.

### 2.1. API Endpoints

No custom API endpoints for authentication (e.g., `POST /api/login`) are necessary. All authentication operations will be performed by calling the Supabase JavaScript client library (`@supabase/supabase-js`) directly from the React components on the client-side, and from Astro components/middleware on the server-side.

### 2.2. Server-Side Rendering & Page Protection

Astro's SSR capabilities are a prerequisite (`output: 'server'` in `astro.config.mjs`).

-   **`src/middleware/index.ts`**:
    -   **Responsibility**: This is the central point for server-side authentication enforcement. It will run on every request.
    -   **Logic**:
        1.  Initializes a server-side Supabase client for each request using the request's cookies.
        2.  Fetches the current user's session from Supabase.
        3.  Injects the `session` object and the Supabase client instance into `Astro.locals`, making them available to all Astro pages and API endpoints.
        4.  Checks if the requested path is a protected route.
        5.  If the route is protected and the user has no active session, it redirects the user to `/login`.
        6.  If the route is a guest-only route (like `/login` or `/register`) and the user *is* authenticated, it redirects to `/dashboard`.

### 2.3. Data Models

-   **`auth.users`**: The primary data source will be Supabase's built-in `auth.users` table. This application will not require a separate `profiles` table for the MVP, simplifying data management. The user object provided by Supabase (containing ID, email, etc.) will be sufficient.

## 3. AUTHENTICATION SYSTEM (Supabase Auth)

The implementation will rely entirely on Supabase Auth, using the official Supabase helper library for Astro for seamless integration.

### 3.1. Supabase Client Configuration

-   **`src/db/supabase.client.ts`**: This existing file will be used to export a singleton instance of the Supabase client for use in client-side React components.
-   **Environment Variables**: The application will require `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to be configured in `.env` for the client to function. For server-side operations (in middleware), `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY` will be used.

### 3.2. Authentication Flows

The flows will be implemented using functions from `@supabase/supabase-js` and helpers from `@supabase/auth-helpers-astro`.

-   **Registration (US-001)**:
    -   The `RegisterForm.tsx` component will call `supabase.auth.signUp()`.
    -   For MVP, the "Secure email change" and "Confirm email" options in Supabase project settings should be disabled to allow for immediate login after registration, as per the PRD.

-   **Login (US-002)**:
    -   The `LoginForm.tsx` component will call `supabase.auth.signInWithPassword()`. Supabase's client library will automatically handle setting the session cookie upon success.

-   **Logout (US-003)**:
    -   The `UserNav.tsx` component will call `supabase.auth.signOut()`. The client library will handle clearing the session cookie.

-   **Password Reset (US-004)**:
    -   **Step 1**: The `ForgotPasswordForm.tsx` component calls `supabase.auth.resetPasswordForEmail()`, passing the user's email. Supabase sends a magic link to the user.
    -   **Step 2**: The user clicks the link, which directs them to the application. The `@supabase/auth-helpers-astro` middleware will handle the token from the URL, create a valid session, and redirect.
    -   **Step 3**: Because the user now has a valid session, they can be directed to a page where they can update their password. This will likely be a new page `src/pages/update-password.astro`, which will render an `UpdatePasswordForm.tsx` component.
    -   **Step 4**: The `UpdatePasswordForm.tsx` component will call `supabase.auth.updateUser()` with the new password.
