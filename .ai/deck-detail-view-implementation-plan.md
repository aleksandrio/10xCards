# Deck Detail View Implementation Plan

## 1. Overview
This document outlines the implementation plan for the Deck Detail View, located at the path `/decks/{deckId}`. This view is the central hub for managing flashcards within a specific deck. Its primary functions are to display a list of all flashcards, provide tools for creating, updating, and deleting them, and offer a gateway to the AI-powered flashcard generation flow and the study mode.

## 2. View Routing
The Deck Detail View will be a dynamic Astro page accessible at the following path:
- **Path**: `src/pages/decks/[deckId].astro`

This route must be protected, ensuring that only authenticated users can access it. Unauthenticated users will be redirected to the `/login` page.

## 3. Component Structure
The view will be built using a hierarchical structure of React components, rendered as a client-side island within the main Astro page.

```
DeckDetailPage.astro
└── Layout.astro
    └── DeckDetailView.tsx (React Island)
        ├── DeckHeader.tsx
        ├── ActionToolbar.tsx
        ├── FlashcardList.tsx
        |   ├── FlashcardListItem.tsx
        |   └── SkeletonLoader.tsx
        ├── EmptyState.tsx
        ├── AddFlashcardModal.tsx
        ├── EditFlashcardModal.tsx
        ├── GenerationModal.tsx
        └── ConfirmationDialog.tsx
```

## 4. Component Details

### `DeckDetailView.tsx`
- **Component description**: This is the main stateful component that orchestrates the entire view. It fetches all necessary data, manages the application state, and renders the appropriate child components.
- **Main elements**: It renders `DeckHeader`, `ActionToolbar`, and conditionally `FlashcardList` or `EmptyState`. It also manages the visibility of all modal dialogs.
- **Handled interactions**: Handles the opening/closing of all modals (`AddFlashcardModal`, `EditFlashcardModal`, `GenerationModal`, `ConfirmationDialog`).
- **Types**: `DeckDetailViewModel`
- **Props**: `{ deckId: string; initialDeck: DeckDto; initialFlashcards: PaginatedResponse<FlashcardDto>; }`

### `DeckHeader.tsx`
- **Component description**: Displays the deck's name and provides breadcrumb navigation back to the dashboard.
- **Main elements**: `<h1>` for the deck name, and a breadcrumb component (`<nav>`).
- **Types**: `DeckDto`
- **Props**: `{ deck: DeckDto | null; }`

### `ActionToolbar.tsx`
- **Component description**: A toolbar containing the primary actions a user can take within the deck.
- **Main elements**: Three Shadcn/ui `Button` components: "Study This Deck", "Generate Flashcards", and "Add Card Manually".
- **Handled interactions**:
    - `onStudy`: Navigates the user to the study view.
    - `onGenerate`: Opens the `GenerationModal`.
    - `onAdd`: Opens the `AddFlashcardModal`.
- **Props**: `{ onStudy: () => void; onGenerate: () => void; onAdd: () => void; deckIsStudiable: boolean; deckIsFull: boolean; }`

### `FlashcardList.tsx`
- **Component description**: Renders the list of flashcards. It is responsible for the infinite scroll behavior and displaying a responsive layout (table on desktop, list on mobile).
- **Main elements**: A `<table>` for desktop view and a series of `<div>`s for mobile view. It maps over the flashcard data to render `FlashcardListItem` components. It also includes an intersection observer target at the bottom to trigger loading more items.
- **Handled interactions**: Triggers the `onLoadMore` function when the user scrolls to the end of the list.
- **Types**: `FlashcardDto[]`
- **Props**: `{ flashcards: FlashcardDto[]; hasMore: boolean; onLoadMore: () => void; onEdit: (card: FlashcardDto) => void; onDelete: (card: FlashcardDto) => void; }`

