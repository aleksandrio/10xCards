import type { APIRoute } from "astro";
import { FlashcardService, DeckNotFoundError, DeckCardLimitExceededError } from "../../../../../lib/flashcardService";
import { flashcardPaginationQuerySchema, createFlashcardSchema, uuidSchema } from "../../../../../lib/schemas";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/decks/{deckId}/flashcards
 *
 * Retrieves a paginated list of flashcards for a specific deck.
 * Verifies that the deck belongs to the authenticated user.
 *
 * @param {string} deckId - The UUID of the deck (path parameter)
 * @query {number} page - Page number (default: 1)
 * @query {number} pageSize - Items per page (default: 20, max: 100)
 * @returns {PaginatedResponse<FlashcardDto>} - Paginated list of flashcards
 *
 * @throws {400} - Invalid path parameter or query parameters
 * @throws {401} - User is not authenticated
 * @throws {404} - Deck not found or access denied
 * @throws {500} - Database error
 */
export const GET: APIRoute = async ({ params, url, locals }) => {
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

    // Step 3: Parse and validate query parameters
    const queryParams = {
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    };

    const queryValidation = flashcardPaginationQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, pageSize } = queryValidation.data;

    // Step 4: Call the flashcard service
    const flashcardService = new FlashcardService(locals.supabase, userId);
    const result = await flashcardService.getFlashcardsByDeck(deckId, {
      page,
      pageSize,
    });

    // Step 5: Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/decks/[deckId]/flashcards:", error);

    // Handle deck not found errors
    if (error instanceof DeckNotFoundError) {
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
 * POST /api/decks/{deckId}/flashcards
 *
 * Creates a new flashcard in a specific deck.
 * Verifies deck ownership and enforces the 100 card limit per deck.
 *
 * @param {string} deckId - The UUID of the deck (path parameter)
 * @param {CreateFlashcardCommand} body - Request body containing front and back
 * @returns {FlashcardDto} - The newly created flashcard
 *
 * @throws {400} - Invalid path parameter or request body
 * @throws {401} - User is not authenticated
 * @throws {403} - Deck has reached the 100 card limit
 * @throws {404} - Deck not found or access denied
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

    const bodyValidation = createFlashcardSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: bodyValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { front, back } = bodyValidation.data;

    // Step 4: Call the flashcard service
    const flashcardService = new FlashcardService(locals.supabase, userId);
    const result = await flashcardService.createFlashcard(deckId, { front, back });

    // Step 5: Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/decks/[deckId]/flashcards:", error);

    // Handle deck not found errors
    if (error instanceof DeckNotFoundError) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle deck card limit exceeded errors
    if (error instanceof DeckCardLimitExceededError) {
      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
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
