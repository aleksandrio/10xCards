import { useEffect } from "react";
import type { FlashcardDto } from "../../types";
import { ProgressBar } from "./ProgressBar";
import { StudyCard } from "./StudyCard";
import { NavigationControls } from "./NavigationControls";
import { SessionCompleteDialog } from "./SessionCompleteDialog";
import { useStudySession } from "../../lib/hooks/useStudySession";

interface StudyViewProps {
  flashcards: FlashcardDto[];
  deckId: string;
}

export function StudyView({ flashcards, deckId }: StudyViewProps) {
  const {
    currentCard,
    currentIndex,
    totalCards,
    isFlipped,
    isComplete,
    goToNext,
    goToPrevious,
    flipCard,
    restartSession,
  } = useStudySession(flashcards);

  // Keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for navigation keys
      if (["Space", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case "Space":
          flipCard();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipCard, goToNext, goToPrevious]);

  // Handle exit to deck detail page
  const handleExit = () => {
    window.location.href = `/decks/${deckId}`;
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Header with progress */}
      <header className="shrink-0 border-b">
        <div className="container mx-auto px-4 py-4">
          <ProgressBar currentIndex={currentIndex} totalCards={totalCards} />
        </div>
      </header>

      {/* Main study area */}
      <main className="flex min-h-0 flex-1 items-center justify-center p-4">
        {currentCard && (
          <StudyCard
            frontText={currentCard.front}
            backText={currentCard.back}
            isFlipped={isFlipped}
            onFlip={flipCard}
          />
        )}
      </main>

      {/* Navigation controls */}
      <footer className="shrink-0 border-t">
        <div className="container mx-auto px-4 py-4">
          <NavigationControls
            currentIndex={currentIndex}
            totalCards={totalCards}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        </div>
      </footer>

      {/* Session complete dialog */}
      <SessionCompleteDialog isOpen={isComplete} onRestart={restartSession} onExit={handleExit} />
    </div>
  );
}
