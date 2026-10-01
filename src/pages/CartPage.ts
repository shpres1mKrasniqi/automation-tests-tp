import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { parsePrice } from "../utils/price";

export class CartPage extends BasePage {
  get lineItems(): Locator {
    return this.$(`${this.s.cart.root} ${this.s.cart.lineItem}`);
  }
  get total(): Locator {
    return this.$(this.s.cart.summaryTotal).first();
  }
  get checkoutButton(): Locator {
    return this.$(this.s.cart.checkoutButton).first();
  }

  lineItem(name: string): Locator {
    return this.lineItems.filter({ hasText: name }).first();
  }

  async open(): Promise<void> {
    await this.goto(this.cfg.routes.cart);
    await this.expectController("checkout");
  }

  async totalValue(): Promise<number> {
    return parsePrice(await this.total.innerText());
  }

  private quantitySelect(name: string): Locator {
    return this.lineItem(name).getByRole("combobox", { name: "Anzahl" });
  }

  async quantityOf(name: string): Promise<number> {
    return parseInt(await this.quantitySelect(name).inputValue(), 10);
  }

  async increaseQuantity(name: string): Promise<void> {
    await this.waitForXhr("/checkout/line-item/change-quantity", () =>
      this.lineItem(name).locator(this.s.cart.plus).click(),
    );
    await this.page.waitForLoadState("domcontentloaded");
  }

  async setQuantity(name: string, qty: number): Promise<void> {
    const select = this.quantitySelect(name);
    await select.selectOption(String(qty));
    await expect(select).toHaveValue(String(qty));
    await this.page.waitForLoadState("domcontentloaded");
  }

  async remove(name: string): Promise<void> {
    await this.waitForXhr("/checkout/line-item/delete", () =>
      this.lineItem(name).locator(this.s.cart.remove).click(),
    );
    await this.page.waitForLoadState("domcontentloaded");
  }

  async applyPromotion(code: string): Promise<void> {
    await this.$(this.s.cart.promotionInput).first().fill(code);
    await this.waitForXhr("/checkout/promotion/add", () =>
      this.$(this.s.cart.promotionSubmit).first().click(),
    );
  }

  async expectEmpty(): Promise<void> {
    await expect(this.lineItems).toHaveCount(0);
  }

  async proceedToCheckout(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/checkout\/(confirm|register)/),
      this.checkoutButton.click(),
    ]);
  }
}