### `FlashcardListItem.tsx`
- **Component description**: Represents a single flashcard in the list.
- **Main elements**: Table cells (`<td>`) or divs (`<div>`) for "Front" and "Back" text. Includes "Edit" and "Delete" buttons.
- **Handled interactions**:
    - `onEdit`: Fires when the edit button is clicked.
    - `onDelete`: Fires when the delete button is clicked.
- **Types**: `FlashcardDto`
- **Props**: `{ flashcard: FlashcardDto; onEdit: (card: FlashcardDto) => void; onDelete: (card: FlashcardDto) => void; }`

### `GenerationModal.tsx`
- **Component description**: A stateful, multi-step modal that handles the entire AI flashcard generation flow.
- **Main elements**: The content changes based on the current step: a `textarea` for input, a loading spinner, a list of suggested cards with checkboxes for review, and an error message display.
- **Handled interactions**: Manages form submission for text input, selection/deselection of suggested cards, and final submission to add cards to the deck.
- **Validation**:
    - Input text must not be empty.
    - Input text must be <= 5000 characters.
- **Types**: `GenerationModalViewModel`, `SuggestedFlashcard`
- **Props**: `{ isOpen: boolean; onClose: () => void; onComplete: () => void; deckId: string; }`

## 5. Types

### `DeckDetailViewModel`
This will be the main state object for the view.
```typescript
interface DeckDetailViewModel {
  deck: DeckDto | null;
  flashcards: FlashcardDto[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    total: number;
  };
}
```

### `GenerationModalViewModel`
Manages the state for the multi-step generation modal.
```typescript
type GenerationStep = 'input' | 'loading' | 'review' | 'error';

interface GenerationModalViewModel {
  step: GenerationStep;
  inputText: string;
  generationId: string | null;
  suggestedFlashcards: SuggestedFlashcard[];
  selectedFlashcards: SuggestedFlashcard[];
  error: string | null;
}
```

## 6. State Management
State will be managed within the `DeckDetailView.tsx` component using React's `useState` and `useReducer` hooks. To encapsulate logic and keep the main component clean, a custom hook `useDeckDetail` will be created.

### `useDeckDetail(deckId, initialData)`
- **Purpose**: To manage the state and data-related actions for the Deck Detail view.
- **State Managed**: `DeckDetailViewModel`.
- **Responsibilities**:
    - Fetching the initial deck and flashcard data.
    - Handling pagination and fetching subsequent pages of flashcards for infinite scroll.
    - Providing memoized callback functions for CRUD operations (add, update, delete) that update the local state optimistically and call the API.

## 7. API Integration

- **`GET /api/decks/{deckId}`**: Fetched on initial load to get deck details.
    - **Response**: `DeckDto`
- **`GET /api/decks/{deckId}/flashcards`**: Fetched on initial load and for infinite scroll.
    - **Query Params**: `page`, `pageSize`
    - **Response**: `PaginatedResponse<FlashcardDto>`
- **`POST /api/decks/{deckId}/flashcards`**: Used by `AddFlashcardModal`.
    - **Request**: `CreateFlashcardCommand`
    - **Response**: `FlashcardDto`
- **`PATCH /api/flashcards/{flashcardId}`**: Used by `EditFlashcardModal`.
    - **Request**: `UpdateFlashcardCommand`
    - **Response**: `FlashcardDto`
- **`DELETE /api/flashcards/{flashcardId}`**: Used on "Delete" confirmation.
    - **Response**: `204 No Content`
- **`POST /api/decks/{deckId}/generate`**: First step in `GenerationModal`.
    - **Request**: `GenerateFlashcardsCommand`
    - **Response**: `SuggestedFlashcardsDto`
- **`POST /api/decks/{deckId}/flashcards/bulk`**: Final step in `GenerationModal`.
    - **Request**: `BulkCreateFlashcardsCommand`
    - **Response**: `BulkCreateFlashcardsResponseDto`

## 8. User Interactions

