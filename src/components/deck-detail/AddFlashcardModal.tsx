import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createFlashcardSchema } from "@/lib/schemas";
import { z } from "zod";

interface AddFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (front: string, back: string) => Promise<void>;
}

export function AddFlashcardModal({ isOpen, onClose, onSubmit }: AddFlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setFront("");
    setBack("");
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await onSubmit(front, back);
      handleClose();
    } catch (error) {
      console.error("Error creating flashcard:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Flashcard</DialogTitle>
          <DialogDescription>Create a new flashcard by entering the front and back text.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="front" className="text-sm font-medium">
                Front <span className="text-destructive">*</span>
              </label>
              <Input
                id="front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Question or prompt"
                maxLength={200}
                aria-invalid={!!errors.front}
                aria-describedby={errors.front ? "front-error" : undefined}
              />
              {errors.front && (
                <p id="front-error" className="text-sm text-destructive">
                  {errors.front}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{front.length}/200 characters</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="back" className="text-sm font-medium">
                Back <span className="text-destructive">*</span>
              </label>
              <textarea
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Answer or explanation"
                maxLength={500}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={!!errors.back}
                aria-describedby={errors.back ? "back-error" : undefined}
              />
              {errors.back && (
                <p id="back-error" className="text-sm text-destructive">
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
              {isSubmitting ? "Adding..." : "Add Flashcard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
