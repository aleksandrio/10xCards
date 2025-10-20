import { useState, useEffect, useCallback, useRef } from "react";
import type { FlashcardDto } from "../../types";

interface StudySessionViewModel {
  shuffledFlashcards: FlashcardDto[];
  currentIndex: number;
  isFlipped: boolean;
  isComplete: boolean;
  totalCards: number;
}

/**
 * Custom hook for managing study session state.
 * Handles card shuffling, navigation, flipping, and session completion.
 *
 * @param initialFlashcards - The array of flashcards to study
 * @returns Study session state and control functions
 */
export function useStudySession(initialFlashcards: FlashcardDto[]) {
  const [session, setSession] = useState<StudySessionViewModel>(() => ({
    shuffledFlashcards: shuffleArray([...initialFlashcards]),
    currentIndex: 0,
    isFlipped: false,
    isComplete: false,
    totalCards: initialFlashcards.length,
  }));

  // Shuffle flashcards when the flashcards reference changes
  // Use a ref to track if flashcards have actually changed
  const flashcardsRef = useRef(initialFlashcards);

  useEffect(() => {
    // Only update if the flashcards array length or content actually changed
    if (
      flashcardsRef.current !== initialFlashcards &&
      (flashcardsRef.current.length !== initialFlashcards.length ||
        !flashcardsRef.current.every((card, i) => card.id === initialFlashcards[i]?.id))
    ) {
      flashcardsRef.current = initialFlashcards;
      setSession({
        shuffledFlashcards: shuffleArray([...initialFlashcards]),
        currentIndex: 0,
        isFlipped: false,
        isComplete: false,
        totalCards: initialFlashcards.length,
      });
    }
  }, [initialFlashcards]);

  // Get current card
  const currentCard = session.shuffledFlashcards[session.currentIndex];

  /**
   * Advances to the next card in the sequence.
   * Sets isComplete to true if on the last card.
   * Always resets flip state to show front of card.
   */
  const goToNext = useCallback(() => {
    setSession((prev) => {
      const nextIndex = prev.currentIndex + 1;

      // If we've reached the end, mark session as complete
      if (nextIndex >= prev.totalCards) {
        return {
          ...prev,
          isComplete: true,
          isFlipped: false,
        };
      }

      // Move to next card, reset flip state
      return {
        ...prev,
        currentIndex: nextIndex,
        isFlipped: false,
      };
    });
  }, []);

  /**
   * Moves back to the previous card.
   * Cannot go before the first card.
   * Always resets flip state to show front of card.
   */
  const goToPrevious = useCallback(() => {
    setSession((prev) => {
      // Cannot go before first card
      if (prev.currentIndex === 0) {
        return prev;
      }

      return {
        ...prev,
        currentIndex: prev.currentIndex - 1,
        isFlipped: false,
      };
    });
  }, []);

  /**
   * Toggles the flip state of the current card.
   */
  const flipCard = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      isFlipped: !prev.isFlipped,
    }));
  }, []);

  /**
   * Restarts the study session by re-shuffling cards
   * and resetting all state.
   */
  const restartSession = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      shuffledFlashcards: shuffleArray([...prev.shuffledFlashcards]),
      currentIndex: 0,
      isFlipped: false,
      isComplete: false,
    }));
  }, []);

  return {
    currentCard,
    currentIndex: session.currentIndex,
    totalCards: session.totalCards,
    isFlipped: session.isFlipped,
    isComplete: session.isComplete,
    goToNext,
    goToPrevious,
    flipCard,
    restartSession,
  };
}

/**
 * Fisher-Yates shuffle algorithm for randomizing array order.
 * Creates a new array to avoid mutating the original.
 *
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
