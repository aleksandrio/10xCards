import { z } from "zod";
import type { SupabaseClient } from "../db/supabase.client";
import type { SuggestedFlashcardsDto, SuggestedFlashcard } from "../types";
import {
  OpenRouterService,
  AuthenticationError,
  RateLimitError,
  BadRequestError,
  ValidationError,
  NetworkError,
  ApiError,
  ConfigurationError,
} from "./openrouterService";

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
 * Zod schema for a single flashcard suggestion from the AI.
 */
const flashcardSchema = z.object({
  front: z.string().describe("The question or term on the front of the flashcard."),
  back: z.string().describe("The answer or definition on the back of the flashcard."),
});

/**
 * Zod schema for the AI response containing an array of flashcard suggestions.
 */
const flashcardsResponseSchema = z.object({
  flashcards: z
    .array(flashcardSchema)
    .min(1)
    .max(20)
    .describe("An array of 3-10 flashcard suggestions based on the provided text."),
});

/**
 * Generates flashcard suggestions from provided text using OpenRouter AI.
 * This function verifies deck ownership, generates flashcards using AI,
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

  // Step 2: Generate flashcards using OpenRouter AI
  const startTime = performance.now();
  let suggestedFlashcards: SuggestedFlashcard[];

  try {
    const openRouterService = new OpenRouterService();

    const systemMessage = `You are an expert educational content creator specializing in creating effective flashcards for studying.

Your task is to analyze the provided text and generate 3-10 high-quality flashcard pairs that:
- Cover the most important concepts, facts, or definitions from the text
- Use clear, concise language
- Have questions that test understanding, not just memorization
- Include complete, informative answers
- Are ordered from basic to more advanced concepts when possible

Generate between 3 and 10 flashcards depending on the amount and complexity of content in the provided text.`;

    const userMessage = `Create flashcards from the following text:\n\n${text}`;

    const response = await openRouterService.getChatCompletion({
      model: "openai/gpt-oss-20b:free",
      systemMessage,
      userMessage,
      responseSchema: flashcardsResponseSchema,
      temperature: 0.7,
      max_tokens: 2000,
    });

    suggestedFlashcards = response.flashcards;

    // Validate that we got at least one flashcard
    if (!suggestedFlashcards || suggestedFlashcards.length === 0) {
      throw new GenerationError("AI did not generate any flashcards. Please try again with different text.");
    }
  } catch (error) {
    // Handle OpenRouter-specific errors
    if (error instanceof ConfigurationError) {
      // eslint-disable-next-line no-console
      console.error("OpenRouter configuration error:", error);
      throw new GenerationError("Service configuration error. Please contact support.");
    }

    if (error instanceof AuthenticationError) {
      // eslint-disable-next-line no-console
      console.error("OpenRouter authentication error:", error);
      throw new GenerationError("AI service authentication failed. Please contact support.");
    }

    if (error instanceof RateLimitError) {
      // eslint-disable-next-line no-console
      console.error("OpenRouter rate limit exceeded:", error);
      throw new GenerationError("AI service rate limit exceeded. Please try again in a few moments.");
    }

    if (error instanceof NetworkError) {
      // eslint-disable-next-line no-console
      console.error("Network error calling OpenRouter:", error);
      throw new GenerationError("Network error connecting to AI service. Please check your connection and try again.");
    }

    if (error instanceof ValidationError) {
      // eslint-disable-next-line no-console
      console.error("AI response validation error:", error);
      throw new GenerationError("AI returned an unexpected response format. Please try again.");
    }

    if (error instanceof BadRequestError || error instanceof ApiError) {
      // eslint-disable-next-line no-console
      console.error("OpenRouter API error:", error);
      throw new GenerationError("AI service error. Please try again.");
    }

    // If it's already our custom error, rethrow it
    if (error instanceof GenerationError) {
      throw error;
    }

    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error during flashcard generation:", error);
    throw new GenerationError("An unexpected error occurred during generation. Please try again.");
  }

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
}
