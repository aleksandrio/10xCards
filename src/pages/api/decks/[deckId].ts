import type { APIRoute } from "astro";
import { z } from "zod";
import { DeckService } from "../../../lib/deckService";
import { updateDeckSchema } from "../../../lib/schemas";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Zod schema for validating deckId parameter.
 */
const deckIdSchema = z.string().uuid("Invalid deck ID format");

/**
 * GET /api/decks/{deckId}
 *
 * Retrieves a single deck by its ID.
 *
 * @param {string} deckId - The UUID of the deck to retrieve
 * @returns {DeckDto} - The deck details
 *
 * @throws {401} - User is not authenticated
 * @throws {400} - Invalid deck ID format
 * @throws {404} - Deck not found or doesn't belong to user
 * @throws {500} - Database error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Authentication check
    const userId = locals.user?.id;

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized. Please log in." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Validate deckId parameter
    const deckIdValidation = deckIdSchema.safeParse(params.deckId);

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

    // Step 3: Call the deck service
    const deckService = new DeckService(locals.supabase, userId);
    const deck = await deckService.getDeckById(deckId);

    // Step 4: Handle not found
    if (!deck) {
      return new Response(
        JSON.stringify({
          error: "Deck not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 5: Return successful response
    return new Response(JSON.stringify(deck), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/decks/{deckId}:", error);

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
 * PATCH /api/decks/{deckId}
 *
 * Updates a deck's name.
 *
 * @param {string} deckId - The UUID of the deck to update
 * @param {UpdateDeckCommand} body - Request body containing the new name
 * @returns {DeckDto} - The updated deck
 *
 * @throws {401} - User is not authenticated
 * @throws {400} - Invalid deck ID format or request body
 * @throws {404} - Deck not found or doesn't belong to user
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

    // Step 2: Validate deckId parameter
    const deckIdValidation = deckIdSchema.safeParse(params.deckId);

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

    const bodyValidation = updateDeckSchema.safeParse(requestBody);

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

    // Step 4: Call the deck service
    const deckService = new DeckService(locals.supabase, userId);
    const updatedDeck = await deckService.updateDeck(deckId, { name });

    // Step 5: Handle not found
    if (!updatedDeck) {
      return new Response(
        JSON.stringify({
          error: "Deck not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 6: Return successful response
    return new Response(JSON.stringify(updatedDeck), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/decks/{deckId}:", error);

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
 * DELETE /api/decks/{deckId}
 *
 * Deletes a deck and all its associated flashcards (cascade delete).
 *
 * @param {string} deckId - The UUID of the deck to delete
 * @returns {void} - Empty response with 204 status
 *
 * @throws {401} - User is not authenticated
 * @throws {400} - Invalid deck ID format
 * @throws {404} - Deck not found or doesn't belong to user
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

    // Step 2: Validate deckId parameter
    const deckIdValidation = deckIdSchema.safeParse(params.deckId);

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

    // Step 3: Call the deck service
    const deckService = new DeckService(locals.supabase, userId);
    const deleted = await deckService.deleteDeck(deckId);

    // Step 4: Handle not found
    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: "Deck not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 5: Return successful response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/decks/{deckId}:", error);

    // Default to 500 Internal Server Error
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please try again later.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
