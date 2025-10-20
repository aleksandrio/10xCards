# View Implementation Plan: Study Mode

## 1. Overview
The Study Mode view provides an immersive, distraction-free interface for users to study the flashcards within a deck. It presents cards one by one in a random order, allows users to flip between the front and back, and navigate through the session. At the end of the session, users can choose to restart or return to the deck details page.

## 2. View Routing
-   **Path**: `/decks/[deckId]/study`
-   This will be a new dynamic Astro page located at `src/pages/decks/[deckId]/study.astro`.
-   The route is protected and requires user authentication.

## 3. Component Structure
The view will be an Astro page that renders a single, interactive React component island.

```
src/pages/decks/[deckId]/study.astro
  └── src/layouts/Layout.astro
      └── src/components/study/StudyView.tsx (client:load)
          ├── src/components/study/ProgressBar.tsx
          ├── src/components/study/StudyCard.tsx
          ├── src/components/study/NavigationControls.tsx
          └── src/components/study/SessionCompleteDialog.tsx
```

## 4. Component Details

### `StudyView.tsx`
-   **Component description**: The main container for the entire study session. It fetches flashcard data, manages the session state via a custom hook, and renders the UI components. It will be rendered as a React island within the Astro page.
-   **Main elements**: A `div` container that orchestrates the layout of its child components and attaches global keyboard event listeners.
-   **Handled interactions**:
    -   Initializes the study session.
    -   Listens for keyboard shortcuts (`Space` to flip, `ArrowLeft` for previous, `ArrowRight` for next).
-   **Handled validation**: Checks if the `flashcards` prop is empty. If so, it displays a message indicating the deck has no cards to study.
-   **Types**: `FlashcardDto[]`.
-   **Props**:
    -   `flashcards: FlashcardDto[]`: The complete list of flashcards for the deck.
    -   `deckId: string`: The ID of the current deck, used for the "Return to Deck" navigation.

### `ProgressBar.tsx`
-   **Component description**: A simple visual component that displays the user's progress through the study session (e.g., "Card 5 of 20").
-   **Main elements**: A `div` containing text. Can leverage the Shadcn/ui `Progress` component for a visual bar.
-   **Handled interactions**: None.
-   **Handled validation**: None.
-   **Types**: `StudySessionViewModel`.
-   **Props**:
    -   `currentIndex: number`: The index of the currently displayed card.
    -   `totalCards: number`: The total number of cards in the session.

### `StudyCard.tsx`
-   **Component description**: Displays the content of the current flashcard. It has a front and a back side and includes a flip animation on user interaction.
-   **Main elements**: A clickable `div` that uses CSS transitions for the flip effect. It will conditionally render the front or back text based on the `isFlipped` prop. Likely built using the Shadcn/ui `Card` component.
-   **Handled interactions**:
    -   `onClick`: Triggers the `onFlip` callback.
-   **Handled validation**: None.
-   **Types**: `FlashcardDto`.
-   **Props**:
    -   `frontText: string`: The text for the front of the card.
    -   `backText: string`: The text for the back of the card.
    -   `isFlipped: boolean`: Determines if the back of the card is visible.
    -   `onFlip: () => void`: A callback function to be invoked when the card is clicked.

### `NavigationControls.tsx`
-   **Component description**: Contains the "Previous" and "Next" buttons for navigating through the shuffled card sequence.
-   **Main elements**: Two Shadcn/ui `Button` components inside a container `div`.
-   **Handled interactions**:
    -   `onClick` on "Previous" button: Invokes the `onPrevious` callback.
    -   `onClick` on "Next" button: Invokes the `onNext` callback.
-   **Handled validation**:
    -   The "Previous" button is disabled if `currentIndex` is 0.
-   **Types**: `StudySessionViewModel`.
-   **Props**:
    -   `currentIndex: number`: The index of the current card.
    -   `totalCards: number`: The total number of cards.
    -   `onPrevious: () => void`: Callback for the "Previous" button.
    -   `onNext: () => void`: Callback for the "Next" button.

### `SessionCompleteDialog.tsx`
-   **Component description**: A modal dialog that appears after the user navigates past the last card in the session.
-   **Main elements**: A Shadcn/ui `AlertDialog` or `Dialog` component. It will contain a title, a description, and two action buttons ("Study Again" and "Return to Deck").
-   **Handled interactions**:
    -   `onClick` on "Study Again": Invokes the `onRestart` callback.
    -   `onClick` on "Return to Deck": Invokes the `onExit` callback.
-   **Handled validation**: None.
-   **Types**: None.
-   **Props**:
    -   `isOpen: boolean`: Controls the visibility of the dialog.
    -   `onRestart: () => void`: Callback to restart the session.
    -   `onExit: () => void`: Callback to navigate away from the study view.

## 5. Types
### Existing Types
-   **`FlashcardDto`**: Imported from `src/types.ts`. Used to pass flashcard data from the API to the view components.

### New ViewModel Types
-   **`StudySessionViewModel`**: A new type (or interface) representing the state of the study session. It will be managed within the `useStudySession` custom hook.
    ```typescript
    interface StudySessionViewModel {
      shuffledFlashcards: FlashcardDto[];
      currentIndex: number;
      isFlipped: boolean;
      isComplete: boolean;
      totalCards: number;
    }
    ```
    -   `shuffledFlashcards: FlashcardDto[]`: The array of flashcards in a randomized order.
    -   `currentIndex: number`: The index of the current card being viewed.
    -   `isFlipped: boolean`: `true` if the back of the card is showing.
    -   `isComplete: boolean`: `true` when the user has completed the session.
    -   `totalCards: number`: The total number of cards.

