import { Page } from '@playwright/test';

export class BasePage {
  constructor(readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async waitForPath(path: string): Promise<void> {
    await this.page.waitForURL((url) => url.pathname === path);
  }
}
