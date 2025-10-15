import { useState, useCallback } from "react";
import type { DeckDto, FlashcardDto, PaginatedResponse, CreateFlashcardCommand, UpdateFlashcardCommand } from "@/types";

interface DeckDetailViewModel {
  deck: DeckDto | null;
  flashcards: FlashcardDto[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    hasNextPage: boolean;
    total: number;
  };
}

interface UseDeckDetailReturn {
  viewModel: DeckDetailViewModel;
  setViewModel: React.Dispatch<React.SetStateAction<DeckDetailViewModel>>;
  loadMoreFlashcards: () => Promise<void>;
  createFlashcard: (command: CreateFlashcardCommand) => Promise<void>;
  updateFlashcard: (flashcardId: string, command: UpdateFlashcardCommand) => Promise<void>;
  deleteFlashcard: (flashcardId: string) => Promise<void>;
  refreshDeck: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

export function useDeckDetail(
  deckId: string,
  initialDeck: DeckDto,
  initialFlashcards: PaginatedResponse<FlashcardDto>
): UseDeckDetailReturn {
  const [viewModel, setViewModel] = useState<DeckDetailViewModel>({
    deck: initialDeck,
    flashcards: initialFlashcards.data,
    isLoading: false,
    error: null,
    pagination: {
      currentPage: initialFlashcards.pagination.page,
      hasNextPage: initialFlashcards.pagination.page < initialFlashcards.pagination.totalPages,
      total: initialFlashcards.pagination.totalItems,
    },
  });

  const refreshDeck = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch deck: ${response.statusText}`);
      }

      const deck: DeckDto = await response.json();

      setViewModel((prev) => ({
        ...prev,
        deck,
      }));
    } catch (err) {
      console.error("Error refreshing deck:", err);
      throw err instanceof Error ? err : new Error("Failed to refresh deck");
    }
  }, [deckId]);

  const loadMoreFlashcards = useCallback(async () => {
    if (!viewModel.pagination.hasNextPage || viewModel.isLoading) {
      return;
    }

    try {
      setViewModel((prev) => ({ ...prev, isLoading: true }));

      const nextPage = viewModel.pagination.currentPage + 1;
      const response = await fetch(`/api/decks/${deckId}/flashcards?page=${nextPage}&pageSize=20`);

      if (!response.ok) {
        throw new Error(`Failed to fetch flashcards: ${response.statusText}`);
      }

      const data: PaginatedResponse<FlashcardDto> = await response.json();

      setViewModel((prev) => ({
        ...prev,
        flashcards: [...prev.flashcards, ...data.data],
        isLoading: false,
        pagination: {
          currentPage: data.pagination.page,
          hasNextPage: data.pagination.page < data.pagination.totalPages,
          total: data.pagination.totalItems,
        },
      }));
    } catch (err) {
      console.error("Error loading more flashcards:", err);
      setViewModel((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load flashcards",
      }));
    }
  }, [deckId, viewModel.pagination.hasNextPage, viewModel.pagination.currentPage, viewModel.isLoading]);

  const createFlashcard = useCallback(
    async (command: CreateFlashcardCommand) => {
      try {
        const response = await fetch(`/api/decks/${deckId}/flashcards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to create flashcard: ${response.statusText}`);
        }

        const newFlashcard: FlashcardDto = await response.json();

        // Add the new flashcard to the beginning of the list (optimistic update)
        setViewModel((prev) => ({
          ...prev,
          flashcards: [newFlashcard, ...prev.flashcards],
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total + 1,
          },
        }));

        // Refresh deck to update card count
        await refreshDeck();
      } catch (err) {
        console.error("Error creating flashcard:", err);
        throw err instanceof Error ? err : new Error("Failed to create flashcard");
      }
    },
    [deckId, refreshDeck]
  );

  const updateFlashcard = useCallback(async (flashcardId: string, command: UpdateFlashcardCommand) => {
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update flashcard: ${response.statusText}`);
      }

      const updatedFlashcard: FlashcardDto = await response.json();

      // Update the flashcard in the list (optimistic update)
      setViewModel((prev) => ({
        ...prev,
        flashcards: prev.flashcards.map((fc) => (fc.id === flashcardId ? updatedFlashcard : fc)),
      }));
    } catch (err) {
      console.error("Error updating flashcard:", err);
      throw err instanceof Error ? err : new Error("Failed to update flashcard");
    }
  }, []);

  const deleteFlashcard = useCallback(
    async (flashcardId: string) => {
      try {
        const response = await fetch(`/api/flashcards/${flashcardId}`, {
          method: "DELETE",
        });

        if (!response.ok && response.status !== 204) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to delete flashcard: ${response.statusText}`);
        }

        // Remove the flashcard from the list (optimistic update)
        setViewModel((prev) => ({
          ...prev,
          flashcards: prev.flashcards.filter((fc) => fc.id !== flashcardId),
          pagination: {
            ...prev.pagination,
            total: prev.pagination.total - 1,
          },
        }));

        // Refresh deck to update card count
        await refreshDeck();
      } catch (err) {
        console.error("Error deleting flashcard:", err);
        throw err instanceof Error ? err : new Error("Failed to delete flashcard");
      }
    },
    [refreshDeck]
  );

  const refreshAll = useCallback(async () => {
    try {
      // Refresh both deck and flashcards (first page)
      const [deckResponse, flashcardsResponse] = await Promise.all([
        fetch(`/api/decks/${deckId}`),
        fetch(`/api/decks/${deckId}/flashcards?page=1&pageSize=20`),
      ]);

      if (!deckResponse.ok || !flashcardsResponse.ok) {
        throw new Error("Failed to refresh data");
      }

      const deck: DeckDto = await deckResponse.json();
      const flashcardsData: PaginatedResponse<FlashcardDto> = await flashcardsResponse.json();

      setViewModel((prev) => ({
        ...prev,
        deck,
        flashcards: flashcardsData.data,
        pagination: {
          currentPage: flashcardsData.pagination.page,
          hasNextPage: flashcardsData.pagination.page < flashcardsData.pagination.totalPages,
          total: flashcardsData.pagination.totalItems,
        },
      }));
    } catch (err) {
      console.error("Error refreshing all data:", err);
      throw err instanceof Error ? err : new Error("Failed to refresh data");
    }
  }, [deckId]);

  return {
    viewModel,
    setViewModel,
    loadMoreFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    refreshDeck,
    refreshAll,
  };
}
