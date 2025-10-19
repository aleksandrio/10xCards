# Comprehensive Test Plan for the 10xCards Application

## 1. Introduction and Testing Objectives

### 1.1. Introduction

This document describes the test plan for the `10xCards` application, an AI-powered platform for creating and managing educational flashcards. The application is built on a modern technology stack, including Astro, React, TypeScript, and Supabase. The goal of this plan is to ensure the highest quality, stability, and security of the application before its production deployment.

### 1.2. Testing Objectives

The main objectives of the testing process are:
- **Functional Verification:** To ensure that all application features work as intended.
- **Quality Assurance:** To identify and eliminate bugs in all application components.
- **Usability Assessment:** To verify that the user interface is intuitive and user-friendly.
- **Security Verification:** To identify potential security vulnerabilities, especially in the authorization and data access modules.
- **Performance Assurance:** To assess whether the application runs smoothly under expected load.
- **Compatibility Check:** To verify the proper functioning of the application on the most popular web browsers.

## 2. Scope of Testing

### 2.1. Features Included in Testing

- **Authentication Module:**
    - New user registration.
    - Login and logout.
    - Protection of routes requiring authentication.
    - Password recovery process.
- **Deck Management:**
    - Create, Read, Update, and Delete (CRUD) operations for flashcard decks.
    - Input data validation.
    - Assignment of decks to a specific user.
- **Flashcard Management:**
    - CRUD operations on flashcards within a given deck.
    - Validation of flashcard content.
- **AI-Powered Flashcard Generation:**
    - Integration with the `OpenRouter` service.
    - Handling of loading and error states.
    - Quality and correctness of the generated content.
- **User Interface (UI):**
    - Correct rendering of components.
    - Responsiveness on various devices (desktop, tablet, mobile).
    - Functionality of interactive elements (buttons, forms, modals).

### 2.2. Features Excluded from Testing

- Direct testing of the internal logic of `shadcn/ui` libraries (we assume their correctness and only test the integration).
- Large-scale load and performance testing (in the first phase, the focus is on functionality).
- Testing of the internal infrastructure of Supabase and OpenRouter (we focus on API integration).

## 3. Types of Tests to be Performed

### 3.1. Unit Tests

- **Objective:** To verify the correctness of individual functions, components, and services in isolation.
- **Scope:**
    - Utility functions (`/src/lib/utils.ts`).
    - Business logic in services (`/src/lib/deckService.ts`, `/src/lib/flashcardService.ts`).
    - Zod validation schemas (`/src/lib/schemas.ts`).
    - React components with minimal dependencies.
- **Tools:** `Vitest`, `React Testing Library`.

### 3.2. Integration Tests

- **Objective:** To check if different parts of the application work correctly together.
- **Scope:**
    - Interaction of React components with hooks (`useDecks`, `useDeckDetail`).
    - Frontend -> API communication (e.g., submitting a form and handling the response).
    - Integration with the Supabase client (mocking database queries).
    - Functionality of the Astro middleware in the context of route protection.
- **Tools:** `Vitest`, `React Testing Library` (with API mocking).

### 3.3. End-to-End (E2E) Tests

- **Objective:** To simulate real user scenarios from the end-user's perspective.
- **Scope:**
    - Full authentication cycle (registration -> login -> logout).
    - Complete process of creating a deck and adding cards to it, including AI generation.
    - Scenarios for editing and deleting data.
    - Verification of data flow throughout the entire application.
- **Tools:** `Playwright`

### 3.4. Manual Testing

- **Objective:** Exploratory verification of usability, appearance, and the overall "feel" of the application.
- **Scope:**
    - Responsiveness testing on physical devices.
    - Verification of visual consistency.
    - Searching for non-obvious bugs and UX issues.

## 4. Test Scenarios for Key Functionalities

