import { type Page, type Locator, expect } from "@playwright/test";
import { CreateDeckModal } from "./CreateDeckModal.js";
import { DeckGrid } from "./DeckGrid.js";

export class DashboardPage {
  readonly page: Page;
  readonly createDeckButton: Locator;
  readonly createDeckModal: CreateDeckModal;
  readonly deckGrid: DeckGrid;

  constructor(page: Page) {
    this.page = page;
    this.createDeckButton = page.getByTestId("create-deck-button");
    this.createDeckModal = new CreateDeckModal(page);
    this.deckGrid = new DeckGrid(page);
  }

  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForURL("/dashboard");

    // Wait for the main dashboard view container to be visible
    await this.page.getByTestId("dashboard-view").waitFor({ state: "visible" });

    // Wait for either the deck grid or the empty state to be visible,
    // which indicates that the initial data load is complete.
    const deckGrid = this.page.getByTestId("deck-grid");
    const emptyState = this.page.getByTestId("empty-state");
    await expect(deckGrid.or(emptyState)).toBeVisible();
  }

  async openCreateDeckModal() {
    await this.createDeckButton.waitFor({ state: "visible" });
    await this.createDeckButton.click();
    await this.createDeckModal.waitForModal();
  }
}
