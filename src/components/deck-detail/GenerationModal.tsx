import { useState, useReducer } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SkeletonLoader } from "./SkeletonLoader";
import type { SuggestedFlashcard } from "@/types";

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  deckId: string;
}

type GenerationStep = "input" | "loading" | "review" | "saving" | "error";

interface GenerationState {
  step: GenerationStep;
  inputText: string;
  generationId: string | null;
  suggestedFlashcards: SuggestedFlashcard[];
  error: string | null;
  editingIndex: number | null;
}

type GenerationAction =
  | { type: "SET_INPUT"; payload: string }
  | { type: "START_GENERATION" }
  | { type: "GENERATION_SUCCESS"; payload: { generationId: string; flashcards: SuggestedFlashcard[] } }
  | { type: "GENERATION_ERROR"; payload: string }
  | { type: "DELETE_FLASHCARD"; payload: number }
  | { type: "START_EDITING"; payload: number }
  | { type: "UPDATE_FLASHCARD"; payload: { index: number; flashcard: SuggestedFlashcard } }
  | { type: "CANCEL_EDITING" }
  | { type: "START_SAVING" }
  | { type: "RESET" };

function generationReducer(state: GenerationState, action: GenerationAction): GenerationState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, inputText: action.payload };
    case "START_GENERATION":
      return { ...state, step: "loading", error: null };
    case "GENERATION_SUCCESS":
      return {
        ...state,
        step: "review",
        generationId: action.payload.generationId,
        suggestedFlashcards: action.payload.flashcards,
      };
    case "GENERATION_ERROR":
      return { ...state, step: "error", error: action.payload };
    case "DELETE_FLASHCARD":
      return {
        ...state,
        suggestedFlashcards: state.suggestedFlashcards.filter((_, i) => i !== action.payload),
        editingIndex: state.editingIndex === action.payload ? null : state.editingIndex,
      };
    case "START_EDITING":
      return { ...state, editingIndex: action.payload };
    case "UPDATE_FLASHCARD":
      return {
        ...state,
        suggestedFlashcards: state.suggestedFlashcards.map((fc, i) =>
          i === action.payload.index ? action.payload.flashcard : fc
        ),
        editingIndex: null,
      };
    case "CANCEL_EDITING":
      return { ...state, editingIndex: null };
    case "START_SAVING":
      return { ...state, step: "saving" };
    case "RESET":
      return {
        step: "input",
        inputText: "",
        generationId: null,
        suggestedFlashcards: [],
        error: null,
        editingIndex: null,
      };
    default:
      return state;
  }
}

const initialState: GenerationState = {
  step: "input",
  inputText: "",
  generationId: null,
  suggestedFlashcards: [],
  error: null,
  editingIndex: null,
};

