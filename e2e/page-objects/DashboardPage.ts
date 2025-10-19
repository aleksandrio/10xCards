import { type Page, type Locator } from "@playwright/test";
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
    await this.page.getByTestId("dashboard-view").waitFor({ state: "visible" });
  }

  async openCreateDeckModal() {
    await this.createDeckButton.waitFor({ state: "visible" });
    await this.createDeckButton.click();
    await this.createDeckModal.waitForModal();
  }
}
