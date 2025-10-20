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

interface SessionCompleteDialogProps {
  isOpen: boolean;
  onRestart: () => void;
  onExit: () => void;
}

export function SessionCompleteDialog({ isOpen, onRestart, onExit }: SessionCompleteDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Study Session Complete!</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ve reviewed all the cards in this deck. Would you like to study them again or return to the deck?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onExit}>Return to Deck</AlertDialogCancel>
          <AlertDialogAction onClick={onRestart}>Study Again</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
