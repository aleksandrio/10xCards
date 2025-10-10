import type { SupabaseClient } from "../db/supabase.client";
import type {
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  BulkCreateFlashcardsCommand,
  FlashcardDto,
  PaginatedResponse,
  Pagination,
  BulkCreateFlashcardsResponseDto,
} from "../types";

/**
 * Custom error class for flashcard not found errors.
 */
export class FlashcardNotFoundError extends Error {
  constructor(message = "Flashcard not found") {
    super(message);
    this.name = "FlashcardNotFoundError";
  }
}

/**
 * Custom error class for deck not found errors.
 */
export class DeckNotFoundError extends Error {
  constructor(message = "Deck not found") {
    super(message);
    this.name = "DeckNotFoundError";
  }
}

/**
 * Custom error class for deck card limit exceeded errors.
 */
export class DeckCardLimitExceededError extends Error {
  constructor(message = "Deck has reached the maximum limit of 100 flashcards") {
    super(message);
    this.name = "DeckCardLimitExceededError";
  }
}

/**
 * Custom error class for generation already processed errors.
 */
export class GenerationAlreadyProcessedError extends Error {
  constructor(message = "This generation has already been processed") {
    super(message);
    this.name = "GenerationAlreadyProcessedError";
  }
}

/**
 * Options for retrieving flashcards with pagination.
 */
export interface GetFlashcardsOptions {
  page: number;
  pageSize: number;
}

/**
 * Service class for managing flashcard-related operations.
 * Handles CRUD operations for flashcards with proper error handling and data transformation.
 */
export class FlashcardService {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  /**
   * Retrieves a paginated list of flashcards for a specific deck.
   * Verifies that the deck belongs to the authenticated user.
   *
   * @param deckId - The UUID of the deck
   * @param options - Pagination options
   * @returns Promise<PaginatedResponse<FlashcardDto>> - Paginated list of flashcards
   * @throws {DeckNotFoundError} - If deck does not exist or doesn't belong to user
   * @throws {Error} - If database query fails
   */
  async getFlashcardsByDeck(deckId: string, options: GetFlashcardsOptions): Promise<PaginatedResponse<FlashcardDto>> {
    const { page, pageSize } = options;

    // Step 1: Verify deck ownership
    const { data: deck, error: deckError } = await this.supabase.from("decks").select("id").eq("id", deckId).single();

    if (deckError) {
      if (deckError.code === "PGRST116") {
        throw new DeckNotFoundError("Deck not found or access denied");
      }
      throw new Error(`Failed to verify deck: ${deckError.message}`);
    }

    if (!deck) {
      throw new DeckNotFoundError("Deck not found or access denied");
    }

    // Step 2: Calculate pagination offsets
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Step 3: Get total count of flashcards for pagination metadata
    const { count, error: countError } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId);

