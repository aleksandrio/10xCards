import type { DeckDto } from "@/types";
import { DeckCard } from "./DeckCard";

interface DeckGridProps {
  decks: DeckDto[];
  onRename: (deck: DeckDto) => void;
  onDelete: (deck: DeckDto) => void;
}

export function DeckGrid({ decks, onRename, onDelete }: DeckGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="deck-grid">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} onRename={onRename} onDelete={onDelete} />
      ))}
    </div>
  );
}
