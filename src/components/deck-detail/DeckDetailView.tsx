import { useState } from "react";
import { toast } from "sonner";
import type { DeckDto, FlashcardDto, PaginatedResponse } from "../../types";
import { useDeckDetail } from "../../lib/hooks/useDeckDetail";
import { DeckHeader } from "./DeckHeader";
import { ActionToolbar } from "./ActionToolbar";
import { FlashcardList } from "./FlashcardList";
import { EmptyState } from "./EmptyState";
import { AddFlashcardModal } from "./AddFlashcardModal";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { GenerationModal } from "./GenerationModal";

interface DeckDetailViewProps {
  deckId: string;
  initialDeck: DeckDto;
  initialFlashcards: PaginatedResponse<FlashcardDto>;
}

export function DeckDetailView({ deckId, initialDeck, initialFlashcards }: DeckDetailViewProps) {
  const { viewModel, loadMoreFlashcards, createFlashcard, updateFlashcard, deleteFlashcard, refreshAll } =
    useDeckDetail(deckId, initialDeck, initialFlashcards);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStudy = () => {
    // TODO: Navigate to study view
    window.location.href = `/study/${deckId}`;
  };

  const handleGenerate = () => {
    setIsGenerationModalOpen(true);
  };

  const handleGenerationComplete = async () => {
    try {
      await refreshAll();
      toast.success("Flashcards generated and added successfully!");
    } catch {
      toast.error("Failed to refresh deck after generation");
    }
  };

  const handleAddManually = () => {
    setIsAddModalOpen(true);
  };

  const handleEditFlashcard = (flashcard: FlashcardDto) => {
    setSelectedFlashcard(flashcard);
    setIsEditModalOpen(true);
  };

  const handleDeleteFlashcard = (flashcard: FlashcardDto) => {
    setSelectedFlashcard(flashcard);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async (front: string, back: string) => {
    try {
      await createFlashcard({ front, back });
      toast.success("Flashcard added successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add flashcard");
      throw error;
    }
  };

  const handleEditSubmit = async (flashcardId: string, front: string, back: string) => {
    try {
      await updateFlashcard(flashcardId, { front, back });
      toast.success("Flashcard updated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update flashcard");
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFlashcard) return;

    try {
      setIsDeleting(true);
      await deleteFlashcard(selectedFlashcard.id);
      toast.success("Flashcard deleted successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete flashcard");
    } finally {
      setIsDeleting(false);
    }
  };

  const deckIsStudiable = viewModel.deck ? viewModel.deck.flashcardCount > 0 : false;
  const deckIsFull = viewModel.deck ? viewModel.deck.flashcardCount >= 100 : false;
  const isEmpty = viewModel.flashcards.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DeckHeader deck={viewModel.deck} />

        <div className="mt-8">
          <ActionToolbar
            onStudy={handleStudy}
            onGenerate={handleGenerate}
            onAdd={handleAddManually}
            deckIsStudiable={deckIsStudiable}
            deckIsFull={deckIsFull}
          />
        </div>

        <div className="mt-8">
          {isEmpty ? (
            <EmptyState onAddCard={handleAddManually} />
          ) : (
            <FlashcardList
              flashcards={viewModel.flashcards}
              hasMore={viewModel.pagination.hasNextPage}
              onLoadMore={loadMoreFlashcards}
              onEdit={handleEditFlashcard}
              onDelete={handleDeleteFlashcard}
            />
          )}
        </div>

        {/* Modals and Dialogs */}
        <AddFlashcardModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddSubmit}
        />

        <EditFlashcardModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedFlashcard(null);
          }}
          onSubmit={handleEditSubmit}
          flashcard={selectedFlashcard}
        />

        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedFlashcard(null);
          }}
          onConfirm={handleDeleteConfirm}
          flashcard={selectedFlashcard}
          isDeleting={isDeleting}
        />

        <GenerationModal
          isOpen={isGenerationModalOpen}
          onClose={() => setIsGenerationModalOpen(false)}
          onComplete={handleGenerationComplete}
          deckId={deckId}
        />
      </div>
    </div>
  );
}
