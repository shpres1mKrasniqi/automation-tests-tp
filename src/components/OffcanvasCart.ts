import { expect, type Locator } from '@playwright/test';
import { BasePage } from '../pages/BasePage';

export class OffcanvasCart extends BasePage {
  get root(): Locator {
    return this.$(this.s.offcanvasCart.root).first();
  }
  get lineItems(): Locator {
    return this.root.locator(this.s.offcanvasCart.lineItem);
  }

  lineItem(name: string): Locator {
    return this.lineItems.filter({ hasText: name }).first();
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /**
   * The off-canvas content is injected after its XHR and Shopware binds its JS plugins
   * afterwards — clicking +/- before that is silently ignored.
   */
  private async waitUntilReady(name: string): Promise<void> {
    await expect(this.root).not.toHaveClass(/showing/);
    const selector = this.lineItem(name).locator('[data-quantity-selector]').first();
    await expect(selector).toBeVisible();
    await selector.evaluate((el) =>
      new Promise<void>((resolve) => {
        const check = () =>
          (window as any).PluginManager?.getPluginInstanceFromElement(el, 'QuantitySelector')
            ? resolve()
            : requestAnimationFrame(check);
        check();
      }),
    );
  }

  async increaseQuantity(name: string): Promise<void> {
    await this.waitUntilReady(name);
    const item = this.lineItem(name);
    // themes with a quantity dropdown instead of +/- buttons (HD-Toner)
    const select = item.locator(this.s.offcanvasCart.quantitySelect);
    if (await select.isVisible()) {
      const next = Number(await select.inputValue()) + 1;
      await this.waitForXhr('/checkout/offcanvas', () => select.selectOption(String(next)));
      return;
    }
    await this.waitForXhr('/checkout/offcanvas', () => item.locator(this.s.offcanvasCart.plus).click());
  }

  async remove(name: string): Promise<void> {
    await this.waitUntilReady(name);
    await this.waitForXhr('/checkout/offcanvas', () => this.lineItem(name).locator(this.s.offcanvasCart.remove).click());
  }

  async goToCart(): Promise<void> {
    await Promise.all([this.page.waitForURL(/\/checkout\/cart/), this.root.locator(this.s.offcanvasCart.cartLink).first().click()]);
  }

  async goToCheckout(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/checkout\/(confirm|register)/),
      this.root.locator(this.s.offcanvasCart.checkoutButton).first().click(),
    ]);
  }

  async close(): Promise<void> {
    await this.root.locator(this.s.offcanvasCart.close).first().click();
    await expect(this.root).toBeHidden();
  }
}
