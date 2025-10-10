import type { APIRoute } from "astro";
import {
  FlashcardService,
  DeckNotFoundError,
  GenerationAlreadyProcessedError,
} from "../../../../../lib/flashcardService";
import { bulkCreateFlashcardsSchema, uuidSchema } from "../../../../../lib/schemas";

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/decks/{deckId}/flashcards/bulk
 *
 * Bulk-creates flashcards from an AI generation.
 * Verifies deck ownership, checks generation hasn't been processed, and enforces the 100 card limit.
 *
 * @param {string} deckId - The UUID of the deck (path parameter)
 * @param {BulkCreateFlashcardsCommand} body - Request body containing generationId and flashcards array
 * @returns {BulkCreateFlashcardsResponseDto} - Result of the bulk creation
 *
 * @throws {400} - Invalid path parameter or request body
 * @throws {401} - User is not authenticated
 * @throws {404} - Deck not found or access denied
 * @throws {409} - Generation has already been processed
 * @throws {500} - Database error
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication check
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate deckId path parameter
    const deckIdValidation = uuidSchema.safeParse(params.deckId);

    if (!deckIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid deck ID format",
          details: deckIdValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const deckId = deckIdValidation.data;

    // Step 3: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = bulkCreateFlashcardsSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: bodyValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { generationId, flashcards } = bodyValidation.data;

    // Step 4: Call the flashcard service
    const flashcardService = new FlashcardService(locals.supabase, userId);
    const result = await flashcardService.bulkCreateFlashcards(deckId, {
      generationId,
      flashcards,
    });

    // Step 5: Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/decks/[deckId]/flashcards/bulk:", error);

    // Handle deck not found errors
    if (error instanceof DeckNotFoundError) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle generation already processed errors
    if (error instanceof GenerationAlreadyProcessedError) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default to 500 Internal Server Error
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
