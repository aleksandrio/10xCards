import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ===========================================================================
// Entity Types
// ===========================================================================

/**
 * Represents the `decks` table in the database.
 */
export type Deck = Tables<"decks">;

/**
 * Represents the `flashcards` table in the database.
 */
export type Flashcard = Tables<"flashcards">;

/**
 * Represents the `generations` table in the database.
 */
export type Generation = Tables<"generations">;

// ===========================================================================
// API DTOs (Data Transfer Objects)
// ===========================================================================

/**
 * DTO for a deck, as returned by the API.
 * - `createdAt` and `updatedAt` are transformations of `created_at` and `updated_at`.
 * - `flashcardCount` is a derived property, not stored in the `decks` table.
 */
export interface DeckDto {
  id: Deck["id"];
  name: Deck["name"];
  flashcardCount: number;
  createdAt: Deck["created_at"];
  updatedAt: Deck["updated_at"];
}

/**
 * DTO for a flashcard, as returned by the API.
 * - `deckId`, `createdAt`, and `updatedAt` are transformations of their snake_case counterparts.
 */
export interface FlashcardDto {
  id: Flashcard["id"];
  deckId: Flashcard["deck_id"];
  front: Flashcard["front"];
  back: Flashcard["back"];
  createdAt: Flashcard["created_at"];
  updatedAt: Flashcard["updated_at"];
}

/**
 * Represents a suggested flashcard from the AI generation service.
 * This is not saved to the database until the user confirms.
 */
export type SuggestedFlashcard = Pick<Flashcard, "front" | "back">;

/**
 * DTO for the response from the flashcard generation endpoint.
 */
export interface SuggestedFlashcardsDto {
  generationId: Generation["id"];
  suggestedFlashcards: SuggestedFlashcard[];
}

/**
 * DTO for the response after bulk-creating flashcards.
 */
export interface BulkCreateFlashcardsResponseDto {
  cardsAdded: number;
  cardsSkipped: number;
  deckTotalFlashcards: number;
}

// ===========================================================================
// API Command Models
// ===========================================================================

/**
 * Command model for creating a new deck.
 * Based on the `decks` table insert type.
 */
export type CreateDeckCommand = Pick<TablesInsert<"decks">, "name">;

/**
 * Command model for updating an existing deck.
 * Based on the `decks` table update type.
 */
export type UpdateDeckCommand = Pick<TablesUpdate<"decks">, "name">;

/**
 * Command model for creating a new flashcard.
 * Based on the `flashcards` table insert type.
 */
export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back">;

/**
 * Command model for updating an existing flashcard.
 * Based on the `flashcards` table update type.
 */
export type UpdateFlashcardCommand = Pick<TablesUpdate<"flashcards">, "front" | "back">;

/**
 * Command model for the flashcard generation endpoint.
 */
export interface GenerateFlashcardsCommand {
  text: string;
}

/**
 * Command model for bulk-creating flashcards from AI suggestions.
 */
export interface BulkCreateFlashcardsCommand {
  generationId: Generation["id"];
  flashcards: SuggestedFlashcard[];
}

// ===========================================================================
// Generic API Types
// ===========================================================================

/**
 * Structure for pagination information in API responses.
 */
export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * A generic wrapper for paginated API responses.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
