import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import UserMenu from "../src/components/UserMenu";

describe("UserMenu component", () => {
  it("should render the user email", () => {
    render(<UserMenu email="test@example.com" />);
    const emailButton = screen.getByText("test@example.com");
    expect(emailButton).toBeInTheDocument();
  });
});
