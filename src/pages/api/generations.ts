import type { APIRoute } from "astro";
import { z } from "zod";
import { generateFlashcards, DeckNotFoundError, GenerationError } from "../../lib/generationService";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for validating the request body.
 * Ensures the deckId and text fields are present and valid.
 */
const generateFlashcardsSchema = z.object({
  deckId: z.string().uuid("Invalid deck ID format"),
  text: z.string().min(1, "Text cannot be empty").max(5000, "Text cannot exceed 5000 characters"),
});

/**
 * POST /api/generations
 *
 * Generates flashcard suggestions from provided text using an AI service.
 * Creates a generation record in the database but does not persist the flashcards.
 *
 * @param {GenerateFlashcardsCommand & {deckId: string}} body - Request body containing deckId and text
 * @returns {SuggestedFlashcardsDto} - The generated flashcard suggestions
 *
 * @throws {400} - Invalid input (malformed deckId or request body)
 * @throws {401} - User is not authenticated
 * @throws {404} - Deck not found or doesn't belong to the user
 * @throws {500} - AI generation failed or database error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authentication check
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const bodyValidation = generateFlashcardsSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: bodyValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { deckId, text } = bodyValidation.data;

    // Step 3: Call the generation service
    const result = await generateFlashcards(deckId, text, userId, locals.supabase);

    // Step 4: Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/generations:", error);

    // Handle deck not found errors
    if (error instanceof DeckNotFoundError) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle generation errors
    if (error instanceof GenerationError) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default to 500 Internal Server Error for any other errors
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
