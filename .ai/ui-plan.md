# UI Architecture for 10xCards

## 1. UI Structure Overview

The UI for 10xCards is designed as a single-page application (SPA) built with Astro and interactive React islands. The architecture prioritizes a clean, responsive, and accessible user experience, guided by the Shadcn/ui component library for consistency.

The structure is divided into two main areas:
-   **Public Area**: Accessible to all visitors, containing authentication-related views (Login, Register, Forgot Password).
-   **Private Area**: Accessible only to authenticated users, which includes the main application functionality like the user dashboard, deck details, and the study mode.

State management for the MVP will be handled by React hooks (`useState`, `useEffect`) for local component state and the React Context API for global state, primarily for authentication status. A global `AuthContext` will provide user data and session status to all private views, and a route protection mechanism will redirect unauthenticated users from private to public views.

## 2. View List

### 2.1. Authentication Views

#### Login View
-   **View Path**: `/login`
-   **Main Purpose**: To allow existing users to sign in.
-   **Key Information**: Email and password fields.
-   **Key View Components**:
    -   `LoginForm`: A form with fields for email and password.
    -   `SubmitButton`: With a loading state to indicate an in-progress authentication attempt.
    -   Links to `/register` ("Don't have an account?") and `/forgot-password`.
-   **UX, Accessibility & Security**:
    -   **UX**: Inline validation for email format and password presence. Displays API error messages (e.g., "Invalid credentials") via toast notifications.
    -   **Accessibility**: All form fields will have `aria-label` attributes and be associated with `<label>` elements. Full keyboard navigability.
    -   **Security**: The view is the entry point to the secure area. On successful login, the app stores the JWT securely and redirects to `/dashboard`.

#### Registration View
-   **View Path**: `/register`
-   **Main Purpose**: To allow new users to create an account.
-   **Key Information**: Email, password, and confirm password fields.
-   **Key View Components**:
    -   `RegistrationForm`: A form with fields for email, password, and password confirmation.
    -   `SubmitButton`: With a loading state.
    -   Link to `/login` ("Already have an account?").
-   **UX, Accessibility & Security**:
    -   **UX**: Inline validation for matching passwords and valid email format. Displays API errors (e.g., "Email already in use") via toast.
    -   **Accessibility**: Follows the same standards as the Login view.
    -   **Security**: Redirects to `/dashboard` upon successful registration and login.

#### Forgot Password & Reset Password Views
-   **View Path**: `/forgot-password`, `/reset-password`
-   **Main Purpose**: To allow users to reset a forgotten password.
-   **Key Information**: Email input (`/forgot-password`), new password and confirmation inputs (`/reset-password`).
-   **Key View Components**:
    -   `ForgotPasswordForm`: A simple form with an email input.
    -   `ResetPasswordForm`: A form to set the new password.
-   **UX, Accessibility & Security**:
    -   **UX**: The forgot password page displays a confirmation message after the form is submitted, instructing the user to check their email.
    -   **Security**: The reset password page is accessed via a unique, time-sensitive token sent to the user's email.

---

### 2.2. Application Views

#### Dashboard View
-   **View Path**: `/dashboard`
-   **Main Purpose**: To display all of a user's decks and serve as the main navigation hub.
-   **Key Information**: A list of decks with their names and flashcard counts. A counter for the number of decks (`x/10`).
-   **Key View Components**:
    -   `DeckGrid`: A responsive grid that displays `DeckCard` components.
    -   `DeckCard`: A clickable card that navigates to the `/decks/{deckId}` view. It displays the deck name, flashcard count, and a three-dot menu.
    -   `DeckActionsMenu`: A dropdown menu on each card with "Rename" and "Delete" options, which open modals.
    -   `CreateDeckButton`: A primary button that opens a modal to create a new deck. Disabled if the user has 10 decks.
    -   `EmptyState`: A component shown to new users or users with no decks, with a clear call-to-action to create their first deck.
    -   `SkeletonLoader`: Used to provide a loading state while fetching the list of decks.
-   **UX, Accessibility & Security**:
    -   **UX**: The grid layout adapts to different screen sizes. A confirmation modal prevents accidental deck deletion.
    -   **Accessibility**: Each deck card is a focusable element. The actions menu is fully keyboard accessible.
    -   **Security**: This is a protected route. Unauthenticated access redirects to `/login`.

#### Deck Detail View
-   **View Path**: `/decks/{deckId}`
-   **Main Purpose**: To view and manage all flashcards within a specific deck.
-   **Key Information**: Deck name, list of flashcards (front and back), flashcard count (`x/100`).
-   **Key View Components**:
    -   `DeckHeader`: Displays the deck name and includes `Breadcrumbs` for navigation back to the dashboard.
    -   `ActionToolbar`: A set of primary buttons: "Study This Deck," "Generate Flashcards," and "Add Card Manually."
    -   `FlashcardList`: Displays flashcards using an infinite scroll mechanism. On desktop, this is a table; on mobile, it reflows into a single-column list.
    -   `FlashcardListItem`: A row or item in the list showing front/back text and controls to "Edit" or "Delete" the card.
    -   `EmptyState`: Shown if a deck has no flashcards, with CTAs to generate or add them.
    -   `GenerationModal`: A multi-step modal for the AI generation flow (input -> loading -> review).
