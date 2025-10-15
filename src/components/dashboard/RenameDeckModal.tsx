import { useState, useEffect } from "react";
import type { DeckDto } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RenameDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  initialData: DeckDto;
}

export function RenameDeckModal({ isOpen, onClose, onSubmit, initialData }: RenameDeckModalProps) {
  const [name, setName] = useState(initialData.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData.name);
      setError(null);
    }
  }, [isOpen, initialData.name]);

  const isValid = name.trim().length > 0 && name.length <= 100;
  const hasChanged = name.trim() !== initialData.name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || !hasChanged || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename deck");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName(initialData.name);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Deck</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="deck-name" className="text-sm font-medium">
                Deck Name
              </label>
              <Input
                id="deck-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter deck name"
                maxLength={100}
                autoFocus
                disabled={isSubmitting}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {name.trim().length === 0 && "Name is required"}
                  {name.trim().length > 0 && name.length <= 100 && !hasChanged && "No changes made"}
                  {name.trim().length > 0 && name.length <= 100 && hasChanged && "Valid name"}
                  {name.length > 100 && "Name is too long"}
                </span>
                <span>{name.length}/100</span>
              </div>
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || !hasChanged || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
