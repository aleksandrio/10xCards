import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useStudySession } from "../src/lib/hooks/useStudySession";
import type { FlashcardDto } from "../src/types";

describe("useStudySession hook", () => {
  const mockFlashcards: FlashcardDto[] = [
    {
      id: "1",
      deckId: "deck-1",
      front: "Question 1",
      back: "Answer 1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      deckId: "deck-1",
      front: "Question 2",
      back: "Answer 2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      deckId: "deck-1",
      front: "Question 3",
      back: "Answer 3",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Mock Math.random for consistent shuffle behavior
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with first card", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalCards).toBe(3);
      expect(result.current.isFlipped).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });

    it("should provide current card", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      expect(result.current.currentCard).toBeDefined();
      expect(result.current.currentCard.deckId).toBe("deck-1");
    });

    it("should shuffle flashcards on initialization", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      // The cards should be shuffled (not necessarily in original order)
      expect(result.current.totalCards).toBe(mockFlashcards.length);
    });
  });

  describe("Navigation", () => {
    it("should advance to next card", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.isFlipped).toBe(false);
    });

    it("should go to previous card", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentIndex).toBe(1);

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it("should not go before first card", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it("should mark session as complete when reaching the end", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      act(() => {
        result.current.goToNext(); // Card 2
        result.current.goToNext(); // Card 3
        result.current.goToNext(); // Should mark complete
      });

      expect(result.current.isComplete).toBe(true);
    });

    it("should reset flip state when navigating", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      act(() => {
        result.current.flipCard();
      });

      expect(result.current.isFlipped).toBe(true);

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.isFlipped).toBe(false);
    });
  });

  describe("Card Flipping", () => {
    it("should flip card", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      expect(result.current.isFlipped).toBe(false);

      act(() => {
        result.current.flipCard();
      });

      expect(result.current.isFlipped).toBe(true);
    });

    it("should toggle flip state", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      act(() => {
        result.current.flipCard();
      });

      expect(result.current.isFlipped).toBe(true);

      act(() => {
        result.current.flipCard();
      });

      expect(result.current.isFlipped).toBe(false);
    });
  });

  describe("Session Management", () => {
    it("should restart session", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      // Navigate and flip
      act(() => {
        result.current.goToNext();
        result.current.flipCard();
      });

      expect(result.current.currentIndex).toBe(1);
      expect(result.current.isFlipped).toBe(true);

      // Restart
      act(() => {
        result.current.restartSession();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.isFlipped).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });

    it("should re-shuffle cards on restart", () => {
      const { result } = renderHook(() => useStudySession(mockFlashcards));

      act(() => {
        result.current.restartSession();
      });

      // Cards should still be present (total count unchanged)
      expect(result.current.totalCards).toBe(mockFlashcards.length);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single card deck", () => {
      const singleCard = [mockFlashcards[0]];
      const { result } = renderHook(() => useStudySession(singleCard));

      expect(result.current.totalCards).toBe(1);
      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.isComplete).toBe(true);
    });

    it("should handle empty deck", () => {
      const { result } = renderHook(() => useStudySession([]));

      expect(result.current.totalCards).toBe(0);
      expect(result.current.currentCard).toBeUndefined();
    });

    it("should update when flashcards change", () => {
      const { result, rerender } = renderHook(({ cards }) => useStudySession(cards), {
        initialProps: { cards: mockFlashcards },
      });

      expect(result.current.totalCards).toBe(3);

      const newFlashcards = [...mockFlashcards, mockFlashcards[0]];

      rerender({ cards: newFlashcards });

      expect(result.current.totalCards).toBe(4);
      expect(result.current.currentIndex).toBe(0);
    });
  });
});