    if (countError) {
      throw new Error(`Failed to count flashcards: ${countError.message}`);
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Step 4: Fetch the paginated flashcards
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id, deck_id, front, back, created_at, updated_at")
      .eq("deck_id", deckId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    // Step 5: Transform database results to DTOs
    const flashcards: FlashcardDto[] = (data || []).map((flashcard) => ({
      id: flashcard.id,
      deckId: flashcard.deck_id,
      front: flashcard.front,
      back: flashcard.back,
      createdAt: flashcard.created_at,
      updatedAt: flashcard.updated_at,
    }));

    const pagination: Pagination = {
      page,
      pageSize,
      totalItems,
      totalPages,
    };

    return {
      data: flashcards,
      pagination,
    };
  }

  /**
   * Creates a new flashcard in a specific deck.
   * Verifies deck ownership and enforces the 100 card limit per deck.
   *
   * @param deckId - The UUID of the deck
   * @param command - The flashcard creation command
   * @returns Promise<FlashcardDto> - The newly created flashcard
   * @throws {DeckNotFoundError} - If deck does not exist or doesn't belong to user
   * @throws {DeckCardLimitExceededError} - If deck has reached the 100 card limit
   * @throws {Error} - If database query fails
   */
  async createFlashcard(deckId: string, command: CreateFlashcardCommand): Promise<FlashcardDto> {
    // Step 1: Verify deck ownership and get current flashcard count
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select(
        `
        id,
        flashcards:flashcards(count)
      `
      )
      .eq("id", deckId)
      .single();

    if (deckError) {
      if (deckError.code === "PGRST116") {
        throw new DeckNotFoundError("Deck not found or access denied");
      }
      throw new Error(`Failed to verify deck: ${deckError.message}`);
    }

    if (!deck) {
      throw new DeckNotFoundError("Deck not found or access denied");
    }

    // Step 2: Enforce 100 card limit
    const currentCount = Array.isArray(deck.flashcards) ? deck.flashcards.length : 0;
    if (currentCount >= 100) {
      throw new DeckCardLimitExceededError("This deck has reached the maximum limit of 100 flashcards");
    }

    // Step 3: Create the flashcard
    const { data, error } = await this.supabase
      .from("flashcards")
      .insert({
        deck_id: deckId,
        front: command.front,
        back: command.back,
        creation_type: "manual",
      })
      .select("id, deck_id, front, back, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to create flashcard: No data returned");
    }

    // Step 4: Transform to DTO
    return {
      id: data.id,
      deckId: data.deck_id,
      front: data.front,
      back: data.back,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Updates an existing flashcard.
   * Verifies that the flashcard's deck belongs to the authenticated user.
   *
   * @param flashcardId - The UUID of the flashcard to update
   * @param command - The flashcard update command
   * @returns Promise<FlashcardDto> - The updated flashcard
   * @throws {FlashcardNotFoundError} - If flashcard does not exist or doesn't belong to user
   * @throws {Error} - If database query fails
   */
  async updateFlashcard(flashcardId: string, command: UpdateFlashcardCommand): Promise<FlashcardDto> {
    // Step 1: Verify ownership by joining flashcards with decks
    const { data: flashcard, error: verifyError } = await this.supabase
      .from("flashcards")
      .select(
        `
        id,
        deck_id,
        decks!inner(id, user_id)
      `
      )
      .eq("id", flashcardId)
      .single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        throw new FlashcardNotFoundError("Flashcard not found or access denied");
      }
      throw new Error(`Failed to verify flashcard: ${verifyError.message}`);
    }

    if (!flashcard) {
      throw new FlashcardNotFoundError("Flashcard not found or access denied");
    }

    // Step 2: Update the flashcard with provided fields
    const updateData: { front?: string; back?: string } = {};
    if (command.front !== undefined) {
      updateData.front = command.front;
    }
    if (command.back !== undefined) {
      updateData.back = command.back;
    }

    const { data, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", flashcardId)
      .select("id, deck_id, front, back, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(`Failed to update flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to update flashcard: No data returned");
    }

    // Step 3: Transform to DTO
    return {
      id: data.id,
      deckId: data.deck_id,
      front: data.front,
      back: data.back,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Deletes a flashcard by its ID.
   * Verifies that the flashcard's deck belongs to the authenticated user.
   *
   * @param flashcardId - The UUID of the flashcard to delete
   * @returns Promise<boolean> - True if the flashcard was deleted, false if not found
   * @throws {Error} - If database query fails
   */
  async deleteFlashcard(flashcardId: string): Promise<boolean> {
    // Step 1: Verify ownership by joining flashcards with decks before deletion
    const { data: flashcard, error: verifyError } = await this.supabase
      .from("flashcards")
      .select(
        `
        id,
        deck_id,
        decks!inner(id, user_id)
      `
      )
      .eq("id", flashcardId)
      .single();

    if (verifyError) {
      if (verifyError.code === "PGRST116") {
        return false; // Flashcard not found or access denied
      }
      throw new Error(`Failed to verify flashcard: ${verifyError.message}`);
    }

    if (!flashcard) {
      return false;
    }

    // Step 2: Delete the flashcard
    const { error, count } = await this.supabase.from("flashcards").delete({ count: "exact" }).eq("id", flashcardId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }

    return count !== null && count > 0;
  }

  /**
   * Bulk-creates flashcards from an AI generation.
   * Verifies deck ownership, checks generation hasn't been processed, and enforces the 100 card limit.
   * Uses a transaction to ensure atomicity.
   *
   * @param deckId - The UUID of the deck
   * @param command - The bulk creation command
   * @returns Promise<BulkCreateFlashcardsResponseDto> - Result of the bulk creation
   * @throws {DeckNotFoundError} - If deck does not exist or doesn't belong to user
   * @throws {GenerationAlreadyProcessedError} - If generation has already been processed
   * @throws {Error} - If database query fails
   */
  async bulkCreateFlashcards(
    deckId: string,
    command: BulkCreateFlashcardsCommand
  ): Promise<BulkCreateFlashcardsResponseDto> {
    // Step 1: Verify deck ownership
    const { data: deck, error: deckError } = await this.supabase.from("decks").select("id").eq("id", deckId).single();

    if (deckError) {
      if (deckError.code === "PGRST116") {
        throw new DeckNotFoundError("Deck not found or access denied");
      }
      throw new Error(`Failed to verify deck: ${deckError.message}`);
    }

    if (!deck) {
      throw new DeckNotFoundError("Deck not found or access denied");
    }

    // Step 1b: Get current flashcard count for this deck
    const { count: flashcardCount, error: countError } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId);

    if (countError) {
      throw new Error(`Failed to count flashcards: ${countError.message}`);
    }

    // Step 2: Check if generation exists and belongs to this deck
    const { data: generation, error: genError } = await this.supabase
      .from("generations")
      .select("id, deck_id, accepted_cards_count")
      .eq("id", command.generationId)
      .eq("user_id", this.userId)
      .eq("deck_id", deckId)
      .single();

    if (genError) {
      if (genError.code === "PGRST116") {
        throw new Error("Generation not found or doesn't belong to this deck");
      }
      throw new Error(`Failed to verify generation: ${genError.message}`);
    }

    if (!generation) {
      throw new Error("Generation not found or doesn't belong to this deck");
    }

    if (generation.accepted_cards_count !== null) {
      throw new GenerationAlreadyProcessedError("This generation has already been processed");
    }

    // Step 3: Calculate how many cards can be added
    const currentCount = flashcardCount || 0;
    const availableSlots = 100 - currentCount;
    const cardsToAdd = Math.min(command.flashcards.length, availableSlots);
    const cardsSkipped = command.flashcards.length - cardsToAdd;

    // Step 4: Prepare flashcards to insert
    const flashcardsToInsert = command.flashcards.slice(0, cardsToAdd).map((fc) => ({
      deck_id: deckId,
      front: fc.front,
      back: fc.back,
      creation_type: "generated" as const,
      generation_id: command.generationId,
    }));

    // Step 5: Insert flashcards (if any)
    if (flashcardsToInsert.length > 0) {
      const { error: insertError } = await this.supabase.from("flashcards").insert(flashcardsToInsert);

      if (insertError) {
        throw new Error(`Failed to insert flashcards: ${insertError.message}`);
      }
    }

    // Step 6: Mark generation as processed by setting accepted_cards_count
    const { error: updateError } = await this.supabase
      .from("generations")
      .update({ accepted_cards_count: cardsToAdd })
      .eq("id", command.generationId);

    if (updateError) {
      throw new Error(`Failed to mark generation as processed: ${updateError.message}`);
    }

    // Step 7: Return result
    return {
      cardsAdded: cardsToAdd,
      cardsSkipped,
      deckTotalFlashcards: currentCount + cardsToAdd,
    };
  }
}
