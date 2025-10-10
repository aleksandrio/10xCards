import type { APIRoute } from "astro";
import { DeckService, DeckLimitExceededError } from "../../../lib/deckService";
import { createDeckSchema, paginationQuerySchema } from "../../../lib/schemas";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/decks
 *
 * Retrieves a paginated list of decks for the authenticated user.
 *
 * @query {number} page - Page number (default: 1)
 * @query {number} pageSize - Items per page (default: 10, max: 100)
 * @query {string} sortBy - Field to sort by (default: "updated_at", allowed: "name", "created_at", "updated_at")
 * @query {string} sortOrder - Sort order (default: "desc", allowed: "asc", "desc")
 * @returns {PaginatedResponse<DeckDto>} - Paginated list of decks
 *
 * @throws {401} - User is not authenticated
 * @throws {400} - Invalid query parameters
 * @throws {500} - Database error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Authentication check
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse and validate query parameters
    // Convert null to undefined so Zod defaults work properly
    const queryParams = {
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    };

    const queryValidation = paginationQuerySchema.safeParse(queryParams);

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, pageSize, sortBy, sortOrder } = queryValidation.data;

    // Step 3: Call the deck service
    const deckService = new DeckService(locals.supabase, userId);
    const result = await deckService.getDecks({
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    // Step 4: Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/decks:", error);

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
 * POST /api/decks
 *
 * Creates a new deck for the authenticated user.
 * Enforces a maximum limit of 10 decks per user.
 *
 * @param {CreateDeckCommand} body - Request body containing deck name
 * @returns {DeckDto} - The newly created deck
 *
 * @throws {401} - User is not authenticated
 * @throws {400} - Invalid request body
 * @throws {403} - User has reached the 10 deck limit
 * @throws {500} - Database error
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

    const bodyValidation = createDeckSchema.safeParse(requestBody);

    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: bodyValidation.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name } = bodyValidation.data;

    // Step 3: Call the deck service
    const deckService = new DeckService(locals.supabase, userId);
    const result = await deckService.createDeck({ name });

    // Step 4: Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/decks:", error);

    // Handle deck limit exceeded errors
    if (error instanceof DeckLimitExceededError) {
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