export function GenerationModal({ isOpen, onClose, onComplete, deckId }: GenerationModalProps) {
  const [state, dispatch] = useReducer(generationReducer, initialState);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  const handleClose = () => {
    dispatch({ type: "RESET" });
    setSaveError(null);
    onClose();
  };

  const handleGenerate = async () => {
    if (!state.inputText.trim() || state.inputText.length > 5000) {
      return;
    }

    dispatch({ type: "START_GENERATION" });

    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deckId,
          text: state.inputText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate flashcards");
      }

      const data = await response.json();
      dispatch({
        type: "GENERATION_SUCCESS",
        payload: {
          generationId: data.generationId,
          flashcards: data.suggestedFlashcards,
        },
      });
    } catch (error) {
      dispatch({
        type: "GENERATION_ERROR",
        payload: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    }
  };

  const handleSave = async () => {
    if (!state.generationId || state.suggestedFlashcards.length === 0) {
      return;
    }

    dispatch({ type: "START_SAVING" });
    setSaveError(null);

    try {
      const response = await fetch(`/api/decks/${deckId}/flashcards/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generationId: state.generationId,
          flashcards: state.suggestedFlashcards,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save flashcards");
      }

      // Success - close modal and notify parent
      handleClose();
      onComplete();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save flashcards");
      dispatch({ type: "GENERATION_ERROR", payload: error instanceof Error ? error.message : "Failed to save" });
    }
  };

  const handleStartEdit = (index: number) => {
    const flashcard = state.suggestedFlashcards[index];
    setEditFront(flashcard.front);
    setEditBack(flashcard.back);
    dispatch({ type: "START_EDITING", payload: index });
  };

  const handleSaveEdit = () => {
    if (state.editingIndex === null || !editFront.trim() || !editBack.trim()) {
      return;
    }

    dispatch({
      type: "UPDATE_FLASHCARD",
      payload: {
        index: state.editingIndex,
        flashcard: { front: editFront, back: editBack },
      },
    });
    setEditFront("");
    setEditBack("");
  };

  const handleCancelEdit = () => {
    dispatch({ type: "CANCEL_EDITING" });
    setEditFront("");
    setEditBack("");
  };

  const handleDelete = (index: number) => {
    dispatch({ type: "DELETE_FLASHCARD", payload: index });
  };

  const handleRetry = () => {
    dispatch({ type: "RESET" });
    setSaveError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {/* Step 1: Input */}
        {state.step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>Generate Flashcards with AI</DialogTitle>
              <DialogDescription>
                Paste your study material below, and our AI will generate flashcards for you.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="generation-text" className="text-sm font-medium">
                  Study Material <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="generation-text"
                  value={state.inputText}
                  onChange={(e) => dispatch({ type: "SET_INPUT", payload: e.target.value })}
                  placeholder="Paste your notes, textbook excerpts, or any study material here..."
                  maxLength={5000}
                  rows={10}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
                  <p className="text-xs text-muted-foreground">{state.inputText.length}/5000 characters</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={state.inputText.trim().length < 10 || state.inputText.length > 5000}
              >
                Generate Flashcards
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Loading */}
        {state.step === "loading" && (
          <>
            <DialogHeader>
              <DialogTitle>Generating Flashcards...</DialogTitle>
              <DialogDescription>Our AI is analyzing your content. This may take a few moments.</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <SkeletonLoader />
            </div>
          </>
        )}

        {/* Step 3: Review */}
        {state.step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle>Review Generated Flashcards</DialogTitle>
              <DialogDescription>
                Review and edit the generated flashcards. You can modify or delete any cards before adding them to your
                deck.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm font-medium">
                {state.suggestedFlashcards.length} {state.suggestedFlashcards.length === 1 ? "card" : "cards"} generated
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {state.suggestedFlashcards.map((flashcard, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-card">
                    {state.editingIndex === index ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label htmlFor={`edit-front-${index}`} className="text-xs font-medium text-muted-foreground">
                            Front
                          </label>
                          <Input
                            id={`edit-front-${index}`}
                            value={editFront}
                            onChange={(e) => setEditFront(e.target.value)}
                            placeholder="Question or prompt"
                            maxLength={200}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`edit-back-${index}`} className="text-xs font-medium text-muted-foreground">
                            Back
                          </label>
                          <textarea
                            id={`edit-back-${index}`}
                            value={editBack}
                            onChange={(e) => setEditBack(e.target.value)}
                            placeholder="Answer or explanation"
                            maxLength={500}
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editFront.trim() || !editBack.trim()}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Front</div>
                            <div className="text-sm">{flashcard.front}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Back</div>
                            <div className="text-sm">{flashcard.back}</div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(index)}
                            disabled={state.editingIndex !== null}
                            aria-label="Edit flashcard"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(index)}
                            disabled={state.editingIndex !== null}
                            aria-label="Delete flashcard"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {state.suggestedFlashcards.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No flashcards to add. All cards have been deleted.</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={state.suggestedFlashcards.length === 0}>
                Add {state.suggestedFlashcards.length} {state.suggestedFlashcards.length === 1 ? "Card" : "Cards"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 4: Saving */}
        {state.step === "saving" && (
          <>
            <DialogHeader>
              <DialogTitle>Saving Flashcards...</DialogTitle>
              <DialogDescription>Adding your selected flashcards to the deck.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-muted-foreground">Saving to your deck...</p>
            </div>
          </>
        )}

        {/* Step 5: Error */}
        {state.step === "error" && (
          <>
            <DialogHeader>
              <DialogTitle>Generation Failed</DialogTitle>
              <DialogDescription>We encountered an error while generating your flashcards.</DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm text-destructive font-medium mb-2">Error Details:</p>
                <p className="text-sm text-destructive/80">
                  {state.error || saveError || "An unexpected error occurred"}
                </p>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Please try again. If the problem persists, try with a different text or contact support.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button type="button" onClick={handleRetry}>
                Try Again
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
