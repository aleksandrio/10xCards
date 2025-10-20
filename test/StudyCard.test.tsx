import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StudyCard } from "../src/components/study/StudyCard";

describe("StudyCard component", () => {
  const defaultProps = {
    frontText: "What is the capital of France?",
    backText: "Paris",
    isFlipped: false,
    onFlip: vi.fn(),
  };

  describe("Rendering", () => {
    it("should render the front text when not flipped", () => {
      render(<StudyCard {...defaultProps} />);
      expect(screen.getByText(defaultProps.frontText)).toBeInTheDocument();
      expect(screen.getByText("Front")).toBeInTheDocument();
    });

    it("should render the back text when flipped", () => {
      render(<StudyCard {...defaultProps} isFlipped={true} />);
      expect(screen.getByText(defaultProps.backText)).toBeInTheDocument();
      expect(screen.getByText("Back")).toBeInTheDocument();
    });

    it("should have blue background for front side", () => {
      const { container } = render(<StudyCard {...defaultProps} />);
      const frontCard = container.querySelector(".bg-blue-50");
      expect(frontCard).toBeInTheDocument();
    });

    it("should have purple background for back side", () => {
      const { container } = render(<StudyCard {...defaultProps} />);
      const backCard = container.querySelector(".bg-purple-50");
      expect(backCard).toBeInTheDocument();
    });
  });

  describe("Font Size Adaptation", () => {
    it("should use text-2xl for short text (≤50 chars)", () => {
      render(<StudyCard {...defaultProps} frontText="Short text" backText="Answer" isFlipped={false} />);
      const textElement = screen.getByText("Short text");
      expect(textElement).toHaveClass("text-2xl");
    });

    it("should use text-xl for medium text (≤100 chars)", () => {
      const mediumText = "A".repeat(75);
      render(<StudyCard {...defaultProps} frontText={mediumText} backText="Answer" isFlipped={false} />);
      const textElement = screen.getByText(mediumText);
      expect(textElement).toHaveClass("text-xl");
    });

    it("should use text-lg for longer text (≤200 chars)", () => {
      const longText = "A".repeat(150);
      render(<StudyCard {...defaultProps} frontText={longText} backText="Answer" isFlipped={false} />);
      const textElement = screen.getByText(longText);
      expect(textElement).toHaveClass("text-lg");
    });

    it("should use text-base for even longer text (≤300 chars)", () => {
      const veryLongText = "A".repeat(250);
      render(<StudyCard {...defaultProps} frontText={veryLongText} backText="Answer" isFlipped={false} />);
      const textElement = screen.getByText(veryLongText);
      expect(textElement).toHaveClass("text-base");
    });

    it("should use text-sm for very long text (≤400 chars)", () => {
      const veryLongText = "A".repeat(350);
      render(<StudyCard {...defaultProps} frontText={veryLongText} backText="Answer" isFlipped={false} />);
      const textElement = screen.getByText(veryLongText);
      expect(textElement).toHaveClass("text-sm");
    });

    it("should use text-xs for extremely long text (>400 chars)", () => {
      const extremelyLongText = "A".repeat(450);
      render(<StudyCard {...defaultProps} frontText={extremelyLongText} backText="Answer" isFlipped={false} />);
      const textElement = screen.getByText(extremelyLongText);
      expect(textElement).toHaveClass("text-xs");
    });
  });

  describe("Interaction", () => {
    it("should call onFlip when card is clicked", () => {
      const onFlip = vi.fn();
      render(<StudyCard {...defaultProps} onFlip={onFlip} />);

      const card = screen.getByRole("button");
      fireEvent.click(card);

      expect(onFlip).toHaveBeenCalledTimes(1);
    });

    it("should call onFlip when Enter key is pressed", () => {
      const onFlip = vi.fn();
      render(<StudyCard {...defaultProps} onFlip={onFlip} />);

      const card = screen.getByRole("button");
      fireEvent.keyDown(card, { key: "Enter" });

      expect(onFlip).toHaveBeenCalledTimes(1);
    });

    it("should call onFlip when Space key is pressed", () => {
      const onFlip = vi.fn();
      render(<StudyCard {...defaultProps} onFlip={onFlip} />);

      const card = screen.getByRole("button");
      fireEvent.keyDown(card, { key: " " });

      expect(onFlip).toHaveBeenCalledTimes(1);
    });

    it("should not call onFlip for other keys", () => {
      const onFlip = vi.fn();
      render(<StudyCard {...defaultProps} onFlip={onFlip} />);

      const card = screen.getByRole("button");
      fireEvent.keyDown(card, { key: "a" });

      expect(onFlip).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have role button", () => {
      render(<StudyCard {...defaultProps} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should have appropriate aria-label when not flipped", () => {
      render(<StudyCard {...defaultProps} isFlipped={false} />);
      expect(screen.getByLabelText("Show back of card")).toBeInTheDocument();
    });

    it("should have appropriate aria-label when flipped", () => {
      render(<StudyCard {...defaultProps} isFlipped={true} />);
      expect(screen.getByLabelText("Show front of card")).toBeInTheDocument();
    });

    it("should be keyboard accessible with tabIndex", () => {
      render(<StudyCard {...defaultProps} />);
      const card = screen.getByRole("button");
      expect(card).toHaveAttribute("tabIndex", "0");
    });
  });
});