| ID | Feature | Scenario | Expected Result | Priority |
|---|---|---|---|---|
| **AUTH-01** | Registration | User provides valid data and creates an account. | The account is created, the user is logged in and redirected to the dashboard. | Critical |
| **AUTH-02** | Registration | User provides an email that already exists in the database. | An error message "Email already in use" is displayed. | High |
| **AUTH-03** | Login | User provides correct login credentials. | The user is logged in and redirected to the dashboard. | Critical |
| **AUTH-04** | Login | User provides an incorrect password. | An error message "Invalid login credentials" is displayed. | High |
| **AUTH-05** | Access | An unauthenticated user tries to access `/dashboard`. | The user is redirected to the login page. | Critical |
| **DECK-01** | Create Deck | A logged-in user creates a new flashcard deck. | The new deck appears on the list in the dashboard. | Critical |
| **DECK-02** | Edit Deck | User changes the name of an existing deck. | The deck's name is updated on the list and in the details view. | High |
| **DECK-03** | Delete Deck | User deletes a flashcard deck. | The deck disappears from the list, and associated flashcards are deleted. | High |
| **CARD-01** | Add Flashcard | User manually adds a new flashcard to a deck. | The flashcard appears on the list in the deck's detail view. | Critical |
| **AI-GEN-01** | AI Generation | User generates flashcards based on a topic. | After the process completes, the generated flashcards appear on the list. | High |
| **AI-GEN-02** | Generation Error | An error occurs during communication with the OpenRouter API. | The user receives a clear error message. | Medium |

## 5. Test Environment

- **Database:** A dedicated, separate Supabase project exclusively for testing purposes (E2E and manual) to avoid conflicts with development and production data.
- **Frontend:** The application will be run locally in development mode for unit and integration tests. For E2E tests, the application will be run in a special test mode or on a dedicated staging environment.
- **Browsers:** E2E and manual tests will be conducted on the latest versions of Chrome, Firefox, and Safari.

## 6. Testing Tools

- **Unit and Integration Test Framework:** `Vitest` - a modern, fast framework compatible with Vite, which Astro is based on.
- **React Component Testing Library:** `React Testing Library` - promotes best practices for user-centric testing.
- **E2E Testing Framework:** `Playwright` - a powerful browser automation tool offering stable tests and great developer tools.
- **CI/CD:** `GitHub Actions` - for automatically running tests (lint, unit, integration, and E2E) on every push and pull request.

## 7. Testing Schedule

The testing process should be an integral part of the development cycle.
1. **Phase 1: Setup** - Installation and configuration of testing tools, creation of the test environment in Supabase, CI/CD configuration.
2. **Phase 2: Test Writing (continuous)** - Unit and integration tests should be written concurrently with the development of new features.
3. **Phase 3: E2E Tests (after completion of key module development)** - Implementation of E2E scenarios for the main application flows.
4. **Phase 4: Regression and Manual Testing (before each deployment)** - Running the full suite of automated tests and conducting exploratory testing to ensure that new changes have not broken existing functionality.

## 8. Test Acceptance Criteria

The testing process is considered complete for a given release when:
- **Unit Test Code Coverage:** At least 70% coverage is achieved for key business logic.
- **Automated Test Results:** 100% of unit, integration, and E2E tests pass successfully.
- **Critical Bugs:** All identified critical and high-priority bugs have been fixed and verified.
- **Documentation:** Test scenarios have been updated, and test results are documented.

## 9. Roles and Responsibilities

- **Developers:**
    - Responsible for writing unit and integration tests for the code they create.
    - Fixing bugs reported by QA.
- **QA Engineer / Tester (if applicable, otherwise a developer role):**
    - Creating and maintaining E2E tests.
    - Performing manual and exploratory testing.
    - Managing the bug reporting process.
    - Creating and updating the test plan.

## 10. Bug Reporting Procedures

1. **Identification:** Every found bug must be documented.
2. **Reporting:** Bugs will be reported as "Issues" in the project's GitHub repository.
3. **Report Format:**
    - **Title:** A short, concise description of the problem.
    - **Description:** A detailed description of the bug, including:
        - Steps to Reproduce.
        - Expected Behavior.
        - Actual Behavior.
        - Screenshots or video recordings.
        - Environment information (browser, operating system).
    - **Labels:** Assigning labels (e.g., `bug`, `ui`, `auth`) and priority (`critical`, `high`, `medium`, `low`).
4. **Triage and Assignment:** Reported bugs are analyzed and assigned to the appropriate developer.
5. **Fix and Verification:** After a bug is fixed, it is re-tested. If the test passes, the issue is closed.
