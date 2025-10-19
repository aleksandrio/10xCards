import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  generateFlashcards,
  DeckNotFoundError,
  GenerationError,
} from "../src/lib/generationService";
import { OpenRouterService } from "../src/lib/openrouterService";
import type { SupabaseClient } from "../src/db/supabase.client";

// Mock OpenRouterService
vi.mock("../src/lib/openrouterService");

const mockGetChatCompletion = vi.fn();
OpenRouterService.prototype.getChatCompletion = mockGetChatCompletion;

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

describe("generateFlashcards", () => {
  const deckId = "test-deck-id";
  const userId = "test-user-id";
  const text = "This is the text to generate flashcards from.";
  const supabase = mockSupabase as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy Path", () => {
    it("should generate flashcards and log the event successfully", async () => {
      // Arrange
      const mockDeck = { id: deckId, user_id: userId };
      const mockFlashcards = [{ front: "Q1", back: "A1" }];
      const mockGenerationId = "gen-id-123";

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockDeck, error: null }) // Deck check
        .mockResolvedValueOnce({ data: { id: mockGenerationId }, error: null }); // Insert generation

      mockGetChatCompletion.mockResolvedValue({
        flashcards: mockFlashcards,
      });

      // Act
      const result = await generateFlashcards(deckId, text, userId, supabase);

      // Assert
      expect(result.generationId).toBe(mockGenerationId);
      expect(result.suggestedFlashcards).toEqual(mockFlashcards);

      expect(mockSupabase.from).toHaveBeenCalledWith("decks");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", deckId);
      expect(mockGetChatCompletion).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith("generations");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          deck_id: deckId,
          user_id: userId,
          generated_cards_count: mockFlashcards.length,
        })
      );
    });
  });

  describe("Error Handling", () => {
    describe("Deck Verification", () => {
      it("should throw DeckNotFoundError if deck is not found", async () => {
        // Arrange
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error("Not found") });

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, supabase)).rejects.toThrow("Deck not found");
      });

      it("should throw DeckNotFoundError if deck does not belong to the user", async () => {
        // Arrange
        const mockDeck = { id: deckId, user_id: "other-user-id" };
        mockSupabase.single.mockResolvedValueOnce({ data: mockDeck, error: null });

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, supabase)).rejects.toThrow(
          "You do not have access to this deck"
        );
      });
    });

    describe("AI Generation", () => {
      beforeEach(() => {
        const mockDeck = { id: deckId, user_id: userId };
        mockSupabase.single.mockResolvedValueOnce({ data: mockDeck, error: null });
      });

      it("should throw GenerationError if AI returns no flashcards", async () => {
        // Arrange
        mockGetChatCompletion.mockResolvedValue({ flashcards: [] });

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, supabase)).rejects.toThrow(
          "AI did not generate any flashcards. Please try again with different text."
        );
      });

      it("should throw GenerationError for OpenRouterService errors", async () => {
        // Arrange
        const { RateLimitError } = await import("../src/lib/openrouterService");
        mockGetChatCompletion.mockRejectedValue(new RateLimitError("Rate limit exceeded"));

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, supabase)).rejects.toThrow(
          "AI service rate limit exceeded. Please try again in a few moments."
        );
      });

      it("should rethrow GenerationError if it's already a GenerationError", async () => {
        // Arrange
        const customError = new GenerationError("Custom generation error");
        mockGetChatCompletion.mockRejectedValue(customError);

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, supabase)).rejects.toThrow(customError);
      });

      it("should throw a generic GenerationError for unexpected errors", async () => {
        // Arrange
        mockGetChatCompletion.mockRejectedValue(new Error("Unexpected error"));

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, supabase)).rejects.toThrow(
          "An unexpected error occurred during generation. Please try again."
        );
      });
    });

    describe("Database Logging", () => {
      const mockFlashcards = [{ front: "Q1", back: "A1" }];

      beforeEach(() => {
        const mockDeck = { id: deckId, user_id: userId };
        mockSupabase.single.mockResolvedValueOnce({ data: mockDeck, error: null });
        mockGetChatCompletion.mockResolvedValue({ flashcards: mockFlashcards });
      });

      it("should throw GenerationError if logging generation fails", async () => {
        // Arrange
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error("Insert failed") }); // Fail insert generation

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, supabase)).rejects.toThrow("Failed to log generation event");
      });

      it("should attempt to log to generation_errors if logging generation fails", async () => {
        // Arrange
        const insertError = new Error("Insert failed");
        mockSupabase.single.mockResolvedValueOnce({ data: null, error: insertError }); // Fail insert generation
        const mockInsertErrorLog = vi.fn().mockResolvedValue({ error: null });
        const fromMock = vi.fn((table: string) => {
            if (table === 'generations') {
                // This is for the failed insert
                return { 
                    ...mockSupabase,
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValueOnce({ data: null, error: insertError })
                };
            }
            if (table === 'generation_errors') {
                return { insert: mockInsertErrorLog };
            }
            if (table === 'decks') {
                const mockDeck = { id: deckId, user_id: userId };
                return {
                    ...mockSupabase,
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValueOnce({ data: mockDeck, error: null })
                }
            }
            return mockSupabase; // return the default mock for other tables
        });
        const tempSupabase = {
            ...mockSupabase,
            from: fromMock,
        } as unknown as SupabaseClient;

        mockGetChatCompletion.mockResolvedValue({ flashcards: mockFlashcards });

        // Act & Assert
        await expect(generateFlashcards(deckId, text, userId, tempSupabase)).rejects.toThrow(GenerationError);
        
        // Assert that we tried logging the error
        expect(fromMock).toHaveBeenCalledWith('generation_errors');
        expect(mockInsertErrorLog).toHaveBeenCalledWith({
          deck_id: deckId,
          user_id: userId,
          error_message: `Failed to insert generation record: ${insertError.message}`,
        });
      });
    });
  });
});
