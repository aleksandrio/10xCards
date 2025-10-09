# REST API Plan

This document outlines the REST API for the 10xCards application, designed to support the features defined in the Product Requirements Document (PRD) and align with the specified tech stack.

## 1. Resources

-   **Decks**: Represents a user's collection of flashcards. Corresponds to the `decks` table.
-   **Flashcards**: Represents an individual flashcard within a deck. Corresponds to the `flashcards` table.
-   **Generations**: A non-CRUD resource for handling the AI generation of flashcards.

## 2. Endpoints

### Decks Resource

#### `GET /api/decks`

-   **Description**: Retrieves a list of all decks owned by the authenticated user.
-   **Query Parameters**:
    -   `page` (optional, number, default: 1): The page number for pagination.
    -   `pageSize` (optional, number, default: 10): The number of decks per page.
    -   `sortBy` (optional, string, default: 'updated_at'): Field to sort by. Allowed values: `name`, `created_at`, `updated_at`.
    -   `sortOrder` (optional, string, default: 'desc'): Sort order. Allowed values: `asc`, `desc`.
-   **Response Payload (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "name": "History 101",
          "flashcardCount": 25,
          "createdAt": "2025-10-08T10:00:00Z",
          "updatedAt": "2025-10-08T11:30:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 1,
        "totalPages": 1
      }
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.

---

#### `GET /api/decks/{deckId}`

-   **Description**: Retrieves a single deck by its ID.
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "History 101",
      "flashcardCount": 25,
      "createdAt": "2025-10-08T10:00:00Z",
      "updatedAt": "2025-10-08T11:30:00Z"
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Deck with the specified ID does not exist or does not belong to the user.

---

#### `POST /api/decks`

-   **Description**: Creates a new deck.
-   **Request Payload**:
    ```json
    {
      "name": "New Chemistry Deck"
    }
    ```
-   **Response Payload (201 Created)**:
    ```json
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "name": "New Chemistry Deck",
      "flashcardCount": 0,
      "createdAt": "2025-10-09T12:00:00Z",
      "updatedAt": "2025-10-09T12:00:00Z"
    }
    ```
-   **Success Code**: `201 Created`
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., name is missing, too long, or contains only whitespace).
    -   `401 Unauthorized`: User is not authenticated.
    -   `403 Forbidden`: User has reached the maximum deck limit (10).

---

#### `PATCH /api/decks/{deckId}`

-   **Description**: Updates the name of an existing deck.
-   **Request Payload**:
    ```json
    {
      "name": "Advanced Chemistry Deck"
    }
    ```
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "name": "Advanced Chemistry Deck",
      "flashcardCount": 0,
      "createdAt": "2025-10-09T12:00:00Z",
      "updatedAt": "2025-10-09T12:05:00Z"
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., name is missing or too long).
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Deck with the specified ID does not exist or does not belong to the user.

---

#### `DELETE /api/decks/{deckId}`

-   **Description**: Deletes a deck and all of its associated flashcards.
-   **Success Code**: `204 No Content`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Deck with the specified ID does not exist or does not belong to the user.

### Flashcards Resource

#### `GET /api/decks/{deckId}/flashcards`

-   **Description**: Retrieves all flashcards within a specific deck.
-   **Query Parameters**:
    -   `page` (optional, number, default: 1): The page number for pagination.
    -   `pageSize` (optional, number, default: 20): The number of flashcards per page.
-   **Response Payload (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
          "deckId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "front": "What is the capital of France?",
          "back": "Paris",
          "createdAt": "2025-10-08T10:05:00Z",
          "updatedAt": "2025-10-08T10:05:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 1,
        "totalPages": 1
      }
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Deck with the specified ID does not exist or does not belong to the user.

---

#### `POST /api/decks/{deckId}/flashcards`

-   **Description**: Manually creates a single new flashcard in a deck.
-   **Request Payload**:
    ```json
    {
      "front": "What is H2O?",
      "back": "Water"
    }
    ```
-   **Response Payload (201 Created)**:
    ```json
    {
      "id": "d4e5f6a7-b8c9-0123-4567-890abcdef123",
      "deckId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "front": "What is H2O?",
      "back": "Water",
      "createdAt": "2025-10-09T14:00:00Z",
      "updatedAt": "2025-10-09T14:00:00Z"
    }
    ```
-   **Success Code**: `201 Created`
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., front/back text is missing or exceeds length limits).
    -   `401 Unauthorized`: User is not authenticated.
    -   `403 Forbidden`: The deck is full (100 flashcard limit reached).
    -   `404 Not Found`: Deck with the specified ID does not exist or does not belong to the user.

---

#### `PATCH /api/flashcards/{flashcardId}`

-   **Description**: Updates the front and/or back text of an existing flashcard.
-   **Request Payload**:
    ```json
    {
      "front": "What is the chemical symbol for water?",
      "back": "H2O"
    }
    ```
