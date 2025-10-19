import { useState, useEffect, useCallback } from "react";
import type { DeckDto, CreateDeckCommand, UpdateDeckCommand, PaginatedResponse } from "@/types";

interface UseDecksReturn {
  decks: DeckDto[];
  totalDecks: number;
  isLoading: boolean;
  error: Error | null;
  createDeck: (name: string) => Promise<void>;
  renameDeck: (deckId: string, name: string) => Promise<void>;
  deleteDeck: (deckId: string) => Promise<void>;
}

export function useDecks(): UseDecksReturn {
  const [decks, setDecks] = useState<DeckDto[]>([]);
  const [totalDecks, setTotalDecks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDecks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/decks?pageSize=10&sortBy=updated_at&sortOrder=desc");

      if (!response.ok) {
        throw new Error(`Failed to fetch decks: ${response.statusText}`);
      }

      const data: PaginatedResponse<DeckDto> = await response.json();
      setDecks(data.data);
      setTotalDecks(data.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
      // eslint-disable-next-line no-console
      console.error("Error fetching decks:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const createDeck = useCallback(
    async (name: string) => {
      try {
        const command: CreateDeckCommand = { name };

        const response = await fetch("/api/decks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to create deck: ${response.statusText}`);
        }

        // Re-fetch decks to update the list
        await fetchDecks();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error creating deck:", err);
        throw err instanceof Error ? err : new Error("Failed to create deck");
      }
    },
    [fetchDecks]
  );

  const renameDeck = useCallback(
    async (deckId: string, name: string) => {
      try {
        const command: UpdateDeckCommand = { name };

        const response = await fetch(`/api/decks/${deckId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to rename deck: ${response.statusText}`);
        }

        // Re-fetch decks to update the list
        await fetchDecks();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error renaming deck:", err);
        throw err instanceof Error ? err : new Error("Failed to rename deck");
      }
    },
    [fetchDecks]
  );

  const deleteDeck = useCallback(
    async (deckId: string) => {
      try {
        const response = await fetch(`/api/decks/${deckId}`, {
          method: "DELETE",
        });

        if (!response.ok && response.status !== 204) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to delete deck: ${response.statusText}`);
        }

        // Re-fetch decks to update the list
        await fetchDecks();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error deleting deck:", err);
        throw err instanceof Error ? err : new Error("Failed to delete deck");
      }
    },
    [fetchDecks]
  );

  return {
    decks,
    totalDecks,
    isLoading,
    error,
    createDeck,
    renameDeck,
    deleteDeck,
  };
}
