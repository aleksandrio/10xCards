# API Endpoint Implementation Plan: Decks Resource

## 1. Endpoint Overview
This plan outlines the implementation of the `/api/decks` resource, which provides full CRUD (Create, Read, Update, Delete) functionality for user-owned flashcard decks. The resource consists of five endpoints that handle listing decks, retrieving a single deck, creating, updating, and deleting decks. All operations are authenticated and authorized, ensuring users can only interact with their own data.

## 2. Request Details
The resource is split across two Astro API route files.

### `GET, POST /api/decks`
-   **File**: `src/pages/api/decks/index.ts`
-   **`GET /api/decks`**:
    -   **Description**: Retrieves a paginated list of decks for the user.
    -   **HTTP Method**: `GET`
    -   **Query Parameters**:
        -   `page` (optional, number, default: 1)
        -   `pageSize` (optional, number, default: 10)
        -   `sortBy` (optional, string, default: 'updated_at', allowed: `name`, `created_at`, `updated_at`)
        -   `sortOrder` (optional, string, default: 'desc', allowed: `asc`, `desc`)
-   **`POST /api/decks`**:
    -   **Description**: Creates a new deck.
    -   **HTTP Method**: `POST`
    -   **Request Body**: `CreateDeckCommand`
        ```json
        {
          "name": "string"
        }
        ```

### `GET, PATCH, DELETE /api/decks/{deckId}`
-   **File**: `src/pages/api/decks/[deckId].ts`
-   **`GET /api/decks/{deckId}`**:
    -   **Description**: Retrieves a single deck by its ID.
    -   **HTTP Method**: `GET`
    -   **URL Parameters**: `deckId` (required, string, UUID)
-   **`PATCH /api/decks/{deckId}`**:
    -   **Description**: Updates a deck's name.
    -   **HTTP Method**: `PATCH`
    -   **URL Parameters**: `deckId` (required, string, UUID)
    -   **Request Body**: `UpdateDeckCommand`
        ```json
        {
          "name": "string"
        }
        ```
-   **`DELETE /api/decks/{deckId}`**:
    -   **Description**: Deletes a deck.
    -   **HTTP Method**: `DELETE`
    -   **URL Parameters**: `deckId` (required, string, UUID)

## 3. Used Types
-   **DTOs**: `DeckDto`, `PaginatedResponse<DeckDto>`, `Pagination`
-   **Command Models**: `CreateDeckCommand`, `UpdateDeckCommand`
-   All types are imported from `src/types.ts`.

## 4. Response Details
-   **`GET /api/decks`**:
    -   **Success (200 OK)**: `PaginatedResponse<DeckDto>`
-   **`GET /api/decks/{deckId}`**:
    -   **Success (200 OK)**: `DeckDto`
-   **`POST /api/decks`**:
    -   **Success (201 Created)**: `DeckDto`
-   **`PATCH /api/decks/{deckId}`**:
    -   **Success (200 OK)**: `DeckDto`
-   **`DELETE /api/decks/{deckId}`**:
    -   **Success (204 No Content)**: Empty response body.
-   **Error (4xx, 5xx)**:
    ```json
    {
      "error": "A descriptive error message"
    }
    ```

## 5. Data Flow
1.  **Request**: An incoming HTTP request hits the appropriate Astro API route (`index.ts` or `[deckId].ts`).
2.  **Middleware**: Astro middleware verifies the user's session. If no session exists, it redirects or returns a 401 error, halting the flow.
3.  **Handler**: The corresponding method handler (e.g., `GET`, `POST`) is invoked.
4.  **Validation**:
    -   The handler validates path parameters (`deckId`) and query parameters (`page`, `sortBy`, etc.).
    -   For `POST` and `PATCH`, the request body is parsed and validated using a Zod schema.
5.  **Service Layer**: The handler instantiates `DeckService` from `src/lib/deckService.ts`, passing the `supabase` client from `context.locals`.
6.  **Business Logic**: The handler calls the relevant `DeckService` method (e.g., `deckService.getDecks()`).
7.  **Database**: The service method constructs and executes a query against the Supabase database. All queries will be subject to RLS policies, automatically scoping them to the current `user_id`.
    -   To calculate `flashcardCount`, the query will perform a `LEFT JOIN` on the `flashcards` table and count the related cards.
8.  **Response**: The service method returns data (or throws an error). The handler catches it, formats the data into the specified DTO, and constructs the final `Response` object with the correct status code and JSON body.

