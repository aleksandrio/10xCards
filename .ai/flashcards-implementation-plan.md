# API Endpoint Implementation Plan: Flashcards Resource

## 1. Endpoint Overview

This document outlines the implementation plan for the REST API endpoints for managing Flashcards. This resource is a sub-resource of Decks, but also allows direct access to flashcards for updates and deletion.

The plan covers five distinct endpoints:
-   `GET /api/decks/{deckId}/flashcards`: Retrieve all flashcards in a deck.
-   `POST /api/decks/{deckId}/flashcards`: Create a new flashcard manually.
-   `PATCH /api/flashcards/{flashcardId}`: Update an existing flashcard.
-   `DELETE /api/flashcards/{flashcardId}`: Delete a flashcard.
-   `POST /api/decks/{deckId}/flashcards/bulk`: Bulk-create flashcards from an AI generation.

## 2. Request Details

### `GET /api/decks/{deckId}/flashcards`
-   **HTTP Method**: `GET`
-   **URL Structure**: `/api/decks/{deckId}/flashcards`
-   **Parameters**:
    -   `deckId` (required, URL path, UUID): The ID of the deck.
    -   `page` (optional, query, number, default: 1): The page number for pagination.
    -   `pageSize` (optional, query, number, default: 20): The number of items per page.

### `POST /api/decks/{deckId}/flashcards`
-   **HTTP Method**: `POST`
-   **URL Structure**: `/api/decks/{deckId}/flashcards`
-   **Parameters**:
    -   `deckId` (required, URL path, UUID): The ID of the deck.
-   **Request Body**: `CreateFlashcardCommand`
    ```json
    {
      "front": "What is H2O?",
      "back": "Water"
    }
    ```

### `PATCH /api/flashcards/{flashcardId}`
-   **HTTP Method**: `PATCH`
-   **URL Structure**: `/api/flashcards/{flashcardId}`
-   **Parameters**:
    -   `flashcardId` (required, URL path, UUID): The ID of the flashcard to update.
-   **Request Body**: `UpdateFlashcardCommand`
    ```json
    {
      "front": "What is the chemical symbol for water?",
      "back": "H2O"
    }
    ```

### `DELETE /api/flashcards/{flashcardId}`
-   **HTTP Method**: `DELETE`
-   **URL Structure**: `/api/flashcards/{flashcardId}`
-   **Parameters**:
    -   `flashcardId` (required, URL path, UUID): The ID of the flashcard to delete.

### `POST /api/decks/{deckId}/flashcards/bulk`
-   **HTTP Method**: `POST`
-   **URL Structure**: `/api/decks/{deckId}/flashcards/bulk`
-   **Parameters**:
    -   `deckId` (required, URL path, UUID): The ID of the deck.
-   **Request Body**: `BulkCreateFlashcardsCommand`
    ```json
    {
      "generationId": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "flashcards": [
        { "front": "...", "back": "..." }
      ]
    }
    ```

## 3. Used Types
The implementation will use DTOs and Command Models defined in `src/types.ts`:
-   **DTOs**: `FlashcardDto`, `PaginatedResponse<FlashcardDto>`, `BulkCreateFlashcardsResponseDto`
-   **Command Models**: `CreateFlashcardCommand`, `UpdateFlashcardCommand`, `BulkCreateFlashcardsCommand`

## 4. Response Details

### `GET /api/decks/{deckId}/flashcards`
-   **Success (200 OK)**: A `PaginatedResponse<FlashcardDto>` object.
-   **Errors**: `400`, `401`, `404`, `500`.

### `POST /api/decks/{deckId}/flashcards`
-   **Success (201 Created)**: A `FlashcardDto` object representing the newly created flashcard.
-   **Errors**: `400`, `401`, `403`, `404`, `500`.

### `PATCH /api/flashcards/{flashcardId}`
-   **Success (200 OK)**: A `FlashcardDto` object representing the updated flashcard.
-   **Errors**: `400`, `401`, `404`, `500`.

### `DELETE /api/flashcards/{flashcardId}`
-   **Success (204 No Content)**: An empty response body.
-   **Errors**: `401`, `404`, `500`.

### `POST /api/decks/{deckId}/flashcards/bulk`
-   **Success (201 Created)**: A `BulkCreateFlashcardsResponseDto` object.
-   **Errors**: `400`, `401`, `404`, `409`, `500`.

## 5. Data Flow

All business logic will be encapsulated in a new service file, `src/lib/flashcardService.ts`. The Astro API route handlers will be responsible for parsing HTTP requests, invoking the service methods, and returning the appropriate HTTP responses.

