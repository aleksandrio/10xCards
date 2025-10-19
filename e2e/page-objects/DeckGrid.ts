import { type Page, type Locator } from "@playwright/test";

export class DeckGrid {
  readonly page: Page;
  readonly grid: Locator;

  constructor(page: Page) {
    this.page = page;
    this.grid = page.getByTestId("deck-grid");
  }

  getDeckCard(name: string): Locator {
    return this.grid.getByTestId("deck-card").filter({ hasText: name });
  }

  getDeckCardName(name: string): Locator {
    const card = this.getDeckCard(name);
    return card.getByTestId("deck-card-name");
  }
}
