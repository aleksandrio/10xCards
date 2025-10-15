import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import type { FlashcardDto } from "@/types";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  flashcard: FlashcardDto | null;
  isDeleting?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  flashcard,
  isDeleting = false,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Flashcard?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this flashcard? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {flashcard && (
          <div className="my-4 space-y-2 rounded-lg border bg-muted/50 p-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Front</div>
              <div className="text-sm line-clamp-2">{flashcard.front}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Back</div>
              <div className="text-sm line-clamp-2">{flashcard.back}</div>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
