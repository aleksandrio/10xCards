import { useState } from "react";
import { toast } from "sonner";
import type { DeckDto } from "@/types";
import { useDecks } from "@/lib/hooks/useDecks";
import { SkeletonLoader } from "./SkeletonLoader";
import { EmptyState } from "./EmptyState";
import { DeckGrid } from "./DeckGrid";
import { CreateDeckButton } from "./CreateDeckButton";
import { CreateDeckModal } from "./CreateDeckModal";
import { RenameDeckModal } from "./RenameDeckModal";
import { DeleteDeckDialog } from "./DeleteDeckDialog";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "rename"; deck: DeckDto }
  | { type: "delete"; deck: DeckDto };

export function DashboardView() {
  const { decks, totalDecks, isLoading, error, createDeck, renameDeck, deleteDeck } = useDecks();
  const [modalState, setModalState] = useState<ModalState>({ type: "none" });

  const handleOpenCreateModal = () => {
    setModalState({ type: "create" });
  };

  const handleOpenRenameModal = (deck: DeckDto) => {
    setModalState({ type: "rename", deck });
  };

  const handleOpenDeleteDialog = (deck: DeckDto) => {
    setModalState({ type: "delete", deck });
  };

  const handleCloseModal = () => {
    setModalState({ type: "none" });
  };

  const handleCreateDeck = async (name: string) => {
    try {
      await createDeck(name);
      handleCloseModal();
      toast.success("Deck created successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create deck";
      toast.error(message);
      throw err;
    }
  };

  const handleRenameDeck = async (deckId: string, name: string) => {
    try {
      await renameDeck(deckId, name);
      handleCloseModal();
      toast.success("Deck renamed successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to rename deck";
      toast.error(message);
      throw err;
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await deleteDeck(deckId);
      handleCloseModal();
      toast.success("Deck deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete deck";
      toast.error(message);
      throw err;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" data-testid="dashboard-view">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">My Decks</h1>
          <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">{totalDecks}/10</span>
        </div>
        <CreateDeckButton onClick={handleOpenCreateModal} disabled={totalDecks >= 10} />
      </div>

      {/* Content */}
      {isLoading && <SkeletonLoader />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="max-w-md text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">Failed to load decks</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && decks.length === 0 && <EmptyState onCreateDeck={handleOpenCreateModal} />}

      {!isLoading && !error && decks.length > 0 && (
        <DeckGrid decks={decks} onRename={handleOpenRenameModal} onDelete={handleOpenDeleteDialog} />
      )}

      {/* Modals */}
      {modalState.type === "create" && (
        <CreateDeckModal isOpen={true} onClose={handleCloseModal} onSubmit={handleCreateDeck} />
      )}

      {modalState.type === "rename" && (
        <RenameDeckModal
          isOpen={true}
          onClose={handleCloseModal}
          onSubmit={(name) => handleRenameDeck(modalState.deck.id, name)}
          initialData={modalState.deck}
        />
      )}

      {modalState.type === "delete" && (
        <DeleteDeckDialog
          isOpen={true}
          onClose={handleCloseModal}
          onConfirm={() => handleDeleteDeck(modalState.deck.id)}
          deck={modalState.deck}
        />
      )}
    </div>
  );
}
