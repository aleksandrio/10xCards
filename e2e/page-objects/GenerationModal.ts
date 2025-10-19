import { type Page, type Locator } from "@playwright/test";

export class GenerationModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly textInput: Locator;
  readonly generateButton: Locator;
  readonly addFlashcardsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId("generation-modal");
    this.textInput = page.getByTestId("generation-text-input");
    this.generateButton = page.getByTestId("generate-button");
    this.addFlashcardsButton = page.getByTestId("add-flashcards-button");
  }

  async waitForModal() {
    await this.modal.waitFor({ state: "visible" });
  }

  async generateFlashcards(text: string) {
    await this.textInput.fill(text);
    await this.generateButton.click();
  }

  async acceptFlashcards() {
    await this.addFlashcardsButton.click();
    await this.addFlashcardsButton.waitFor({ state: "hidden" });
  }
}
