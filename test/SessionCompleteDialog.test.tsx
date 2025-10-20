import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SessionCompleteDialog } from "../src/components/study/SessionCompleteDialog";

describe("SessionCompleteDialog component", () => {
  const defaultProps = {
    isOpen: true,
    onRestart: vi.fn(),
    onExit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render dialog when isOpen is true", () => {
      render(<SessionCompleteDialog {...defaultProps} />);

      expect(screen.getByText("Study Session Complete!")).toBeInTheDocument();
      expect(
        screen.getByText(/You've reviewed all the cards in this deck/i)
      ).toBeInTheDocument();
    });

    it("should not render dialog when isOpen is false", () => {
      render(<SessionCompleteDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Study Session Complete!")).not.toBeInTheDocument();
    });

    it("should display both action buttons", () => {
      render(<SessionCompleteDialog {...defaultProps} />);

      expect(screen.getByRole("button", { name: /return to deck/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /study again/i })).toBeInTheDocument();
    });
  });

  describe("Interaction", () => {
    it("should call onExit when Return to Deck button is clicked", () => {
      const onExit = vi.fn();
      render(<SessionCompleteDialog {...defaultProps} onExit={onExit} />);

      const exitButton = screen.getByRole("button", { name: /return to deck/i });
      fireEvent.click(exitButton);

      expect(onExit).toHaveBeenCalledTimes(1);
    });

    it("should call onRestart when Study Again button is clicked", () => {
      const onRestart = vi.fn();
      render(<SessionCompleteDialog {...defaultProps} onRestart={onRestart} />);

      const restartButton = screen.getByRole("button", { name: /study again/i });
      fireEvent.click(restartButton);

      expect(onRestart).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dialog Behavior", () => {
    it("should remain open when isOpen is true", () => {
      const { rerender } = render(<SessionCompleteDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText("Study Session Complete!")).toBeInTheDocument();

      rerender(<SessionCompleteDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText("Study Session Complete!")).toBeInTheDocument();
    });

    it("should close when isOpen changes to false", () => {
      const { rerender } = render(<SessionCompleteDialog {...defaultProps} isOpen={true} />);

      expect(screen.getByText("Study Session Complete!")).toBeInTheDocument();

      rerender(<SessionCompleteDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Study Session Complete!")).not.toBeInTheDocument();
    });
  });
});

