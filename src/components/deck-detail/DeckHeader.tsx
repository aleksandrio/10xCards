import type { DeckDto } from "../../types";

interface DeckHeaderProps {
  deck: DeckDto | null;
}

export function DeckHeader({ deck }: DeckHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Breadcrumb navigation */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          <li>
            <a href="/dashboard" className="hover:text-foreground transition-colors">
              My Decks
            </a>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground font-medium">{deck?.name || "Loading..."}</li>
        </ol>
      </nav>

      {/* Deck title and metadata */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-4xl font-bold tracking-tight">{deck?.name || "Loading..."}</h1>
        {deck && (
          <span className="text-muted-foreground text-sm">
            {deck.flashcardCount} {deck.flashcardCount === 1 ? "card" : "cards"}
          </span>
        )}
      </div>
    </div>
  );
}
