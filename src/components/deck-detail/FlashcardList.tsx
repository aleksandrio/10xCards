import { useRef, useEffect } from "react";
import type { FlashcardDto } from "../../types";
import { FlashcardListItem } from "./FlashcardListItem";

interface FlashcardListProps {
  flashcards: FlashcardDto[];
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit: (card: FlashcardDto) => void;
  onDelete: (card: FlashcardDto) => void;
}

export function FlashcardList({ flashcards, hasMore, onLoadMore, onEdit, onDelete }: FlashcardListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, onLoadMore]);

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-sm">Front</th>
              <th className="text-left py-3 px-4 font-medium text-sm">Back</th>
              <th className="text-right py-3 px-4 font-medium text-sm w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {flashcards.map((flashcard) => (
              <FlashcardListItem
                key={flashcard.id}
                flashcard={flashcard}
                onEdit={onEdit}
                onDelete={onDelete}
                variant="table"
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list view */}
      <div className="md:hidden space-y-3">
        {flashcards.map((flashcard) => (
          <FlashcardListItem
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={onEdit}
            onDelete={onDelete}
            variant="card"
          />
        ))}
      </div>

      {/* Intersection observer target for infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="py-4 text-center">
          <div
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status"
          >
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