## 6. Security Considerations
-   **Authentication**: Handled by Astro middleware, which validates the Supabase session cookie. All endpoints will be protected.
-   **Authorization**: Supabase Row Level Security (RLS) is the primary mechanism. RLS policies must be enabled on the `decks` and `flashcards` tables to ensure users can only access `(user_id = auth.uid())`.
-   **Input Validation**: Zod schemas will be used for request bodies to prevent invalid data from being processed. Schemas will enforce string length (`min(1)`, `max(100)`), and trim whitespace.
-   **Rate Limiting**: Not in the initial scope but can be added at the middleware level if necessary.
-   **Resource Limiting**: The `POST /api/decks` endpoint logic will enforce a maximum of 10 decks per user, returning a `403 Forbidden` if the limit is exceeded.

## 7. Error Handling
-   **400 Bad Request**: Returned for failed Zod validations or invalid query/path parameters.
-   **401 Unauthorized**: Returned by middleware if no valid session is found.
-   **403 Forbidden**: Returned if a user attempts to create a deck after reaching the 10-deck limit.
-   **404 Not Found**: Returned for requests targeting a `deckId` that doesn't exist or belong to the user. The service layer will return `null` or a result object indicating failure, which the handler will translate to a 404.
-   **500 Internal Server Error**: A generic catch-all block in each handler will catch unexpected errors, log them to the console, and return a generic 500 response.

## 8. Performance Considerations
-   **Database Indexing**: Ensure the `decks.user_id` column has an index to speed up lookups. Supabase creates this automatically for foreign keys. An index on `(user_id, updated_at)` could optimize the default sort order.
-   **Pagination**: The `GET /api/decks` endpoint uses cursor-based pagination (`.range()` in Supabase) to ensure efficient data retrieval, preventing large dataset loads.
-   **Payload Size**: The `flashcardCount` is calculated efficiently in the database query to avoid N+1 query problems.

## 9. Implementation Steps
1.  **Create Zod Schemas**:
    -   In a new file `src/lib/schemas.ts`, define Zod schemas for `CreateDeckCommand` and `UpdateDeckCommand`.
    -   The schema should validate `name` as a string that is trimmed, has a minimum length of 1, and a maximum length of 100.

2.  **Create `DeckService`**:
    -   Create the file `src/lib/deckService.ts`.
    -   Implement a `DeckService` class that accepts a `SupabaseClient` in its constructor.
    -   Add public methods:
        -   `getDecks(options)`: Handles pagination, sorting, and fetching decks with flashcard counts.
        -   `getDeckById(deckId)`: Fetches a single deck with its flashcard count.
        -   `createDeck(command)`: Checks the deck count, then creates a new deck.
        -   `updateDeck(deckId, command)`: Updates a deck's name.
        -   `deleteDeck(deckId)`: Deletes a deck.
    -   All methods should interact with the Supabase client.

3.  **Implement API Route for Collections (`/api/decks`)**:
    -   Create the file `src/pages/api/decks/index.ts`.
    -   Export `prerender = false`.
    -   Implement the `GET` handler:
        -   Validate and parse query parameters (`page`, `pageSize`, etc.), applying defaults.
        -   Instantiate `DeckService` and call `getDecks()`.
        -   Format the response as `PaginatedResponse<DeckDto>`.
    -   Implement the `POST` handler:
        -   Validate the request body using the Zod schema.
        -   Instantiate `DeckService` and call `createDeck()`.
        -   Return a 201 Created response with the new `DeckDto`.

4.  **Implement API Route for Single Resource (`/api/decks/{deckId}`)**:
    -   Create the file `src/pages/api/decks.ts`.
    -   Export `prerender = false`.
    -   Implement the `GET` handler:
        -   Validate `deckId` from `context.params`.
        -   Call `deckService.getDeckById()`.
        -   Return a 404 if not found, otherwise return the `DeckDto`.
    -   Implement the `PATCH` handler:
        -   Validate `deckId` and the request body.
        -   Call `deckService.updateDeck()`.
        -   Return the updated `DeckDto`.
    -   Implement the `DELETE` handler:
        -   Validate `deckId`.
        -   Call `deckService.deleteDeck()`.
        -   Return a 204 No Content response.

5.  **Enable RLS in Supabase**:
    -   In the Supabase dashboard or via a SQL migration, ensure RLS is enabled for the `decks` and `flashcards` tables.
    -   Create RLS policies that allow `SELECT`, `INSERT`, `UPDATE`, `DELETE` operations only when `user_id = auth.uid()`.