## 6. State Management
A custom hook, `useStudySession`, will be created to encapsulate all the logic related to managing the study session's state.

### `useStudySession.ts`
-   **Purpose**: To abstract the study session logic from the `StudyView` component, making it cleaner and easier to test.
-   **Input**: `initialFlashcards: FlashcardDto[]`.
-   **Internal State**: Manages an instance of `StudySessionViewModel`.
-   **Exposed API**:
    -   `currentCard: FlashcardDto | undefined`: The flashcard object for the current index.
    -   `currentIndex: number`: The current card's index.
    -   `totalCards: number`: Total number of cards.
    -   `isFlipped: boolean`: The flipped state of the current card.
    -   `isComplete: boolean`: The completion state of the session.
    -   `goToNext(): void`: Advances to the next card. Sets `isComplete` to true if on the last card.
    -   `goToPrevious(): void`: Moves to the previous card.
    -   `flipCard(): void`: Toggles the `isFlipped` state.
    -   `restartSession(): void`: Re-shuffles the cards and resets the session state.

## 7. API Integration
-   **Data Fetching**: The `study.astro` page will be responsible for server-side data fetching.
-   **Endpoint**: It will implicitly call the existing endpoint to get all flashcards for a specific deck. This likely translates to a service call like `flashcardService.getFlashcardsForDeck(deckId)`.
-   **Request**: `GET /api/decks/{deckId}/flashcards` (The implementation may be in `src/pages/api/decks/[id]/flashcards.ts`).
-   **Response**: A JSON array of `FlashcardDto` objects: `FlashcardDto[]`.
-   **Process**: The fetched array of flashcards will be passed as a prop to the `StudyView.tsx` React component.

## 8. User Interactions
-   **Load View**: The page loads, data is fetched, cards are shuffled, and the first card is displayed, front side up.
-   **Flip Card**: User clicks the card or presses `Space`. The card animates to reveal the other side.
-   **Navigate Next**: User clicks the "Next" button or presses `ArrowRight`. The view transitions to the next card in the sequence, front side up.
-   **Navigate Previous**: User clicks the "Previous" button or presses `ArrowLeft`. The view transitions to the previous card, front side up.
-   **Complete Session**: After viewing the last card, the user clicks "Next". The `SessionCompleteDialog` appears.
-   **Restart Session**: User clicks "Study Again" in the dialog. The cards are re-shuffled, the dialog closes, and the first card of the new sequence is shown.
-   **Exit Session**: User clicks "Return to Deck" in the dialog. The user is navigated to the deck detail page at `/decks/{deckId}`.

## 9. Conditions and Validation
-   **Authentication**: The Astro page will be behind the application's authentication middleware. Unauthenticated users will be redirected.
-   **Empty Deck**: The `study.astro` page must verify that the fetched `flashcards` array is not empty. If it is, it should render a user-friendly message (e.g., "This deck has no cards to study.") and a link to return to the previous page, instead of rendering the `StudyView` component.
-   **Navigation Boundaries**: The `NavigationControls` component will disable the "Previous" button when the user is on the first card (`currentIndex === 0`).

## 10. Error Handling
-   **API Fetch Failure**: If the server-side fetch in `study.astro` fails (e.g., network error, invalid `deckId`), the page should render a proper error boundary or a message like "Failed to load study session. Please try again."
-   **Unauthorized Access**: If the API returns a 403 or 404 because the user does not own the deck, the page should display an "Access Denied" or "Deck Not Found" message.

## 11. Implementation Steps
1.  **Create Astro Page**: Create the file `src/pages/decks/[deckId]/study.astro`. Implement server-side data fetching for the deck's flashcards. Handle the empty deck and API error cases.
2.  **Create Component Files**: Create the necessary files for the React components: `src/components/study/StudyView.tsx`, `ProgressBar.tsx`, `StudyCard.tsx`, `NavigationControls.tsx`, and `SessionCompleteDialog.tsx`.
3.  **Implement `useStudySession` Hook**: Develop the custom hook `src/lib/hooks/useStudySession.ts` to manage all session logic, including shuffling (`useEffect`), state management, and the exposed API functions.
4.  **Build UI Components**: Implement the individual React components, using Shadcn/ui components (`Card`, `Button`, `Progress`, `Dialog`) for styling and functionality. Wire up their props to the state and functions provided by the `useStudySession` hook.
5.  **Implement `StudyView`**: Assemble the child components inside `StudyView.tsx`. Initialize the `useStudySession` hook and pass its state and methods down to the children as props. Implement the keyboard event listeners in a `useEffect`.
6.  **Integrate React Island**: In `study.astro`, import and render the `StudyView` component as a client-side island (`client:load`), passing the fetched flashcards and `deckId` as props.
7.  **Styling**: Use Tailwind CSS to achieve the desired layout and styling for a distraction-free environment.
8.  **Testing**: Add unit tests for the `useStudySession` hook to verify its logic. Add component tests for the React components to ensure they render correctly based on props.
