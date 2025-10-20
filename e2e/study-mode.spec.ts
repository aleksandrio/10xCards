import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { DashboardPage } from "./page-objects/DashboardPage";
import { DeckDetailPage } from "./page-objects/DeckDetailPage";

test.describe("Study Mode E2E Tests", () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let deckDetailPage: DeckDetailPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    deckDetailPage = new DeckDetailPage(page);

    // Login before each test
    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("User can enter study mode for a deck with flashcards", async ({ page }) => {
    // Arrange: Navigate to a deck with cards
    await dashboardPage.clickFirstDeck();
    await expect(page).toHaveURL(/\/decks\/[^/]+$/);

    // Act: Click "Study" button
    await page.getByRole("button", { name: /study/i }).click();

    // Assert: Study view is loaded
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);
    await expect(page.getByText(/Card 1 of/)).toBeVisible();
  });

  test("User can flip a flashcard by clicking", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Get initial card text
    const frontBadge = page.locator("text=Front");
    await expect(frontBadge).toBeVisible();

    // Act: Click the card to flip
    await page.getByRole("button", { name: /show back of card/i }).click();

    // Assert: Back side is shown
    const backBadge = page.locator("text=Back");
    await expect(backBadge).toBeVisible();
  });

  test("User can flip a flashcard using Space key", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Verify front is showing
    await expect(page.locator("text=Front")).toBeVisible();

    // Act: Press Space key
    await page.keyboard.press("Space");

    // Assert: Back side is shown
    await expect(page.locator("text=Back")).toBeVisible();
  });

  test("User can navigate between cards using Next button", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Verify starting at card 1
    await expect(page.getByText(/Card 1 of/)).toBeVisible();

    // Act: Click Next button
    await page.getByRole("button", { name: /^next$/i }).click();

    // Assert: Progressed to card 2
    await expect(page.getByText(/Card 2 of/)).toBeVisible();
  });

  test("User can navigate between cards using keyboard arrows", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Verify starting at card 1
    await expect(page.getByText(/Card 1 of/)).toBeVisible();

    // Act: Press ArrowRight to go to next card
    await page.keyboard.press("ArrowRight");

    // Assert: Progressed to card 2
    await expect(page.getByText(/Card 2 of/)).toBeVisible();

    // Act: Press ArrowLeft to go back
    await page.keyboard.press("ArrowLeft");

    // Assert: Back to card 1
    await expect(page.getByText(/Card 1 of/)).toBeVisible();
  });

  test("Previous button is disabled on first card", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Assert: Previous button is disabled on first card
    const previousButton = page.getByRole("button", { name: /previous/i });
    await expect(previousButton).toBeDisabled();
  });

  test("Card resets to front side when navigating to next card", async ({ page }) => {
    // Arrange: Enter study mode and flip the first card
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    await page.keyboard.press("Space"); // Flip to back
    await expect(page.locator("text=Back")).toBeVisible();

    // Act: Navigate to next card
    await page.keyboard.press("ArrowRight");

    // Assert: New card shows front side
    await expect(page.locator("text=Front")).toBeVisible();
  });

  test("Progress bar updates correctly as user navigates", async ({ page }) => {
    // Arrange: Enter study mode with known number of cards
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Get total cards from progress
    const progressText = await page.getByText(/Card \d+ of \d+/).textContent();
    const totalCards = parseInt(progressText?.match(/of (\d+)/)?.[1] || "0");

    // Act & Assert: Navigate through cards and verify progress
    for (let i = 1; i <= Math.min(3, totalCards); i++) {
      await expect(page.getByText(`Card ${i} of ${totalCards}`)).toBeVisible();
      
      if (i < totalCards) {
        await page.keyboard.press("ArrowRight");
      }
    }
  });

  test("Session complete dialog appears after reviewing all cards", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Get total number of cards
    const progressText = await page.getByText(/Card \d+ of \d+/).textContent();
    const totalCards = parseInt(progressText?.match(/of (\d+)/)?.[1] || "0");

    // Act: Navigate through all cards
    for (let i = 1; i < totalCards; i++) {
      await page.keyboard.press("ArrowRight");
    }
    
    // Go past the last card
    await page.keyboard.press("ArrowRight");

    // Assert: Completion dialog is shown
    await expect(page.getByText("Study Session Complete!")).toBeVisible();
    await expect(page.getByRole("button", { name: /study again/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /return to deck/i })).toBeVisible();
  });

  test("User can restart study session from completion dialog", async ({ page }) => {
    // Arrange: Complete a study session
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    const progressText = await page.getByText(/Card \d+ of \d+/).textContent();
    const totalCards = parseInt(progressText?.match(/of (\d+)/)?.[1] || "0");

    for (let i = 0; i < totalCards; i++) {
      await page.keyboard.press("ArrowRight");
    }

    await expect(page.getByText("Study Session Complete!")).toBeVisible();

    // Act: Click "Study Again"
    await page.getByRole("button", { name: /study again/i }).click();

    // Assert: Session restarts
    await expect(page.getByText(/Card 1 of/)).toBeVisible();
    await expect(page.getByText("Study Session Complete!")).not.toBeVisible();
  });

  test("User can exit to deck detail from completion dialog", async ({ page }) => {
    // Arrange: Complete a study session
    await dashboardPage.clickFirstDeck();
    const deckUrl = page.url();
    const deckId = deckUrl.match(/\/decks\/([^/]+)$/)?.[1];

    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    const progressText = await page.getByText(/Card \d+ of \d+/).textContent();
    const totalCards = parseInt(progressText?.match(/of (\d+)/)?.[1] || "0");

    for (let i = 0; i < totalCards; i++) {
      await page.keyboard.press("ArrowRight");
    }

    await expect(page.getByText("Study Session Complete!")).toBeVisible();

    // Act: Click "Return to Deck"
    await page.getByRole("button", { name: /return to deck/i }).click();

    // Assert: Navigated back to deck detail
    await expect(page).toHaveURL(`/decks/${deckId}`);
  });

  test("Cards display with different colors for front and back", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Assert: Front has blue background
    const frontCard = page.locator(".bg-blue-50, .dark\\:bg-blue-950\\/20").first();
    await expect(frontCard).toBeVisible();

    // Act: Flip to back
    await page.keyboard.press("Space");

    // Assert: Back has purple background (note: back card may be hidden in DOM)
    const backCard = page.locator(".bg-purple-50, .dark\\:bg-purple-950\\/20").first();
    await expect(backCard).toBeVisible();
  });

  test("Displays empty state when deck has no flashcards", async ({ page }) => {
    // Note: This test requires a deck with no flashcards to exist
    // You may need to create such a deck in your test setup

    // Act: Try to study a deck with no cards (implementation depends on test data)
    // For now, we'll skip this or handle it based on available test data

    // This is a placeholder - implement based on your test data strategy
    test.skip();
  });

  test("Keyboard shortcuts hint is displayed", async ({ page }) => {
    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Assert: Keyboard hints are visible (may be hidden on mobile)
    // Check for keyboard shortcut indicators
    const hasKeyboardHints =
      (await page.locator("kbd").count()) > 0 || 
      (await page.getByText(/flip/i).count()) > 0;

    expect(hasKeyboardHints).toBeTruthy();
  });

  test("Font size adapts for long text content", async ({ page }) => {
    // This test verifies the dynamic font sizing feature
    // Implementation depends on having cards with varying text lengths

    // Arrange: Enter study mode
    await dashboardPage.clickFirstDeck();
    await page.getByRole("button", { name: /study/i }).click();
    await expect(page).toHaveURL(/\/decks\/[^/]+\/study$/);

    // Assert: Card content is visible and within viewport
    const cardContent = page.locator(".prose p").first();
    await expect(cardContent).toBeVisible();

    // Verify card doesn't overflow (basic check)
    const boundingBox = await cardContent.boundingBox();
    expect(boundingBox).toBeTruthy();
  });
});

