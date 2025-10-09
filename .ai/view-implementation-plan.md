# API Endpoint Implementation Plan: Generate Flashcard Suggestions

## 1. Endpoint Overview
This document outlines the implementation plan for the `POST /api/decks/{deckId}/generate` endpoint. Its primary function is to accept a block of text, interface with an external AI service to generate flashcard suggestions, and return these suggestions to the user for review. This process creates a `generations` record to log the event but does not persist the flashcards themselves.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL Structure**: `/api/decks/{deckId}/generate`
- **Parameters**:
  - **Path (Required)**: 
    - `deckId` (UUID): The unique identifier for the deck.
- **Request Body**: The request body must be a JSON object conforming to the `GenerateFlashcardsCommand` model.
  ```json
  {
    "text": "The source text for generating flashcards. Max 5000 characters."
  }
  ```

## 3. Used Types
The following types from `src/types.ts` will be used for handling the request and response:
- **Request Command Model**: `GenerateFlashcardsCommand`
- **Response DTO**: `SuggestedFlashcardsDto`
- **Entity**: `Generation`

## 4. Response Details
- **Success (200 OK)**: On successful generation, the API will return a `SuggestedFlashcardsDto` object.
  ```json
  {
    "generationId": "e5f6a7b8-c9d0-1234-5678-90abcdef1234",
    "suggestedFlashcards": [
      {
        "front": "What is the powerhouse of the cell?",
        "back": "The mitochondria."
      }
    ]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid input for `deckId` or request body.
  - `401 Unauthorized`: User is not authenticated.
  - `404 Not Found`: The specified deck does not exist or does not belong to the user.
  - `500 Internal Server Error`: AI generation failed or a database error occurred.

## 5. Data Flow
1. The client sends a `POST` request to `/api/decks/{deckId}/generate` with the source text.
2. The Astro API route handler receives the request.
3. **Authentication**: The handler verifies the user's session using `Astro.locals.user`. If no user is found, it returns a `401`.
4. **Validation**: The handler uses a Zod schema to validate the `deckId` (must be a UUID) and the request body (text must be a non-empty string, max 5000 chars). If validation fails, it returns a `400`.
5. **Service Call**: The handler calls the `generateFlashcards` function in the `generationService`.
6. **Deck Verification**: The `generationService` queries the database to confirm the deck exists and belongs to the authenticated user. If not, it throws an error that results in a `404`.
7. **AI Interaction**: 
   - The service starts a timer.
   - It calls the OpenRouter.ai API with the provided text.
   - It stops the timer upon receiving a response and calculates the duration in milliseconds.
8. **Database Logging**: 
   - The service creates a new record in the `generations` table, saving `user_id`, `deck_id`, `duration_ms`, and `generated_cards_count`.
9. **Response**: The service returns the `generationId` and the `suggestedFlashcards` to the API handler.
10. The handler sends the `200 OK` response with the DTO to the client.

## 6. Security Considerations
- **Authentication**: All requests must be authenticated. The API handler will reject requests without a valid user session from `Astro.locals`.
- **Authorization**: The `generationService` must enforce that the `deckId` provided in the URL belongs to the authenticated `user.id`. This prevents users from accessing or performing actions on decks they do not own.
- **Input Sanitization**: Input is validated using Zod to prevent malformed data and mitigate risks like NoSQL injection or oversized payloads. The strict character limit on the `text` field helps prevent abuse of the AI service.

## 7. Error Handling
A structured approach to error handling will be implemented:
- **Validation Errors**: The API handler will have a `try...catch` block. Zod validation errors will be caught and will result in a `400 Bad Request` response with a descriptive message.
- **Not Found Errors**: The `generationService` will throw a specific error if a deck is not found or does not belong to the user. The handler will catch this and return a `404 Not Found`.
- **AI Service & DB Errors**: If the OpenRouter.ai call fails or a database operation fails, the `generationService` will log the details to the `generation_errors` table and throw a generic error. The handler will catch this and return a `500 Internal Server Error`.

| Status Code | Reason |
|---|---|
| `400 Bad Request` | Invalid UUID format for `deckId`. Request body fails validation (e.g., missing `text`, `text` is empty or > 5000 characters). |
| `401 Unauthorized` | No active user session is found. |
| `404 Not Found` | The deck with the given `deckId` either doesn't exist or doesn't belong to the authenticated user. |
| `500 Internal Server Error` | The external AI service API call fails. A database query or insert operation fails. Any other unexpected server error. |

## 8. Performance Considerations
- The primary performance bottleneck will be the external API call to OpenRouter.ai.
- The `duration_ms` of this call will be explicitly tracked and stored in the `generations` table. This data will be valuable for monitoring the performance and cost of the AI service.
- Database operations (one select, one insert) are expected to be fast and should not be a significant bottleneck.

## 9. Implementation Steps
1.  **Create API Route**: Create a new file at `src/pages/api/decks/[deckId]/generate.ts`. Export `prerender = false`.
2.  **Define Zod Schema**: In the new file, define a Zod schema to validate the request body (`text` field) and the `deckId` URL parameter.
3.  **Implement POST Handler**: Create an `async` function `POST({ params, request, locals })` in the API route file.
4.  **Add Authentication**: Inside the `POST` handler, retrieve the user from `locals.user`. If no user exists, return a `401` response.
5.  **Add Validation Logic**: Wrap the core logic in a `try...catch` block. Use the Zod schema to parse and validate `params.deckId` and `await request.json()`. Catch and handle validation errors, returning a `400` response.
6.  **Create Generation Service**: Create a new file at `src/lib/generationService.ts`.
7.  **Implement `generateFlashcards` Function**:
    -   Define a function `generateFlashcards(deckId: string, text: string, userId: string, supabase: SupabaseClient)` in the service.
    -   Inside this function, first, query the `decks` table to verify the `deckId` exists and its `user_id` matches the `userId`. If not, throw a "Not Found" error.
    -   Record the start time.
    -   Implement the call to the OpenRouter.ai API.
    -   Record the end time and calculate `duration_ms`.
    -   On a successful AI response, insert a new record into the `generations` table.
    -   Return the `generationId` and `suggestedFlashcards`.
    -   If the AI call fails, insert a record into `generation_errors` and re-throw a generic "Internal Server Error".
8.  **Integrate Service**: In the `POST` handler, call `generationService.generateFlashcards(...)` with the validated data and the `supabase` client from `locals`.
9.  **Return Response**: Based on the result from the service, return the appropriate `200 OK` JSON response or a `500` error response if the service call fails.
