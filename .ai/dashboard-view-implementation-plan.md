# View Implementation Plan: Dashboard

## 1. Overview
This document outlines the implementation plan for the main Dashboard View located at `/dashboard`. The primary purpose of this view is to serve as the central hub for users, allowing them to see a list of all their flashcard decks. It provides core deck management functionalities, including creating, renaming, and deleting decks, while also handling edge cases like loading states, empty states for new users, and enforcing system limits such as the maximum number of decks.

## 2. View Routing
-   **Path**: `/dashboard`
-   **Security**: This is a protected route. Unauthenticated users attempting to access this path should be redirected to the `/login` page. This logic will be enforced by the global Astro middleware.

## 3. Component Structure
The view will be built using a main Astro page which renders a single, stateful React component island.

```
/src/pages/dashboard.astro
└── /src/components/dashboard/DashboardView.tsx (client:load)
    ├── Header (h1, Deck Counter, CreateDeckButton)
    ├── SkeletonLoader (Conditional)
    ├── EmptyState (Conditional)
    ├── DeckGrid (Conditional)
    │   └── DeckCard[]
    │       └── DeckActionsMenu
    ├── CreateDeckModal (Conditional)
    ├── RenameDeckModal (Conditional)
    └── DeleteDeckDialog (Conditional)
```

## 4. Component Details

### `DashboardView.tsx`
-   **Component Description**: The main React component that controls the entire view. It fetches deck data, manages all local UI state (including which modals are open), and renders the appropriate child components based on the current state (loading, empty, or data loaded).
-   **Main Elements**:
    -   A header section containing an `<h1>` for the title ("My Decks"), a deck counter (`{totalDecks}/10`), and the `CreateDeckButton`.
    -   Conditionally renders `SkeletonLoader`, `EmptyState`, or `DeckGrid`.
    -   Renders the `CreateDeckModal`, `RenameDeckModal`, and `DeleteDeckDialog` components, controlling their visibility via state.
-   **Handled Interactions**: Manages the opening and closing of all modals by manipulating a central `modalState` variable.
-   **Types**: `DeckDto`, `ModalState` (internal type).
-   **Props**: None.

### `DeckGrid.tsx`
-   **Component Description**: A responsive grid that maps over an array of decks and renders a `DeckCard` for each one.
-   **Main Elements**: A `<div>` element with Tailwind CSS classes for a responsive grid layout (e.g., `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`).
-   **Handled Interactions**: None.
-   **Types**: `DeckDto[]`.
-   **Props**:
    -   `decks: DeckDto[]`
    -   `onRename: (deck: DeckDto) => void`
    -   `onDelete: (deck: DeckDto) => void`

### `DeckCard.tsx`
-   **Component Description**: A card representing a single deck. It's clickable to navigate to the deck's detail page and contains a menu for actions.
-   **Main Elements**:
    -   An `<a>` tag wrapping the card content, linking to `/decks/{deck.id}`.
    -   `<h3>` for the deck name.
    -   `<p>` for the flashcard count.
    -   A `DeckActionsMenu` component.
-   **Handled Interactions**: Navigation on click. Passes rename/delete events up to the parent.
-   **Types**: `DeckDto`.
-   **Props**:
    -   `deck: DeckDto`
    -   `onRename: (deck: DeckDto) => void`
    -   `onDelete: (deck: DeckDto) => void`

