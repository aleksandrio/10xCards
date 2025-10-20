import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StudyView } from "../src/components/study/StudyView";
import type { FlashcardDto } from "../src/types";

// Mock the child components
vi.mock("../src/components/study/ProgressBar", () => ({
  ProgressBar: ({ currentIndex, totalCards }: { currentIndex: number; totalCards: number }) => (
    <div data-testid="progress-bar">
      Card {currentIndex + 1} of {totalCards}
    </div>
  ),
}));

vi.mock("../src/components/study/StudyCard", () => ({
  StudyCard: ({
    frontText,
    backText,
    isFlipped,
    onFlip,
  }: {
    frontText: string;
    backText: string;
    isFlipped: boolean;
    onFlip: () => void;
  }) => (
    <div
      data-testid="study-card"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onFlip();
      }}
      role="button"
      tabIndex={0}
    >
      {isFlipped ? backText : frontText}
    </div>
  ),
}));

vi.mock("../src/components/study/NavigationControls", () => ({
  NavigationControls: ({
    onPrevious,
    onNext,
  }: {
    currentIndex: number;
    totalCards: number;
    onPrevious: () => void;
    onNext: () => void;
  }) => (
    <div data-testid="navigation-controls">
      <button onClick={onPrevious} data-testid="prev-btn">
        Previous
      </button>
      <button onClick={onNext} data-testid="next-btn">
        Next
      </button>
    </div>
  ),
}));

vi.mock("../src/components/study/SessionCompleteDialog", () => ({
  SessionCompleteDialog: ({
    isOpen,
    onRestart,
    onExit,
  }: {
    isOpen: boolean;
    onRestart: () => void;
    onExit: () => void;
  }) =>
    isOpen ? (
      <div data-testid="complete-dialog">
        <button onClick={onRestart}>Study Again</button>
        <button onClick={onExit}>Exit</button>
      </div>
    ) : null,
}));

describe("StudyView component", () => {
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
    // Mock Math.random for consistent shuffle
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render all main components", () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
      expect(screen.getByTestId("study-card")).toBeInTheDocument();
      expect(screen.getByTestId("navigation-controls")).toBeInTheDocument();
    });

    it("should display first card initially", () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 1 of 3");
    });
  });

  describe("Card Flipping", () => {
    it("should flip card when clicked", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      const card = screen.getByTestId("study-card");

      // Initially shows front
      expect(card).toHaveTextContent(/Question/);

      // Click to flip
      fireEvent.click(card);

      await waitFor(() => {
        expect(card).toHaveTextContent(/Answer/);
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to next card", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      const nextBtn = screen.getByTestId("next-btn");
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 2 of 3");
      });
    });

    it("should navigate to previous card", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      // Go to second card first
      const nextBtn = screen.getByTestId("next-btn");
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 2 of 3");
      });

      // Go back to first card
      const prevBtn = screen.getByTestId("prev-btn");
      fireEvent.click(prevBtn);

      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 1 of 3");
      });
    });
  });

  describe("Keyboard Controls", () => {
    it("should flip card on Space key", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      const card = screen.getByTestId("study-card");

      // Initially shows front
      expect(card).toHaveTextContent(/Question/);

      // Press Space
      fireEvent.keyDown(window, { code: "Space" });

      await waitFor(() => {
        expect(card).toHaveTextContent(/Answer/);
      });
    });

    it("should navigate to next card on ArrowRight key", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      fireEvent.keyDown(window, { code: "ArrowRight" });

      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 2 of 3");
      });
    });

    it("should navigate to previous card on ArrowLeft key", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      // Go to second card
      fireEvent.keyDown(window, { code: "ArrowRight" });

      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 2 of 3");
      });

      // Go back
      fireEvent.keyDown(window, { code: "ArrowLeft" });

      await waitFor(() => {
        expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 1 of 3");
      });
    });

    it("should prevent default behavior for navigation keys", () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      const spaceEvent = new KeyboardEvent("keydown", { code: "Space" });
      const preventDefaultSpy = vi.spyOn(spaceEvent, "preventDefault");

      window.dispatchEvent(spaceEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Session Completion", () => {
    it("should show completion dialog when all cards are reviewed", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      const nextBtn = screen.getByTestId("next-btn");

      // Navigate through all cards
      fireEvent.click(nextBtn); // Card 2
      fireEvent.click(nextBtn); // Card 3
      fireEvent.click(nextBtn); // Complete

      await waitFor(() => {
        expect(screen.getByTestId("complete-dialog")).toBeInTheDocument();
      });
    });

    it("should restart session when Study Again is clicked", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      const nextBtn = screen.getByTestId("next-btn");

      // Complete the session
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByTestId("complete-dialog")).toBeInTheDocument();
      });

      // Click Study Again
      const studyAgainBtn = screen.getByText("Study Again");
      fireEvent.click(studyAgainBtn);

      await waitFor(() => {
        expect(screen.queryByTestId("complete-dialog")).not.toBeInTheDocument();
        expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 1 of 3");
      });
    });

    it("should navigate to deck when Exit is clicked", async () => {
      render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      const nextBtn = screen.getByTestId("next-btn");

      // Complete the session
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByTestId("complete-dialog")).toBeInTheDocument();
      });

      // Click Exit
      const exitBtn = screen.getByText("Exit");
      fireEvent.click(exitBtn);

      expect(window.location.href).toBe("/decks/deck-1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle single card deck", () => {
      const singleCard = [mockFlashcards[0]];
      render(<StudyView flashcards={singleCard} deckId="deck-1" />);

      expect(screen.getByTestId("progress-bar")).toHaveTextContent("Card 1 of 1");
    });

    it("should handle empty flashcards array gracefully", () => {
      render(<StudyView flashcards={[]} deckId="deck-1" />);

      expect(screen.queryByTestId("study-card")).not.toBeInTheDocument();
    });
  });

  describe("Cleanup", () => {
    it("should remove keyboard listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(<StudyView flashcards={mockFlashcards} deckId="deck-1" />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });
  });
});
