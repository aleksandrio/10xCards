import { type Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole("button", { name: /log in/i }).click();
  }

  async getErrorMessage() {
    return this.page.locator('[role="alert"]');
  }
}
