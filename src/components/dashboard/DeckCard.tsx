import type { DeckDto } from "@/types";
import { DeckActionsMenu } from "./DeckActionsMenu";

interface DeckCardProps {
  deck: DeckDto;
  onRename: (deck: DeckDto) => void;
  onDelete: (deck: DeckDto) => void;
}

export function DeckCard({ deck, onRename, onDelete }: DeckCardProps) {
  return (
    <a
      href={`/decks/${deck.id}`}
      className="block rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate mb-2">{deck.name}</h3>
            <p className="text-sm text-muted-foreground">
              {deck.flashcardCount} {deck.flashcardCount === 1 ? "card" : "cards"}
            </p>
          </div>
          <div className="flex-shrink-0" onClick={(e) => e.preventDefault()}>
            <DeckActionsMenu deck={deck} onRename={onRename} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </a>
  );
}
