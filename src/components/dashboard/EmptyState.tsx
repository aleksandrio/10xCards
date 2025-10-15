import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateDeck: () => void;
}

export function EmptyState({ onCreateDeck }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold">No decks yet</h2>
        <p className="text-muted-foreground">
          Get started by creating your first flashcard deck. Organize your learning materials and start studying!
        </p>
        <Button onClick={onCreateDeck} size="lg" className="mt-4">
          Create Your First Deck
        </Button>
      </div>
    </div>
  );
}
