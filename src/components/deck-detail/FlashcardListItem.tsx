import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardDto } from "../../types";
import { Button } from "../ui/button";

interface FlashcardListItemProps {
  flashcard: FlashcardDto;
  onEdit: (card: FlashcardDto) => void;
  onDelete: (card: FlashcardDto) => void;
  variant: "table" | "card";
}

export function FlashcardListItem({ flashcard, onEdit, onDelete, variant }: FlashcardListItemProps) {
  if (variant === "table") {
    return (
      <tr className="hover:bg-muted/50 transition-colors">
        <td className="py-3 px-4 max-w-xs">
          <div className="line-clamp-2">{flashcard.front}</div>
        </td>
        <td className="py-3 px-4 max-w-xs">
          <div className="line-clamp-2">{flashcard.back}</div>
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-1 justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(flashcard)}
              aria-label="Edit flashcard"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDelete(flashcard)}
              aria-label="Delete flashcard"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  // Card variant for mobile
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6" data-testid="flashcard-list-item">
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="font-medium">{flashcard.front}</div>
        </div>
        <div className="flex-1">
          <div className="font-medium">{flashcard.back}</div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(flashcard)}
          aria-label="Edit flashcard"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onDelete(flashcard)}
          aria-label="Delete flashcard"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
