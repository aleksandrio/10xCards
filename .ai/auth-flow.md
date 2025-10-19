# Authentication Flow Diagrams

This document contains Mermaid.js sequence diagrams illustrating the authentication flows for the 10xCards application, based on the technical specifications.

## 1. User Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as "Browser (React Components)"
    participant Astro as "Astro (Pages/Middleware)"
    participant Supabase

    User->>Browser: Navigates to /register
    Browser->>Astro: GET /register
    Astro-->>Browser: Serves Register Page with RegisterForm.tsx
    User->>Browser: Fills out and submits registration form (email, password)
    Browser->>Supabase: Calls supabase.auth.signUp({ email, password })
    Supabase-->>Browser: Returns success response and user session
    Note over Browser: Supabase client sets auth cookie
    Browser->>Astro: Redirects to /dashboard
    Astro->>Astro: Middleware checks for session
    Note over Astro: Session is valid
    Astro-->>Browser: Serves Dashboard Page
```

## 2. User Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as "Browser (React Components)"
    participant Astro as "Astro (Pages/Middleware)"
    participant Supabase

    User->>Browser: Navigates to /login
    Browser->>Astro: GET /login
    Astro-->>Browser: Serves Login Page with LoginForm.tsx
    User->>Browser: Fills out and submits login form (email, password)
    Browser->>Supabase: Calls supabase.auth.signInWithPassword({ email, password })
    Supabase-->>Browser: Returns success response and user session
    Note over Browser: Supabase client sets auth cookie
    Browser->>Astro: Redirects to /dashboard
    Astro->>Astro: Middleware checks for session
    Note over Astro: Session is valid
    Astro-->>Browser: Serves Dashboard Page
```

## 3. User Logout Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as "Browser (React Components)"
    participant Astro as "Astro (Pages/Middleware)"
    participant Supabase

    User->>Browser: Clicks "Sign Out" button (in UserNav.tsx)
    Browser->>Supabase: Calls supabase.auth.signOut()
    Supabase-->>Browser: Returns success, clears session
    Note over Browser: Supabase client removes auth cookie
    Browser->>Astro: Redirects to /
    Astro-->>Browser: Serves Home Page
```

## 4. Password Reset Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as "Browser (React Components)"
    participant Astro as "Astro (Pages/Middleware)"
    participant Supabase
    participant EmailService as "Email Service"

    %% Step 1: Request Reset Link
    User->>Browser: Navigates to /forgot-password
    Browser->>Astro: GET /forgot-password
    Astro-->>Browser: Serves Forgot Password Page
    User->>Browser: Enters email and submits
    Browser->>Supabase: Calls supabase.auth.resetPasswordForEmail(email)
    Supabase->>EmailService: Sends password reset email
    EmailService->>User: Delivers email with reset link
    Supabase-->>Browser: Returns success message
    Browser->>User: Displays confirmation message

    %% Step 2: User clicks link and updates password
    User->>Browser: Clicks reset link in email (e.g., /api/auth/callback?token=...)
    Browser->>Astro: GET /api/auth/callback?token=...
    Astro->>Supabase: Exchanges token for a temporary session
    Supabase-->>Astro: Returns valid session
    Note over Astro: Middleware handles session and redirects
    Astro->>Browser: Redirects to /update-password
    Browser->>Astro: GET /update-password
    Astro-->>Browser: Serves Update Password Page
    User->>Browser: Enters and submits new password
    Browser->>Supabase: Calls supabase.auth.updateUser({ password })
    Supabase-->>Browser: Returns success
    Browser->>Astro: Redirects to /dashboard
    Astro-->>Browser: Serves Dashboard Page
```