-   **Response Payload (200 OK)**:
    ```json
    {
      "id": "d4e5f6a7-b8c9-0123-4567-890abcdef123",
      "deckId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "front": "What is the chemical symbol for water?",
      "back": "H2O",
      "createdAt": "2025-10-09T14:00:00Z",
      "updatedAt": "2025-10-09T14:05:00Z"
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., front/back text exceeds length limits).
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Flashcard with the specified ID does not exist or does not belong to the user.

---

#### `DELETE /api/flashcards/{flashcardId}`

-   **Description**: Deletes a single flashcard.
-   **Success Code**: `204 No Content`
-   **Error Codes**:
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Flashcard with the specified ID does not exist or does not belong to the user.

### Generation Resource (Business Logic)

#### `POST /api/decks/{deckId}/generate`

-   **Description**: Accepts a block of text, calls an AI service to generate flashcard suggestions, and returns them for user review without saving them to the database. This process also creates a `generations` table entry to track the event.
-   **Request Payload**:
    ```json
    {
      "text": "The mitochondria is the powerhouse of the cell. It generates most of the cell's supply of adenosine triphosphate (ATP)."
    }
    ```
-   **Response Payload (200 OK)**:
    ```json
    {
      "generationId": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "suggestedFlashcards": [
        {
          "front": "What is the powerhouse of the cell?",
          "back": "The mitochondria."
        },
        {
          "front": "What does the mitochondria generate?",
          "back": "Most of the cell's supply of adenosine triphosphate (ATP)."
        }
      ]
    }
    ```
-   **Success Code**: `200 OK`
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., text is missing or exceeds 5000 characters).
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Deck with the specified ID does not exist or does not belong to the user.
    -   `500 Internal Server Error`: AI generation failed or an unexpected error occurred. A `generation_errors` entry will be logged.

---

#### `POST /api/decks/{deckId}/flashcards/bulk`

-   **Description**: Accepts a curated list of AI-generated flashcards and saves them to the specified deck. It also updates the `accepted_cards_count` in the corresponding `generations` record.
-   **Request Payload**:
    ```json
    {
      "generationId": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
      "flashcards": [
        {
          "front": "What is the powerhouse of the cell?",
          "back": "The mitochondria."
        }
      ]
    }
    ```
-   **Response Payload (201 Created)**:
    ```json
    {
      "cardsAdded": 1,
      "cardsSkipped": 0,
      "deckTotalFlashcards": 26,
      "message": "Successfully added 1 flashcard(s)."
    }
    ```
-   **Success Code**: `201 Created`
-   **Error Codes**:
    -   `400 Bad Request`: Validation failed (e.g., `generationId` is missing, `flashcards` array is empty or malformed).
    -   `401 Unauthorized`: User is not authenticated.
    -   `404 Not Found`: Deck with the specified ID does not exist or does not belong to the user.
    -   `409 Conflict`: The `generationId` has already been used to save flashcards.

## 3. Authentication and Authorization

-   **Mechanism**: Authentication will be handled using JSON Web Tokens (JWT) provided by Supabase Auth.
-   **Implementation**:
    1.  The client application (Astro/React) will use the Supabase client library to handle user sign-up, login, and session management.
    2.  Upon successful login, Supabase provides a JWT.
    3.  For every request to the API (`/api/*`), the client must include the JWT in the `Authorization` header as a Bearer token: `Authorization: Bearer <SUPABASE_JWT>`.
    4.  Astro middleware on the server will intercept all incoming API requests. It will validate the JWT using Supabase's library.
    5.  If the token is valid, the request is allowed to proceed to the API endpoint. The authenticated user's ID (`auth.uid()`) will be available in the server context.
    6.  If the token is missing or invalid, the middleware will immediately return a `401 Unauthorized` error.
-   **Authorization**: Authorization is enforced at the database level by PostgreSQL's Row-Level Security (RLS) policies, as defined in the `db-plan.md`. These policies ensure that API queries can only access or modify data belonging to the authenticated user (`user_id = auth.uid()`).

## 4. Validation and Business Logic

### Validation Conditions

-   **Decks (`POST`, `PATCH`)**:
    -   `name`: Required, must be a non-empty string, trimmed, max 100 characters.
-   **Flashcards (`POST`, `PATCH`)**:
    -   `front`: Required, must be a non-empty string, trimmed, max 200 characters.
    -   `back`: Required, must be a non-empty string, trimmed, max 500 characters.
-   **Generation (`POST /generate`)**:
    -   `text`: Required, must be a non-empty string, max 5000 characters.
-   **Generation (`POST /flashcards/bulk`)**:
    -   `generationId`: Required, must be a valid UUID.
    -   `flashcards`: Required, must be an array of objects, where each object has valid `front` and `back` properties.

### Business Logic Implementation

-   **Max 10 Decks Per User**:
    -   Enforced in the `POST /api/decks` endpoint. Before creating a new deck, the API will query the database to count the number of existing decks for the `user_id`. If the count is 10 or greater, it will return a `403 Forbidden` error.
-   **Max 100 Flashcards Per Deck**:
    -   Enforced in `POST /api/decks/{deckId}/flashcards` (manual add) and `POST /api/decks/{deckId}/flashcards/bulk` (AI add).
    -   The API will check the current number of flashcards in the deck plus the number of new cards being added.
    -   If the total exceeds 100, the API will either reject the entire request (for manual add) or add cards up to the limit and report the number skipped (for bulk add), returning a descriptive message in the response.
-   **AI Generation Metrics**:
    -   The `POST /api/decks/{deckId}/generate` endpoint will create a new row in the `generations` table, logging `user_id`, `deck_id`, `duration_ms`, and `generated_cards_count`.
    -   The `POST /api/decks/{deckId}/flashcards/bulk` endpoint will use the provided `generationId` to find and update the corresponding row in the `generations` table, setting the `accepted_cards_count`.
-   **AI Generation Error Logging**:
    -   If the call to the OpenRouter.ai service fails within the `POST /api/decks/{deckId}/generate` endpoint, the `catch` block will create a new row in the `generation_errors` table with the `user_id`, `deck_id`, and the `error_message` before returning a `500 Internal Server Error` to the client.
