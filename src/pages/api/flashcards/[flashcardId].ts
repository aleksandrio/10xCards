import type { APIRoute } from "astro";
import { FlashcardService, FlashcardNotFoundError } from "../../../lib/flashcardService";
import { updateFlashcardSchema, uuidSchema } from "../../../lib/schemas";

// Disable prerendering for API routes
export const prerender = false;

/**
 * PATCH /api/flashcards/{flashcardId}
 *
 * Updates an existing flashcard.
 * Verifies that the flashcard's deck belongs to the authenticated user.
 *
 * @param {string} flashcardId - The UUID of the flashcard (path parameter)
 * @param {UpdateFlashcardCommand} body - Request body containing optional front and/or back fields
 * @returns {FlashcardDto} - The updated flashcard
 *
 * @throws {400} - Invalid path parameter or request body
 * @throws {401} - User is not authenticated
 * @throws {404} - Flashcard not found or access denied
 * @throws {500} - Database error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Authentication check
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate flashcardId path parameter
    const flashcardIdValidation = uuidSchema.safeParse(params.flashcardId);

    if (!flashcardIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID format",
          details: flashcardIdValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const flashcardId = flashcardIdValidation.data;

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

    const bodyValidation = updateFlashcardSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: bodyValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData = bodyValidation.data;

    // Step 4: Call the flashcard service
    const flashcardService = new FlashcardService(locals.supabase, userId);
    const result = await flashcardService.updateFlashcard(flashcardId, updateData);

    // Step 5: Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/flashcards/[flashcardId]:", error);

    // Handle flashcard not found errors
    if (error instanceof FlashcardNotFoundError) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
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

/**
 * DELETE /api/flashcards/{flashcardId}
 *
 * Deletes a flashcard by its ID.
 * Verifies that the flashcard's deck belongs to the authenticated user.
 *
 * @param {string} flashcardId - The UUID of the flashcard (path parameter)
 * @returns {void} - Empty response with 204 status
 *
 * @throws {400} - Invalid path parameter
 * @throws {401} - User is not authenticated
 * @throws {404} - Flashcard not found or access denied
 * @throws {500} - Database error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication check
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate flashcardId path parameter
    const flashcardIdValidation = uuidSchema.safeParse(params.flashcardId);

    if (!flashcardIdValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID format",
          details: flashcardIdValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const flashcardId = flashcardIdValidation.data;

    // Step 3: Call the flashcard service
    const flashcardService = new FlashcardService(locals.supabase, userId);
    const deleted = await flashcardService.deleteFlashcard(flashcardId);

    // Step 4: Return appropriate response
    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: "Flashcard not found or access denied",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 5: Return successful response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/flashcards/[flashcardId]:", error);

    // Default to 500 Internal Server Error
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
