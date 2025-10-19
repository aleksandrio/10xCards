/// <reference types="vitest/globals" />

import { vi, describe, it, expect, beforeEach, type Mock } from "vitest";
import { GET, POST } from "../../../../src/pages/api/decks/index";
import { DeckService } from "../../../../src/lib/deckService";
import type { APIContext } from "astro";

// Partially mock the DeckService module.
// This mocks the DeckService class but keeps other exports (like custom errors) real.
vi.mock("../../../../src/lib/deckService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../src/lib/deckService")>();
  return {
    ...actual,
    DeckService: vi.fn(),
  };
});

// After the mock setup, cast DeckService to a mock type for TypeScript.
const MockedDeckService = DeckService as Mock;
const mockGetDecks = vi.fn();
const mockCreateDeck = vi.fn();

describe("/api/decks API endpoint", () => {
  const userId = "test-user-id";

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Provide a fresh mock implementation for each test
    MockedDeckService.mockImplementation(() => ({
      getDecks: mockGetDecks,
      createDeck: mockCreateDeck,
    }));
  });

  describe("GET handler", () => {
    it("should return a paginated list of decks for an authenticated user", async () => {
      // Arrange
      const mockDecks = {
        data: [{ id: "deck-1", name: "Deck 1", flashcardCount: 10 }],
        pagination: { totalItems: 1, totalPages: 1, currentPage: 1, pageSize: 10 },
      };
      mockGetDecks.mockResolvedValue(mockDecks);
      const context = {
        url: new URL("http://localhost:4321/api/decks?page=1&pageSize=10"),
        locals: { user: { id: userId }, supabase: {} },
      } as unknown as APIContext;

      // Act
      const response = await GET(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockDecks);
      expect(mockGetDecks).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        sortBy: "updated_at",
        sortOrder: "desc",
      });
    });

    it("should return 401 Unauthorized if the user is not authenticated", async () => {
      // Arrange
      const context = {
        url: new URL("http://localhost:4321/api/decks"),
        locals: { user: null, supabase: {} },
      } as unknown as APIContext;

      // Act
      const response = await GET(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized. Please log in.");
    });

    it("should return 400 Bad Request for invalid query parameters", async () => {
      // Arrange
      const context = {
        url: new URL("http://localhost:4321/api/decks?page=-1"),
        locals: { user: { id: userId }, supabase: {} },
      } as unknown as APIContext;

      // Act
      const response = await GET(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid query parameters");
    });

    it("should return 500 Internal Server Error if the service throws an error", async () => {
      // Arrange
      mockGetDecks.mockRejectedValue(new Error("Database connection failed"));
      const context = {
        url: new URL("http://localhost:4321/api/decks"),
        locals: { user: { id: userId }, supabase: {} },
      } as unknown as APIContext;

      // Act
      const response = await GET(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error. Please try again later.");
    });
  });

  describe("POST handler", () => {
    it("should create a new deck and return 201 Created", async () => {
      // Arrange
      const newDeck = { id: "new-deck-id", name: "New Deck", flashcardCount: 0 };
      mockCreateDeck.mockResolvedValue(newDeck);
      const request = new Request("http://localhost:4321/api/decks", {
        method: "POST",
        body: JSON.stringify({ name: "New Deck" }),
        headers: { "Content-Type": "application/json" },
      });
      const context = { request, locals: { user: { id: userId }, supabase: {} } } as unknown as APIContext;

      // Act
      const response = await POST(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(newDeck);
      expect(mockCreateDeck).toHaveBeenCalledWith({ name: "New Deck" });
    });

    it("should return 401 Unauthorized if the user is not authenticated", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/decks", {
        method: "POST",
        body: JSON.stringify({ name: "New Deck" }),
      });
      const context = { request, locals: { user: null, supabase: {} } } as unknown as APIContext;

      // Act
      const response = await POST(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized. Please log in.");
    });

    it("should return 400 Bad Request for an invalid request body", async () => {
      // Arrange
      const request = new Request("http://localhost:4321/api/decks", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });
      const context = { request, locals: { user: { id: userId }, supabase: {} } } as unknown as APIContext;

      // Act
      const response = await POST(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("should return 403 Forbidden if the deck limit is exceeded", async () => {
      // Arrange
      const errorMessage = "You have reached the maximum number of decks (10).";
      const { DeckLimitExceededError } = await import("../../../../src/lib/deckService");
      mockCreateDeck.mockRejectedValue(new DeckLimitExceededError(errorMessage));
      const request = new Request("http://localhost:4321/api/decks", {
        method: "POST",
        body: JSON.stringify({ name: "New Deck" }),
      });
      const context = { request, locals: { user: { id: userId }, supabase: {} } } as unknown as APIContext;

      // Act
      const response = await POST(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe(errorMessage);
    });

    it("should return 500 Internal Server Error if the service throws an unexpected error", async () => {
      // Arrange
      mockCreateDeck.mockRejectedValue(new Error("Database connection failed"));
      const request = new Request("http://localhost:4321/api/decks", {
        method: "POST",
        body: JSON.stringify({ name: "New Deck" }),
      });
      const context = { request, locals: { user: { id: userId }, supabase: {} } } as unknown as APIContext;

      // Act
      const response = await POST(context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error. Please try again later.");
    });
  });
});