1.  An incoming API request is received by the corresponding Astro endpoint (`/pages/api/...`).
2.  The handler authenticates the user using `context.locals.user`.
3.  The handler parses and validates URL parameters and the request body using Zod schemas defined in `src/lib/schemas.ts`.
4.  The handler calls the appropriate method in `flashcardService.ts`, passing the validated data and `userId`.
5.  The flashcard service executes the business logic, which includes:
    -   Verifying that the user owns the deck/flashcard.
    -   Performing the required database operation (SELECT, INSERT, UPDATE, DELETE) using the Supabase client.
    -   For bulk creation, wrapping multiple database calls in a transaction.
6.  The service returns data or throws a custom error.
7.  The API handler catches any errors and maps them to the correct HTTP status code and response body.
8.  On success, the handler maps the service's return data to the specified DTO and sends the response.

## 6. Security Considerations

-   **Authentication**: All endpoints are protected and require a valid user session. The `Astro.locals.user` object, populated by the auth middleware, will be used to identify the user.
-   **Authorization**: This is the most critical security aspect. The `flashcardService` must ensure that a user can only operate on their own resources.
    -   For deck-specific actions (`/api/decks/{deckId}/...`), the service must first query the `decks` table to confirm that `deck.user_id` matches the authenticated user's ID.
    -   For flashcard-specific actions (`/api/flashcards/{flashcardId}`), the service must perform a JOIN between `flashcards` and `decks` to verify that the `deck` associated with the `flashcard` belongs to the authenticated user.
-   **Input Validation**: All incoming data (URL params, query params, and request bodies) will be strictly validated using Zod to prevent malformed data from reaching the service layer and to protect against injection-style attacks.

## 7. Error Handling

The API will return standard HTTP status codes to indicate the outcome of a request.

| Status Code | Reason |
| --- | --- |
| `400 Bad Request` | Invalid input data (e.g., failed Zod validation, invalid UUID, non-integer pagination). |
| `401 Unauthorized` | User is not authenticated. |
| `403 Forbidden` | User is trying to add a card to a full deck (100 card limit). |
| `404 Not Found` | The specified `deck` or `flashcard` does not exist or does not belong to the user. |
| `409 Conflict` | The `generationId` provided in a bulk-create request has already been processed. |
| `500 Internal Server Error` | An unexpected error occurred on the server (e.g., database query failed). |

## 8. Performance Considerations

-   **Database Queries**: For `PATCH` and `DELETE` operations on a `flashcardId`, an efficient JOIN will be used to verify deck ownership to avoid multiple round-trips to the database.
-   **Pagination**: The `GET` endpoint will use `range()` from the Supabase client for efficient pagination, preventing the server from loading all flashcards for a large deck into memory.
-   **Bulk Operations**: The `POST /bulk` endpoint will use a database transaction to ensure atomicity when inserting multiple flashcards and updating the `generations` table. This is more efficient than performing individual inserts.

## 9. Implementation Steps

1.  **Update Zod Schemas**:
    -   In `src/lib/schemas.ts`, add new Zod schemas for:
        -   `CreateFlashcardCommand`
        -   `UpdateFlashcardCommand`
        -   `BulkCreateFlashcardsCommand`
        -   UUID validation for path parameters.
        -   Pagination query parameters (`page`, `pageSize`).

2.  **Create `flashcardService.ts`**:
    -   Create a new file at `src/lib/flashcardService.ts`.
    -   Implement the following async methods, ensuring each one takes `userId` as an argument for authorization checks:
        -   `getFlashcardsByDeck(deckId, userId, paginationOptions)`
        -   `createFlashcard(deckId, userId, data)`
        -   `updateFlashcard(flashcardId, userId, data)`
        -   `deleteFlashcard(flashcardId, userId)`
        -   `bulkCreateFlashcards(deckId, userId, data)`

3.  **Implement Deck-Nested API Endpoints**:
    -   Create the directory `src/pages/api/decks/[deckId]/flashcards/`.
    -   Create `index.ts` inside it to handle `GET` and `POST` requests.
    -   Implement the `GET` handler for retrieving flashcards.
    -   Implement the `POST` handler for creating a single flashcard.

4.  **Implement Bulk Create Endpoint**:
    -   In the directory from the previous step, create `bulk.ts`.
    -   Implement the `POST` handler for bulk-creating flashcards.

5.  **Implement Flashcard-Specific API Endpoints**:
    -   Create the directory `src/pages/api/flashcards/`.
    -   Create `[flashcardId].ts` inside it to handle `PATCH` and `DELETE` requests.
    -   Implement the `PATCH` handler for updating a flashcard.
    -   Implement the `DELETE` handler for deleting a flashcard.
