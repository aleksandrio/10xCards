import { test, expect } from "@playwright/test";
import { DashboardPage } from "./page-objects/DashboardPage";
import { DeckDetailPage } from "./page-objects/DeckDetailPage";

test.beforeEach(async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
  }

  await page.request.post("/api/auth/login", {
    data: {
      email: username,
      password: password,
    },
  });
});

test.describe("Deck Creation and Flashcard Generation", () => {
  test("should allow a user to create a new deck and generate flashcards", async ({ page }) => {
    // Arrange
    const dashboardPage = new DashboardPage(page);
    const deckDetailPage = new DeckDetailPage(page);
    const newDeckName = `My New Deck ${Date.now()}`;
    const generationText =
      "Astro is a web framework for building content-driven websites like blogs, marketing, and e-commerce.";

    // Act
    await dashboardPage.goto();
    await dashboardPage.openCreateDeckModal();
    await dashboardPage.createDeckModal.createDeck(newDeckName);

    // Assert
    const newDeckCard = dashboardPage.deckGrid.getDeckCard(newDeckName);
    await newDeckCard.waitFor({ state: "visible" });
    await expect(newDeckCard).toBeVisible();

    const newDeckCardName = dashboardPage.deckGrid.getDeckCardName(newDeckName);
    await expect(newDeckCardName).toHaveText(newDeckName);

    // Act - Open deck and generate flashcards
    await newDeckCard.click();

    await expect(page).toHaveURL(/\/decks\/[a-z0-9-]+/);
    await expect(page.getByRole("heading", { name: newDeckName })).toBeVisible();

    await deckDetailPage.openGenerationModal();
    await deckDetailPage.generationModal.generateFlashcards(generationText);
    await deckDetailPage.generationModal.acceptFlashcards();

    // Assert
    const flashcardList = page.getByTestId("flashcard-list");
    await expect(flashcardList).toBeVisible();

    const flashcards = flashcardList.getByTestId("flashcard-list-item");
    const count = await flashcards.count();
    expect(count).toBeGreaterThan(0);
  });
});
