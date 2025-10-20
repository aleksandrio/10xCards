import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ProgressBar } from "../src/components/study/ProgressBar";

describe("ProgressBar component", () => {
  describe("Rendering", () => {
    it("should display current card number and total cards", () => {
      render(<ProgressBar currentIndex={0} totalCards={10} />);

      expect(screen.getByText("Card 1 of 10")).toBeInTheDocument();
    });

    it("should display correct progress percentage", () => {
      render(<ProgressBar currentIndex={4} totalCards={10} />);

      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should show 100% on last card", () => {
      render(<ProgressBar currentIndex={9} totalCards={10} />);

      expect(screen.getByText("Card 10 of 10")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Progress Calculations", () => {
    it("should calculate progress correctly for first card", () => {
      render(<ProgressBar currentIndex={0} totalCards={5} />);

      expect(screen.getByText("20%")).toBeInTheDocument();
    });

    it("should calculate progress correctly for middle card", () => {
      render(<ProgressBar currentIndex={2} totalCards={5} />);

      expect(screen.getByText("60%")).toBeInTheDocument();
    });

    it("should round progress percentage", () => {
      render(<ProgressBar currentIndex={0} totalCards={3} />);

      // 1/3 = 33.333... should be rounded to 33%
      expect(screen.getByText("33%")).toBeInTheDocument();
    });

    it("should handle single card deck", () => {
      render(<ProgressBar currentIndex={0} totalCards={1} />);

      expect(screen.getByText("Card 1 of 1")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle large deck sizes", () => {
      render(<ProgressBar currentIndex={49} totalCards={100} />);

      expect(screen.getByText("Card 50 of 100")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("should start counting from 1 not 0", () => {
      render(<ProgressBar currentIndex={0} totalCards={5} />);

      // currentIndex is 0-based, but display should be 1-based
      expect(screen.getByText(/Card 1 of/)).toBeInTheDocument();
    });
  });
});

