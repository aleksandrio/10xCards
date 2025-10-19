import { type Page, type Locator } from "@playwright/test";
import { GenerationModal } from "./GenerationModal.js";

export class DeckDetailPage {
  readonly page: Page;
  readonly generateFlashcardsButton: Locator;
  readonly generationModal: GenerationModal;

  constructor(page: Page) {
    this.page = page;
    this.generateFlashcardsButton = page.getByTestId("generate-flashcards-button");
    this.generationModal = new GenerationModal(page);
  }

  async goto(deckId: string) {
    await this.page.goto(`/decks/${deckId}`);
  }

  async openGenerationModal() {
    await this.generateFlashcardsButton.waitFor({ state: "visible" });
    await this.generateFlashcardsButton.click();
    await this.generationModal.waitForModal();
  }
}
