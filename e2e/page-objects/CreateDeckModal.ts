import { type Page, type Locator } from "@playwright/test";

export class CreateDeckModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly deckNameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId("create-deck-modal");
    this.deckNameInput = page.getByTestId("deck-name-input");
    this.submitButton = page.getByTestId("create-deck-submit-button");
  }

  async waitForModal() {
    await this.modal.waitFor({ state: "visible" });
  }

  async createDeck(name: string) {
    await this.deckNameInput.fill(name);
    await this.submitButton.click();
  }
}
