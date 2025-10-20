import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NavigationControls } from "../src/components/study/NavigationControls";

describe("NavigationControls component", () => {
  const defaultProps = {
    currentIndex: 1,
    totalCards: 5,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render Previous and Next buttons", () => {
      render(<NavigationControls {...defaultProps} />);

      expect(screen.getByRole("button", { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("should render keyboard shortcuts hint", () => {
      render(<NavigationControls {...defaultProps} />);

      // Check for keyboard shortcut elements
      expect(screen.getByText("Flip")).toBeInTheDocument();
      expect(screen.getAllByText("Previous").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Next").length).toBeGreaterThan(0);
    });
  });

  describe("Button States", () => {
    it("should disable Previous button on first card", () => {
      render(<NavigationControls {...defaultProps} currentIndex={0} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });

    it("should enable Previous button when not on first card", () => {
      render(<NavigationControls {...defaultProps} currentIndex={2} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      expect(previousButton).not.toBeDisabled();
    });

    it("should always enable Next button", () => {
      render(<NavigationControls {...defaultProps} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("Interaction", () => {
    it("should call onPrevious when Previous button is clicked", () => {
      const onPrevious = vi.fn();
      render(<NavigationControls {...defaultProps} currentIndex={1} onPrevious={onPrevious} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      fireEvent.click(previousButton);

      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it("should not call onPrevious when Previous button is disabled", () => {
      const onPrevious = vi.fn();
      render(<NavigationControls {...defaultProps} currentIndex={0} onPrevious={onPrevious} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      fireEvent.click(previousButton);

      expect(onPrevious).not.toHaveBeenCalled();
    });

    it("should call onNext when Next button is clicked", () => {
      const onNext = vi.fn();
      render(<NavigationControls {...defaultProps} onNext={onNext} />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle last card correctly", () => {
      render(<NavigationControls {...defaultProps} currentIndex={4} totalCards={5} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      const nextButton = screen.getByRole("button", { name: /next/i });

      expect(previousButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should handle single card deck", () => {
      render(<NavigationControls {...defaultProps} currentIndex={0} totalCards={1} />);

      const previousButton = screen.getByRole("button", { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });
  });
});
