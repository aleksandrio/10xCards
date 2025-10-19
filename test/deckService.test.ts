import { vi, describe, it, expect, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { DeckService, DeckLimitExceededError } from "../src/lib/deckService";
import type { SupabaseClient } from "../src/db/supabase.client";

interface PostgrestFilterBuilder<T> {
  order: Mock;
  range: Mock;
  then: (callback: (result: { data: T[] | null; error: Error | null; count?: number }) => void) => void;
}

// Mock Supabase client
const mockOrder = vi.fn().mockReturnThis();
const mockRange = vi.fn();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: mockEq,
  order: mockOrder,
  range: mockRange,
  single: mockSingle,
};

describe("DeckService", () => {
  let deckService: DeckService;
  const userId = "test-user-id";

  beforeEach(() => {
    vi.clearAllMocks();
    deckService = new DeckService(mockSupabase as unknown as SupabaseClient, userId);
  });

  describe("getDecks", () => {
    const getDecksOptions = {
      page: 1,
      pageSize: 10,
      sortBy: "name",
      sortOrder: "asc",
    } as const;

    it("should return a paginated list of decks", async () => {
      const mockDecks = [
        {
          id: "deck-1",
          name: "Deck 1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          flashcards: [{ id: "fc-1" }, { id: "fc-2" }],
        },
      ];
      mockSupabase.select
        .mockReturnValueOnce({
          // Mock the count query
          then: (callback: (result: { count: number; error: null }) => void) => callback({ count: 1, error: null }),
        })
        .mockReturnValueOnce({
          // Mock the data query
          order: mockOrder,
          range: mockRange.mockResolvedValue({ data: mockDecks, error: null }),
        } as PostgrestFilterBuilder<typeof mockDecks>);

      const result = await deckService.getDecks(getDecksOptions);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Deck 1");
      expect(result.data[0].flashcardCount).toBe(2);
      expect(result.pagination.totalItems).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith("decks");
      expect(mockSupabase.select).toHaveBeenCalledWith("*", { count: "exact", head: true });
      expect(mockSupabase.order).toHaveBeenCalledWith("name", { ascending: true });
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
    });

    it("should handle empty deck list", async () => {
      mockSupabase.select
        .mockReturnValueOnce({
          then: (callback: (result: { count: number; error: null }) => void) => callback({ count: 0, error: null }),
        })
        .mockReturnValueOnce({
          order: mockOrder,
          range: mockRange.mockResolvedValue({ data: [], error: null }),
        } as PostgrestFilterBuilder<never>);

      const result = await deckService.getDecks(getDecksOptions);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it("should throw an error if counting decks fails", async () => {
      mockSupabase.select.mockReturnValueOnce({
        then: (callback: (result: { count: null; error: Error }) => void) =>
          callback({ count: null, error: new Error("Count failed") }),
      });

      await expect(deckService.getDecks(getDecksOptions)).rejects.toThrow("Failed to count decks: Count failed");
    });

    it("should throw an error if fetching decks fails", async () => {
      mockSupabase.select
        .mockReturnValueOnce({
          then: (callback: (result: { count: number; error: null }) => void) => callback({ count: 0, error: null }),
        })
        .mockReturnValueOnce({
          order: mockOrder,
          range: mockRange.mockResolvedValue({ data: null, error: new Error("Fetch failed") }),
        } as PostgrestFilterBuilder<never>);

      await expect(deckService.getDecks(getDecksOptions)).rejects.toThrow("Failed to fetch decks: Fetch failed");
    });
  });

  describe("getDeckById", () => {
    const deckId = "deck-1";

    it("should return a deck if found", async () => {
      const mockDeck = {
        id: deckId,
        name: "Deck 1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        flashcards: [{ id: "fc-1" }],
      };
      mockSingle.mockResolvedValue({ data: mockDeck, error: null });

      const result = await deckService.getDeckById(deckId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(deckId);
      expect(result?.name).toBe("Deck 1");
      expect(result?.flashcardCount).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith("decks");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", deckId);
    });

    it("should return null if deck not found", async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      const result = await deckService.getDeckById(deckId);

      expect(result).toBeNull();
    });

    it("should throw an error if fetching fails", async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error("Fetch failed") });

      await expect(deckService.getDeckById(deckId)).rejects.toThrow("Failed to fetch deck: Fetch failed");
    });
  });

  describe("createDeck", () => {
    const createCommand = { name: "New Deck" };

    it("should create a deck successfully", async () => {
      const newDeck = {
        id: "new-deck-id",
        name: "New Deck",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockSupabase.select.mockResolvedValueOnce({ count: 5, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: newDeck, error: null });

      const result = await deckService.createDeck(createCommand);

      expect(result.name).toBe("New Deck");
      expect(result.flashcardCount).toBe(0);
      expect(mockSupabase.insert).toHaveBeenCalledWith({ name: "New Deck", user_id: userId });
    });

    it("should throw DeckLimitExceededError if deck limit is reached", async () => {
      mockSupabase.select.mockResolvedValueOnce({ count: 10, error: null });

      await expect(deckService.createDeck(createCommand)).rejects.toThrow(DeckLimitExceededError);
    });

    it("should throw an error if checking deck count fails", async () => {
      mockSupabase.select.mockResolvedValueOnce({ count: null, error: new Error("Count failed") });

      await expect(deckService.createDeck(createCommand)).rejects.toThrow("Failed to check deck count: Count failed");
    });

    it("should throw an error if deck creation fails", async () => {
      mockSupabase.select.mockResolvedValueOnce({ count: 5, error: null });
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error("Insert failed") });

      await expect(deckService.createDeck(createCommand)).rejects.toThrow("Failed to create deck: Insert failed");
    });
  });

  describe("updateDeck", () => {
    const deckId = "deck-1";
    const updateCommand = { name: "Updated Deck" };

    it("should update a deck successfully", async () => {
      const updatedDeck = {
        id: deckId,
        name: "Updated Deck",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        flashcards: [],
      };
      mockSingle.mockResolvedValue({ data: updatedDeck, error: null });

      const result = await deckService.updateDeck(deckId, updateCommand);

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Updated Deck");
      expect(mockSupabase.update).toHaveBeenCalledWith({ name: "Updated Deck" });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", deckId);
    });

    it("should return null if deck to update is not found", async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      const result = await deckService.updateDeck(deckId, updateCommand);

      expect(result).toBeNull();
    });

    it("should throw an error if update fails", async () => {
      mockSingle.mockResolvedValue({ data: null, error: new Error("Update failed") });

      await expect(deckService.updateDeck(deckId, updateCommand)).rejects.toThrow(
        "Failed to update deck: Update failed"
      );
    });
  });

  describe("deleteDeck", () => {
    const deckId = "deck-1";

    it("should return true when deck is deleted successfully", async () => {
      mockEq.mockResolvedValue({ error: null, count: 1 });

      const result = await deckService.deleteDeck(deckId);

      expect(result).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalledWith({ count: "exact" });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", deckId);
    });

    it("should return false if deck to delete is not found", async () => {
      mockEq.mockResolvedValue({ error: null, count: 0 });

      const result = await deckService.deleteDeck(deckId);

      expect(result).toBe(false);
    });

    it("should throw an error if delete fails", async () => {
      mockEq.mockResolvedValue({ error: new Error("Delete failed"), count: null });

      await expect(deckService.deleteDeck(deckId)).rejects.toThrow("Failed to delete deck: Delete failed");
    });
  });
});
