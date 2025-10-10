import type { SupabaseClient } from "../db/supabase.client";
import type { CreateDeckCommand, UpdateDeckCommand, DeckDto, PaginatedResponse, Pagination } from "../types";

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
 * Custom error class for deck limit exceeded errors.
 */
export class DeckLimitExceededError extends Error {
  constructor(message = "Maximum deck limit of 10 reached") {
    super(message);
    this.name = "DeckLimitExceededError";
  }
}

/**
 * Options for retrieving decks with pagination and sorting.
 */
export interface GetDecksOptions {
  page: number;
  pageSize: number;
  sortBy: "name" | "created_at" | "updated_at";
  sortOrder: "asc" | "desc";
}

/**
 * Service class for managing deck-related operations.
 * Handles CRUD operations for decks with proper error handling and data transformation.
 */
export class DeckService {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  /**
   * Retrieves a paginated list of decks for the current user with flashcard counts.
   *
   * @param options - Pagination and sorting options
   * @returns Promise<PaginatedResponse<DeckDto>> - Paginated list of decks
   * @throws {Error} - If database query fails
   */
  async getDecks(options: GetDecksOptions): Promise<PaginatedResponse<DeckDto>> {
    const { page, pageSize, sortBy, sortOrder } = options;

    // Calculate pagination offsets
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // First, get the total count of decks for pagination metadata
    const { count, error: countError } = await this.supabase.from("decks").select("*", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Failed to count decks: ${countError.message}`);
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Then, fetch the paginated decks with flashcard counts
    // We use a left join to count flashcards for each deck
    const { data, error } = await this.supabase
      .from("decks")
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        flashcards:flashcards(count)
      `
      )
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch decks: ${error.message}`);
    }

    // Transform database results to DTOs
    const decks: DeckDto[] = (data || []).map((deck) => ({
      id: deck.id,
      name: deck.name,
      flashcardCount: Array.isArray(deck.flashcards) ? deck.flashcards.length : 0,
      createdAt: deck.created_at,
      updatedAt: deck.updated_at,
    }));

    const pagination: Pagination = {
      page,
      pageSize,
      totalItems,
      totalPages,
    };

    return {
      data: decks,
      pagination,
    };
  }

  /**
   * Retrieves a single deck by its ID with flashcard count.
   *
   * @param deckId - The UUID of the deck to retrieve
   * @returns Promise<DeckDto | null> - The deck or null if not found
   * @throws {Error} - If database query fails
   */
  async getDeckById(deckId: string): Promise<DeckDto | null> {
    const { data, error } = await this.supabase
      .from("decks")
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        flashcards:flashcards(count)
      `
      )
      .eq("id", deckId)
      .single();

    if (error) {
      // Supabase returns a specific error code for "no rows returned"
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch deck: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Transform to DTO
    return {
      id: data.id,
      name: data.name,
      flashcardCount: Array.isArray(data.flashcards) ? data.flashcards.length : 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Creates a new deck for the current user.
   * Enforces a maximum limit of 10 decks per user.
   *
   * @param command - The deck creation command containing the name
   * @returns Promise<DeckDto> - The newly created deck
   * @throws {DeckLimitExceededError} - If user has reached the 10 deck limit
   * @throws {Error} - If database query fails
   */
  async createDeck(command: CreateDeckCommand): Promise<DeckDto> {
    // Step 1: Check current deck count
    const { count, error: countError } = await this.supabase.from("decks").select("*", { count: "exact", head: true });

    if (countError) {
      throw new Error(`Failed to check deck count: ${countError.message}`);
    }

    // Step 2: Enforce 10 deck limit
    if (count !== null && count >= 10) {
      throw new DeckLimitExceededError("You have reached the maximum limit of 10 decks");
    }

    // Step 3: Create the deck
    const { data, error } = await this.supabase
      .from("decks")
      .insert({
        name: command.name,
        user_id: this.userId,
      })
      .select(
        `
        id,
        name,
        created_at,
        updated_at
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create deck: ${error.message}`);
    }

    if (!data) {
      throw new Error("Failed to create deck: No data returned");
    }

    // Transform to DTO (new deck has 0 flashcards)
    return {
      id: data.id,
      name: data.name,
      flashcardCount: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Updates a deck's name.
   *
   * @param deckId - The UUID of the deck to update
   * @param command - The deck update command containing the new name
   * @returns Promise<DeckDto | null> - The updated deck or null if not found
   * @throws {Error} - If database query fails
   */
  async updateDeck(deckId: string, command: UpdateDeckCommand): Promise<DeckDto | null> {
    // Step 1: Update the deck
    const { data, error } = await this.supabase
      .from("decks")
      .update({
        name: command.name,
      })
      .eq("id", deckId)
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        flashcards:flashcards(count)
      `
      )
      .single();

    if (error) {
      // Supabase returns a specific error code for "no rows returned"
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to update deck: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Transform to DTO
    return {
      id: data.id,
      name: data.name,
      flashcardCount: Array.isArray(data.flashcards) ? data.flashcards.length : 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Deletes a deck by its ID.
   * Flashcards associated with the deck will be cascade deleted automatically.
   *
   * @param deckId - The UUID of the deck to delete
   * @returns Promise<boolean> - True if the deck was deleted, false if not found
   * @throws {Error} - If database query fails
   */
  async deleteDeck(deckId: string): Promise<boolean> {
    const { error, count } = await this.supabase.from("decks").delete({ count: "exact" }).eq("id", deckId);

    if (error) {
      throw new Error(`Failed to delete deck: ${error.message}`);
    }

    // If count is 0, the deck wasn't found (or user doesn't have access due to RLS)
    return count !== null && count > 0;
  }
}
