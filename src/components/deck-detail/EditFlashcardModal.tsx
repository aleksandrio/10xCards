import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createFlashcardSchema } from "@/lib/schemas";
import { z } from "zod";
import type { FlashcardDto } from "@/types";

interface EditFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (flashcardId: string, front: string, back: string) => Promise<void>;
  flashcard: FlashcardDto | null;
}

export function EditFlashcardModal({ isOpen, onClose, onSubmit, flashcard }: EditFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-populate form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
    }
  }, [flashcard]);

  const handleClose = () => {
    setFront("");
    setBack("");
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!flashcard) return;

    // Validate using Zod schema
    try {
      createFlashcardSchema.parse({ front, back });
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { front?: string; back?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === "front" || err.path[0] === "back") {
            fieldErrors[err.path[0]] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    // Submit the form
    try {
      setIsSubmitting(true);
      await onSubmit(flashcard.id, front, back);
      handleClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating flashcard:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Update the front and back text of this flashcard.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-front" className="text-sm font-medium">
                Front <span className="text-destructive">*</span>
              </label>
              <Input
                id="edit-front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Question or prompt"
                maxLength={200}
                aria-invalid={!!errors.front}
                aria-describedby={errors.front ? "edit-front-error" : undefined}
              />
              {errors.front && (
                <p id="edit-front-error" className="text-sm text-destructive">
                  {errors.front}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{front.length}/200 characters</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-back" className="text-sm font-medium">
                Back <span className="text-destructive">*</span>
              </label>
              <textarea
                id="edit-back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Answer or explanation"
                maxLength={500}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={!!errors.back}
                aria-describedby={errors.back ? "edit-back-error" : undefined}
              />
              {errors.back && (
                <p id="edit-back-error" className="text-sm text-destructive">
                  {errors.back}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{back.length}/500 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !front.trim() || !back.trim()}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
