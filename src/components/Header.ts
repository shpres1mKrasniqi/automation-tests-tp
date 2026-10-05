import { expect, type Locator } from "@playwright/test";
import { BasePage } from "../pages/BasePage";
import { parsePrice } from "../utils/price";

export class Header extends BasePage {
  get logo(): Locator {
    return this.$(this.s.header.logo);
  }
  get searchInput(): Locator {
    // HD-Toner renders a hidden placeholder input (#plain-search-input) before the real one
    return this.$(this.s.header.searchInput).locator("visible=true").first();
  }
  get cartButton(): Locator {
    return this.$(this.s.header.cart).first();
  }
  get accountButton(): Locator {
    return this.$(this.s.header.accountButton).first();
  }
  get wishlistButton(): Locator {
    return this.$(this.s.header.wishlist).first();
  }

  /** On mobile the search field is collapsed behind a toggle button. */
  async ensureSearchVisible(): Promise<void> {
    await this.dismissConsent();
    if (await this.searchInput.isVisible()) return;
    await this.$(this.s.header.searchToggle)
      .locator("visible=true")
      .first()
      .click();
    await expect(this.searchInput).toBeVisible();
  }

  async search(term: string): Promise<void> {
    await this.ensureSearchVisible();
    // The consent layer (Usercentrics) can pop up while we type and swallows the Enter; the page
    // fixture's locator handler accepts it on the next action, so retry the whole entry.
    await expect(async () => {
      await this.searchInput.fill(term);
      await this.searchInput.press("Enter");
      await this.page.waitForURL(/\/(search|factfinder\/result)\?/, { timeout: 8_000 });
    }).toPass({ timeout: 30_000 });
  }

  /** Types into the search field and waits for the suggest dropdown. */
  async typeSearchSuggest(term: string): Promise<Locator> {
    await this.ensureSearchVisible();
    await this.searchInput.click();
    // FACT-Finder queries its own (external) API, so there is no shop XHR to wait for:
    // the visible suggest container is the signal.
    await this.searchInput.pressSequentially(term, { delay: 40 });
    const suggest = this.$(this.s.header.searchSuggest).locator("visible=true").first();
    await expect(suggest).toBeVisible();
    return suggest;
  }

  async cartTotal(): Promise<number> {
    // textContent: the total is visually hidden on mobile (innerText would be empty)
    const text =
      (await this.$(this.s.header.cartTotal).first().textContent()) ?? "";
    const value = parsePrice(text);
    return Number.isNaN(value) ? 0 : value;
  }

  async cartBadgeCount(): Promise<number> {
    const badge = this.$(this.s.header.cartBadge).first();
    if (!(await badge.isVisible())) return 0;
    return parseInt((await badge.innerText()).trim(), 10) || 0;
  }

  /**
   * Login entry for guests. Shopware shows it inside the account dropdown, HD-Toner renders it
   * directly in the header (the account button is the login link).
   */
  async guestLoginLink(): Promise<Locator> {
    const link = this.$(this.s.header.accountLoginLink).locator("visible=true").first();
    if (await link.isVisible()) return link;
    const dd = await this.openAccountMenu();
    return dd.locator(this.s.header.accountLoginLink).first();
  }

  async openAccountMenu(): Promise<Locator> {
    await this.accountButton.click();
    const dd = this.$(this.s.header.accountDropdown).first();
    await expect(dd).toBeVisible();
    return dd;
  }

  async openCart(): Promise<void> {
    await this.waitForXhr("/checkout/offcanvas", () => this.cartButton.click());
    await expect(this.$(this.s.offcanvasCart.root)).toBeVisible();
  }
}