### `CreateDeckModal.tsx` / `RenameDeckModal.tsx`
-   **Component Description**: A modal form for creating or renaming a deck, built using Shadcn/ui `Dialog`.
-   **Main Elements**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Input` for the deck name, and `Button` for "Cancel" and "Save".
-   **Handled Interactions**: Form submission, input changes for validation.
-   **Handled Validation**:
    -   Name is required: `name.trim().length > 0`.
    -   Name max length is 100: `name.length <= 100`.
    -   The "Save" button will be disabled if validation fails.
-   **Types**: `CreateDeckCommand`, `UpdateDeckCommand`.
-   **Props**:
    -   `isOpen: boolean`
    -   `onClose: () => void`
    -   `onSubmit: (name: string) => Promise<void>`
    -   `initialData?: DeckDto` (for `RenameDeckModal`)

### `DeleteDeckDialog.tsx`
-   **Component Description**: A confirmation dialog to prevent accidental deletion, built using Shadcn/ui `AlertDialog`.
-   **Main Elements**: `AlertDialog`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, and buttons for "Cancel" and "Confirm".
-   **Handled Interactions**: Confirmation and cancellation of the delete action.
-   **Types**: `DeckDto`.
-   **Props**:
    -   `isOpen: boolean`
    -   `onClose: () => void`
    -   `onConfirm: () => Promise<void>`
    -   `deck: DeckDto`

## 5. Types

### DTOs (from `src/types.ts`)
The view will primarily use the existing `DeckDto`.

```typescript
// src/types.ts
export interface DeckDto {
  id: string;
  name: string;
  flashcardCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### ViewModel / State Types
A new discriminated union type will be created within `DashboardView.tsx` to manage the state of all modals cleanly.

```typescript
type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'rename'; deck: DeckDto }
  | { type: 'delete'; deck: DeckDto };
```

## 6. State Management
State will be managed via a custom React hook, `useDecks`, to encapsulate all business logic and API interactions related to decks.

### `useDecks` Custom Hook (`src/lib/hooks/useDecks.ts`)
-   **Purpose**: Provides a clean interface for the `DashboardView` to interact with deck data. It handles fetching, creating, renaming, and deleting decks, along with managing the associated loading and error states.
-   **Internal State**:
    -   `decks: DeckDto[]`
    -   `totalDecks: number`
    -   `isLoading: boolean`
    -   `error: Error | null`
-   **Returned API**:
    -   `{ decks, totalDecks, isLoading, error, createDeck, renameDeck, deleteDeck }`

## 7. API Integration
The `useDecks` hook will be responsible for all API calls.

-   **Fetch Decks**:
    -   **Endpoint**: `GET /api/decks`
    -   **Request**: Called on initial mount with parameters `?pageSize=10&sortBy=updated_at&sortOrder=desc` to fetch all possible decks for the user.
    -   **Response Type**: `PaginatedResponse<DeckDto>`. The hook will extract `data` and `pagination.totalItems`.
-   **Create Deck**:
    -   **Endpoint**: `POST /api/decks`
    -   **Request Type**: `CreateDeckCommand` (`{ name: string }`).
    -   **Response Type**: `DeckDto`.
-   **Rename Deck**:
    -   **Endpoint**: `PATCH /api/decks/{deckId}`
    -   **Request Type**: `UpdateDeckCommand` (`{ name: string }`).
    -   **Response Type**: `DeckDto`.
-   **Delete Deck**:
    -   **Endpoint**: `DELETE /api/decks/{deckId}`
    -   **Response**: `204 No Content`.

After each mutation (`create`, `rename`, `delete`), the hook will re-fetch the list of decks to ensure the UI is in sync with the server state.

## 8. User Interactions
-   **View Load**: User navigates to `/dashboard`. The `SkeletonLoader` is shown. `useDecks` fetches data. View updates to show `EmptyState` or `DeckGrid`.
-   **Create Deck**: User clicks "Create New Deck". The `CreateDeckModal` opens. User enters a name and clicks "Save". `useDecks.createDeck` is called. On success, the modal closes and the deck list updates.
-   **Rename Deck**: User clicks the 3-dot menu on a `DeckCard` and selects "Rename". The `RenameDeckModal` opens. User edits the name and clicks "Save". `useDecks.renameDeck` is called. On success, the modal closes and the list updates.
-   **Delete Deck**: User clicks the 3-dot menu and selects "Delete". The `DeleteDeckDialog` opens. User clicks "Confirm". `useDecks.deleteDeck` is called. On success, the dialog closes and the list updates.

## 9. Conditions and Validation
-   **Deck Limit**: The "Create New Deck" button will be disabled if `totalDecks >= 10`. A tooltip will inform the user why it's disabled.
-   **Deck Name Validation**: In `CreateDeckModal` and `RenameDeckModal`, the "Save" button will be disabled if the name input is empty or exceeds 100 characters. Helper text will appear below the input to guide the user.

## 10. Error Handling
-   **API Fetch Error**: If the initial `GET /api/decks` call fails, the `useDecks` hook will populate its `error` state. The `DashboardView` will display a full-page error message instead of the grid or empty state.
-   **Mutation Errors**: If `createDeck`, `renameDeck`, or `deleteDeck` calls fail (e.g., due to a server error or validation failure like 400/403), the error will be caught. A toast notification (using a library like `react-hot-toast`) will be displayed with a user-friendly message (e.g., "Failed to create deck. Please try again."). The modal will remain open for the user to correct any input if applicable.
-   **Not Found (404)**: If a rename/delete operation fails with a 404, it means the deck was likely deleted elsewhere. The UI should gracefully handle this by re-fetching the deck list, which will remove the stale deck.

## 11. Implementation Steps
1.  **Create File Structure**: Create the new files: `/src/pages/dashboard.astro`, `/src/components/dashboard/DashboardView.tsx`, and other related component files, plus `/src/lib/hooks/useDecks.ts`.
2.  **Develop `useDecks` Hook**: Implement the custom hook with state for `decks`, `isLoading`, `error`, and `totalDecks`. Add the `fetchDecks` logic inside a `useEffect` hook.
3.  **Build Static Components**: Implement the stateless components: `DeckGrid`, `DeckCard`, `DeckActionsMenu`, `EmptyState`, and `SkeletonLoader`.
4.  **Implement `DashboardView`**:
    -   Set up the main component to use the `useDecks` hook.
    -   Implement the conditional rendering logic: `isLoading` -> `SkeletonLoader`, `error` -> Error message, `decks.length === 0` -> `EmptyState`, otherwise -> `DeckGrid`.
5.  **Build Modals**:
    -   Implement `CreateDeckModal`, `RenameDeckModal`, and `DeleteDeckDialog` using Shadcn/ui components.
    -   Add client-side validation for the forms.
6.  **Integrate Modals and State**:
    -   In `DashboardView`, add the `ModalState` type and the `useState` for managing it.
    -   Wire up the buttons in `DeckActionsMenu` and `CreateDeckButton` to update the `modalState` and open the correct modals.
7.  **Implement Mutation Functions**:
    -   Add `createDeck`, `renameDeck`, and `deleteDeck` functions to the `useDecks` hook.
    -   These functions will perform the API calls and trigger a re-fetch of the deck list upon success.
    -   Connect the `onSubmit` and `onConfirm` props of the modals to these functions.
8.  **Add Error Handling**: Implement toast notifications for API errors during create, rename, and delete operations.
9.  **Final Touches & Styling**: Ensure all components are styled correctly with Tailwind CSS and are fully responsive according to the PRD. Add accessibility attributes where necessary.
10. **Create Astro Page**: Create `dashboard.astro`, import the `DashboardView` React component, and render it with the `client:load` directive to make it interactive. Ensure the page layout is wrapped in the main `Layout.astro`.