- **Scroll to Bottom**: Triggers fetching the next page of flashcards. A loading indicator is shown at the bottom of the list.
- **Click "Add Card Manually"**: Opens a modal with a form to enter "Front" and "Back" text.
- **Click "Generate Flashcards"**: Opens a multi-step modal to generate cards using AI.
- **Click "Edit" on a Flashcard**: Opens a modal pre-populated with the flashcard's current text for editing.
- **Click "Delete" on a Flashcard**: Opens a confirmation dialog to prevent accidental deletion.

## 9. Conditions and Validation

- **Empty Deck**: If `deck.flashcardCount === 0`, the `EmptyState` component is rendered, and the "Study This Deck" button is disabled.
- **Full Deck**: If `deck.flashcardCount >= 100`, the "Add Card Manually" and "Generate Flashcards" buttons are disabled to prevent adding more cards.
- **Form Validation (Add/Edit Flashcard)**:
    - `front`: Required, max 200 characters.
    - `back`: Required, max 500 characters.
    - The "Save" button in the modal is disabled until both fields are valid.
- **Form Validation (Generate Flashcards)**:
    - `text`: Required, max 5000 characters.
    - The "Generate" button in the modal is disabled until the text area is valid. A character count is displayed to the user.

## 10. Error Handling

- **Global Feedback**: A global `ToastNotifier` component will be used to display success or error messages for all API operations.
- **Not Found (404)**: If the initial fetch for the deck fails with a 404, a "Deck not found" message will be displayed with a link back to the dashboard.
- **Deck Full (403)**: If an attempt to add a card fails because the deck is full, a specific toast message will inform the user of the 100-card limit.
- **AI Generation Failure (500)**: If the `/generate` endpoint fails, the `GenerationModal` will display a dedicated error step with a user-friendly message, as per user story US-018.
- **Network Errors**: All API calls will be wrapped in `try...catch` blocks to handle network failures, displaying a generic "Network error" toast.

## 11. Implementation Steps
1.  **Create Astro Page**: Create the file `src/pages/decks/[deckId].astro`. Implement server-side data fetching (`getStaticPaths` and page props) to get initial deck and flashcard data.
2.  **Build `DeckDetailView.tsx`**: Create the main React component. Set up the basic layout and state management structure using the `useDeckDetail` hook placeholder.
3.  **Develop Static Components**: Create `DeckHeader.tsx` and `ActionToolbar.tsx`, passing props from the main view.
4.  **Implement Flashcard List**: Build `FlashcardList.tsx` and `FlashcardListItem.tsx`. Implement the responsive table/list layout and pass down edit/delete handlers.
5.  **Integrate API Data**: Implement the `useDeckDetail` hook to fetch and manage paginated flashcard data. Connect this data to the `FlashcardList`. Implement the infinite scroll logic using an Intersection Observer.
6.  **Create CRUD Modals**: Build the `AddFlashcardModal` and `EditFlashcardModal` with Shadcn/ui components (`Dialog`, `Input`, `Textarea`, `Button`). Implement form validation using a library like `zod` and `react-hook-form`.
7.  **Implement CRUD Logic**: Wire up the "Add", "Edit", and "Delete" actions. The handlers in `useDeckDetail` should call the respective API endpoints and update the local state on success. Use the `ConfirmationDialog` for the delete action.
8.  **Build `GenerationModal.tsx`**: Create the multi-step `GenerationModal`. Implement the state machine for the 'input', 'loading', 'review', and 'error' steps.
9.  **Integrate Generation API**: Implement the API calls for `/generate` and `/flashcards/bulk`. Wire them into the modal's state transitions. On successful completion, trigger a refetch of the main flashcard list.
10. **Finalize UI States**: Implement the `EmptyState` and `SkeletonLoader` components. Ensure all loading, empty, and error states are handled correctly throughout the view.
11. **Refine and Test**: Thoroughly test all user flows, including edge cases like handling a full deck, API errors, and form validation. Ensure the view is fully responsive.
