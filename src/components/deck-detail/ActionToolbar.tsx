import { Button } from "../ui/button";

interface ActionToolbarProps {
  onStudy: () => void;
  onGenerate: () => void;
  onAdd: () => void;
  deckIsStudiable: boolean;
  deckIsFull: boolean;
}

export function ActionToolbar({ onStudy, onGenerate, onAdd, deckIsStudiable, deckIsFull }: ActionToolbarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button onClick={onStudy} disabled={!deckIsStudiable} size="lg" className="font-semibold">
        Study This Deck
      </Button>

      <Button onClick={onGenerate} disabled={deckIsFull} variant="outline" size="lg">
        Generate Flashcards
      </Button>

      <Button onClick={onAdd} disabled={deckIsFull} variant="outline" size="lg">
        Add Card Manually
      </Button>
    </div>
  );
}
