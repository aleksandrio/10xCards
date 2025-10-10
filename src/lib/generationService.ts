import type { SupabaseClient } from "../db/supabase.client";
import type { SuggestedFlashcardsDto, SuggestedFlashcard } from "../types";

/**
 * Custom error class for deck not found or unauthorized access errors.
 */
export class DeckNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckNotFoundError";
  }
}

/**
 * Custom error class for generation failures.
 */
export class GenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GenerationError";
  }
}

/**
 * Generates flashcard suggestions from provided text.
 * This function verifies deck ownership, generates mock flashcards,
 * and logs the generation event to the database.
 *
 * @param deckId - The UUID of the deck to generate flashcards for
 * @param text - The source text for generating flashcards (1-5000 characters)
 * @param userId - The authenticated user's ID
 * @param supabase - The Supabase client instance
 * @returns Promise<SuggestedFlashcardsDto> - The generation ID and suggested flashcards
 * @throws {DeckNotFoundError} - If the deck doesn't exist or doesn't belong to the user
 * @throws {GenerationError} - If the generation process fails
 */
export async function generateFlashcards(
  deckId: string,
  text: string,
  userId: string,
  supabase: SupabaseClient
): Promise<SuggestedFlashcardsDto> {
  // Step 1: Verify deck ownership
  const { data: deck, error: deckError } = await supabase.from("decks").select("id, user_id").eq("id", deckId).single();

  if (deckError || !deck) {
    throw new DeckNotFoundError("Deck not found");
  }

  if (deck.user_id !== userId) {
    throw new DeckNotFoundError("You do not have access to this deck");
  }

  // Step 2: Generate flashcards (mock implementation)
  const startTime = performance.now();

  // Mock flashcard generation - simulating AI processing time
  await new Promise((resolve) => setTimeout(resolve, 100));

  const suggestedFlashcards: SuggestedFlashcard[] = [
    {
      front: "What is the powerhouse of the cell?",
      back: "The mitochondria.",
    },
    {
      front: "What is the process by which plants make their own food?",
      back: "Photosynthesis.",
    },
    {
      front: "What is the largest organ in the human body?",
      back: "The skin.",
    },
  ];

  const endTime = performance.now();
  const durationMs = Math.round(endTime - startTime);

  // Step 3: Log generation to database
  try {
    const { data: generation, error: insertError } = await supabase
      .from("generations")
      .insert({
        deck_id: deckId,
        user_id: userId,
        duration_ms: durationMs,
        generated_cards_count: suggestedFlashcards.length,
      })
      .select("id")
      .single();

    if (insertError || !generation) {
      // If we fail to log the generation, log the error but still return the flashcards
      // eslint-disable-next-line no-console
      console.error("Failed to insert generation record:", insertError);

      // Attempt to log the error to generation_errors table
      await supabase.from("generation_errors").insert({
        deck_id: deckId,
        user_id: userId,
        error_message: `Failed to insert generation record: ${insertError?.message || "Unknown error"}`,
      });

      throw new GenerationError("Failed to log generation event");
    }

    // Step 4: Return the result
    return {
      generationId: generation.id,
      suggestedFlashcards,
    };
  } catch (error) {
    // If it's already our custom error, rethrow it
    if (error instanceof GenerationError) {
      throw error;
    }

    // Otherwise, log to generation_errors and throw a new GenerationError
    try {
      await supabase.from("generation_errors").insert({
        deck_id: deckId,
        user_id: userId,
        error_message: error instanceof Error ? error.message : "Unknown error during generation",
      });
    } catch (logError) {
      // eslint-disable-next-line no-console
      console.error("Failed to log generation error:", logError);
    }

    throw new GenerationError("An unexpected error occurred during generation");
  }

  // Step 4: Return mock result (for testing without database)
  return {
    generationId: crypto.randomUUID(),
    suggestedFlashcards,
  };
}
