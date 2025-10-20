import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationControlsProps {
  currentIndex: number;
  totalCards: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function NavigationControls({ currentIndex, onPrevious, onNext }: NavigationControlsProps) {
  const isFirstCard = currentIndex === 0;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onPrevious}
        disabled={isFirstCard}
        className="flex-1 sm:flex-none sm:min-w-[140px]"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>

      {/* Keyboard shortcuts hint */}
      <div className="hidden text-center text-sm text-muted-foreground sm:block">
        <kbd className="rounded bg-primary/30 px-2 py-1 text-xs">←</kbd>
        <span className="mx-2">Previous</span>
        <span className="mx-2">|</span>
        <kbd className="rounded bg-primary/30 px-2 py-1 text-xs">Space</kbd>
        <span className="mx-2">Flip</span>
        <span className="mx-2">|</span>
        <kbd className="rounded bg-primary/30 px-2 py-1 text-xs">→</kbd>
        <span className="mx-2">Next</span>
      </div>

      {/* Next button */}
      <Button variant="default" size="lg" onClick={onNext} className="flex-1 sm:flex-none sm:min-w-[140px]">
        Next
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
