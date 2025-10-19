import { vi, describe, it, expect, beforeEach } from "vitest";
import { FlashcardService } from "../src/lib/flashcardService";
import type { SupabaseClient } from "../src/db/supabase.client";
import type { CreateFlashcardCommand, UpdateFlashcardCommand } from "../src/types";

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
} as unknown as SupabaseClient;

describe("FlashcardService", () => {
  let flashcardService: FlashcardService;
  const userId = "test-user-id";
  const deckId = "test-deck-id";

  beforeEach(() => {
    vi.clearAllMocks();
    flashcardService = new FlashcardService(mockSupabase, userId);
  });

  describe("getFlashcardsByDeck", () => {
    it("should retrieve a paginated list of flashcards for a deck", async () => {
      const mockFlashcards = [
        {
          id: "1",
          deck_id: deckId,
          front: "Q1",
          back: "A1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "2",
          deck_id: deckId,
          front: "Q2",
          back: "A2",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      const mockOptions = { page: 1, pageSize: 10 };

      // Mock deck verification
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: deckId }, error: null }),
      } as never);

      // Mock total count
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: mockFlashcards.length, error: null }),
      } as never);

      // Mock data fetch
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockFlashcards, error: null }),
      } as never);

      const result = await flashcardService.getFlashcardsByDeck(deckId, mockOptions);

      expect(result.data.length).toBe(2);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.data[0].front).toBe("Q1");
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should return an empty list when a deck has no flashcards", async () => {
      const mockOptions = { page: 1, pageSize: 10 };

      // Mock deck verification
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: deckId }, error: null }),
      } as never);

      // Mock total count
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      } as never);

      // Mock data fetch
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as never);

      const result = await flashcardService.getFlashcardsByDeck(deckId, mockOptions);

      expect(result.data.length).toBe(0);
      expect(result.pagination.totalItems).toBe(0);
    });

    it("should throw an error if deck verification fails", async () => {
      const mockOptions = { page: 1, pageSize: 10 };

      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
      } as never);

      await expect(flashcardService.getFlashcardsByDeck(deckId, mockOptions)).rejects.toThrow(
        "Failed to verify deck: DB error"
      );
    });
  });

  describe("createFlashcard", () => {
    it("should create a new flashcard", async () => {
      const command: CreateFlashcardCommand = { front: "New Q", back: "New A" };
      const newFlashcard = {
        id: "new-id",
        deck_id: deckId,
        ...command,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock deck verification and count
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: deckId, flashcards: [] }, error: null }),
      } as never);

      // Mock insert
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newFlashcard, error: null }),
      } as never);

      const result = await flashcardService.createFlashcard(deckId, command);

      expect(result).not.toBeNull();
      expect(result.id).toBe("new-id");
      expect(result.front).toBe("New Q");
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should throw an error if creating the flashcard fails", async () => {
      const command: CreateFlashcardCommand = { front: "New Q", back: "New A" };

      // Mock deck verification and count
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: deckId, flashcards: [] }, error: null }),
      } as never);

      // Mock insert failure
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
      } as never);

      await expect(flashcardService.createFlashcard(deckId, command)).rejects.toThrow(
        "Failed to create flashcard: DB error"
      );
    });
  });

  describe("updateFlashcard", () => {
    it("should update a flashcard", async () => {
      const flashcardId = "flashcard-1";
      const command: UpdateFlashcardCommand = { front: "Updated Q", back: "Updated A" };
      const updatedFlashcard = {
        id: flashcardId,
        ...command,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock ownership verification
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: flashcardId, decks: { id: deckId, user_id: userId } }, error: null }),
      } as never);

      // Mock update
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedFlashcard, error: null }),
      } as never);

      const result = await flashcardService.updateFlashcard(flashcardId, command);

      expect(result).not.toBeNull();
      expect(result?.front).toBe("Updated Q");
    });

    it("should throw FlashcardNotFoundError if the flashcard to update is not found", async () => {
      const flashcardId = "non-existent-id";
      const command: UpdateFlashcardCommand = { front: "Updated Q", back: "Updated A" };

      // Mock ownership verification failure
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      } as never);

      await expect(flashcardService.updateFlashcard(flashcardId, command)).rejects.toThrow(
        "Flashcard not found or access denied"
      );
    });

    it("should throw an error if updating the flashcard fails", async () => {
      const flashcardId = "flashcard-1";
      const command: UpdateFlashcardCommand = { front: "Updated Q", back: "Updated A" };

      // Mock ownership verification
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: flashcardId, decks: { id: deckId, user_id: userId } }, error: null }),
      } as never);

      // Mock update failure
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
      } as never);

      await expect(flashcardService.updateFlashcard(flashcardId, command)).rejects.toThrow(
        "Failed to update flashcard: DB error"
      );
    });
  });

  describe("deleteFlashcard", () => {
    it("should delete a flashcard and return true", async () => {
      const flashcardId = "flashcard-1";

      // Mock ownership verification
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: flashcardId, decks: { id: deckId, user_id: userId } }, error: null }),
      } as never);

      // Mock delete
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
      } as never);

      const result = await flashcardService.deleteFlashcard(flashcardId);

      expect(result).toBe(true);
    });

    it("should return false if the flashcard to delete is not found", async () => {
      const flashcardId = "non-existent-id";

      // Mock ownership verification failure
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      } as never);

      const result = await flashcardService.deleteFlashcard(flashcardId);

      expect(result).toBe(false);
    });

    it("should throw an error if deleting the flashcard fails", async () => {
      const flashcardId = "flashcard-1";

      // Mock ownership verification
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: flashcardId, decks: { id: deckId, user_id: userId } }, error: null }),
      } as never);

      // Mock delete failure
      vi.spyOn(mockSupabase, "from").mockReturnValueOnce({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: new Error("DB error") }),
      } as never);

      await expect(flashcardService.deleteFlashcard(flashcardId)).rejects.toThrow(
        "Failed to delete flashcard: DB error"
      );
    });
  });
});
