import { expect, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AccountPage extends BasePage {
  get asideItems(): Locator {
    return this.$(this.s.account.asideItem);
  }

  async open(): Promise<void> {
    await this.goto(this.cfg.routes.account);
    await this.expectPath(this.cfg.routes.account);
  }

  async openProfile(): Promise<void> {
    await this.goto(this.cfg.routes.accountProfile);
    const form = this.$(this.s.account.profileForm);
    const toggle = this.$(this.s.account.profileEditToggle);
    if (!(await form.isVisible()) && (await toggle.isVisible())) await toggle.click();
    await expect(form).toBeVisible();
  }

  async updateName(firstName: string, lastName: string): Promise<void> {
    await this.$(this.s.account.profileFirstName).fill(firstName);
    await this.$(this.s.account.profileLastName).fill(lastName);
    await Promise.all([
      this.page.waitForLoadState('domcontentloaded'),
      this.$(this.s.account.profileSubmit).first().click(),
    ]);
  }

  async openAddresses(): Promise<void> {
    await this.goto(this.cfg.routes.accountAddresses);
    await this.expectPath(this.cfg.routes.accountAddresses);
  }

  async openOrders(): Promise<void> {
    await this.goto(this.cfg.routes.accountOrders);
    await this.expectPath(this.cfg.routes.accountOrders);
  }

  get orders(): Locator {
    return this.$(this.s.account.orderItem);
  }

  get successAlert(): Locator {
    return this.$(this.s.page.alertSuccess).first();
  }

  async logout(): Promise<void> {
    await this.goto(this.cfg.routes.logout);
  }
}