-   **UX, Accessibility & Security**:
    -   **UX**: The "Study This Deck" button is disabled if there are 0 flashcards. The flashcard limit is clearly displayed. Infinite scroll provides a smooth experience for long lists.
    -   **Accessibility**: The flashcard list is navigable by keyboard. All buttons and controls are clearly labeled.
    -   **Security**: Protected route. All data operations are scoped to the authenticated user.

#### Study Mode View
-   **View Path**: `/decks/{deckId}/study`
-   **Main Purpose**: To provide an immersive, distraction-free environment for studying a deck.
-   **Key Information**: The current flashcard (front or back), and the user's progress through the session.
-   **Key View Components**:
    -   `StudyCard`: A large, central card component that flips on click or keypress to reveal the back.
    -   `NavigationControls`: "Previous" and "Next" buttons to move through the randomized card sequence.
    -   `ProgressBar`: A visual indicator of the session progress (e.g., "Card 5 of 20").
    -   `SessionCompleteDialog`: A modal that appears at the end of a session with options to "Study Again" or "Return to Deck."
-   **UX, Accessibility & Security**:
    -   **UX**: The card order is randomized for each new session. Keyboard shortcuts (`Space` to flip, `Arrow Keys` to navigate) are supported for a faster workflow.
    -   **Accessibility**: The card and controls are fully focusable and operable via keyboard. Text is large and readable.
    -   **Security**: Protected route.

## 3. User Journey Map

The primary user journey focuses on quickly moving from raw text to an active study session.

1.  **Authentication**: A new user signs up at `/register` and is automatically logged in and redirected to `/dashboard`. A returning user signs in at `/login`.
2.  **Dashboard (First Contact)**: The user sees an empty dashboard and is prompted to create a deck.
3.  **Deck Creation**: The user clicks "Create New Deck," enters a name in a modal, and the new deck appears on the dashboard.
4.  **Navigate to Deck**: The user clicks the new deck card, navigating to `/decks/{deckId}`.
5.  **Card Generation**: On the Deck Detail view (which is empty), the user clicks "Generate Flashcards."
    -   **Modal Step 1 (Input)**: The user pastes their notes into a textarea.
    -   **Modal Step 2 (Loading)**: A loading state is shown.
    -   **Modal Step 3 (Review)**: The user reviews the AI-generated cards, editing or deleting any irrelevant ones.
    -   **Modal Step 4 (Save)**: The user clicks "Add to Deck," and the curated cards are saved.
6.  **View and Study**: The flashcards now populate the Deck Detail view. The "Study This Deck" button becomes enabled. The user clicks it.
7.  **Study Session**: The user is taken to `/decks/{deckId}/study`, where they can flip through the randomized cards.
8.  **Session Completion**: After the last card, a dialog appears. The user can choose to return to the Deck Detail view.
9.  **Logout**: From the header's user menu, the user signs out and is redirected to `/login`.

## 4. Layout and Navigation Structure

-   **Main Layout**: A persistent layout component wraps all private views (`/dashboard`, `/decks/*`). It contains the main header.
-   **Header**: The header is the primary navigation element.
    -   **Left Side**: Contains the "10xCards" logo, which acts as a link to the `/dashboard`.
    -   **Right Side**: Contains a `UserMenu` dropdown.
-   **UserMenu**: This dropdown displays the authenticated user's email and contains the "Sign Out" action.
-   **Breadcrumbs**: On the Deck Detail view, breadcrumbs will provide contextual navigation back to the parent view (e.g., `Dashboard > History 101`).
-   **Programmatic Navigation**: Users are navigated between views primarily by clicking on elements (like a `DeckCard`) or after completing an action (like logging in or creating a deck).

## 5. Key Components

This is a list of key reusable components to be built using Shadcn/ui primitives.

-   **`ToastNotifier`**: Used globally to display feedback for API operations (e.g., "Deck created successfully," "Network error").
-   **`ConfirmationDialog`**: A modal used to confirm destructive actions, such as deleting a deck or a flashcard. It includes "Confirm" and "Cancel" actions.
-   **`GenerationModal`**: A stateful, multi-step modal component that encapsulates the entire AI generation user flow. It will manage its own internal state for text input, loading, and the list of suggested cards.
-   **`SkeletonLoader`**: A generic component used to represent the shape of content that is still loading, improving the perceived performance on initial page loads (e.g., for the `DeckGrid` and `FlashcardList`).
-   **`EmptyState`**: A reusable component displayed when a list or view has no content. It contains an icon, a message, and a primary call-to-action button.
-   **`AuthContext Provider`**: A non-visual component that wraps the entire application to provide global access to the user's authentication status and data.
-   **`ProtectedRoute`**: A higher-order component or layout that checks for an active session. If no session exists, it redirects the user to the `/login` page.
