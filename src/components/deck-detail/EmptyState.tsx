import { Button } from "../ui/button";

interface EmptyStateProps {
  onAddCard: () => void;
}

export function EmptyState({ onAddCard }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold tracking-tight">No Flashcards Yet</h2>
        <p className="text-muted-foreground">
          This deck is empty. Start by adding flashcards manually or use AI to generate them from your study materials.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button onClick={onAddCard} size="lg">
            Add Your First Card
          </Button>
        </div>
      </div>
    </div>
  );
}
