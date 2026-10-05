import { expect, type Locator } from '@playwright/test';
import { BasePage, escapeRegExp } from './BasePage';

/** /checkout/confirm and /checkout/finish */
export class CheckoutPage extends BasePage {
  get lineItems(): Locator {
    return this.$(`${this.s.cart.root} ${this.s.checkout.lineItem}`);
  }
  get submitButton(): Locator {
    return this.$(this.s.checkout.submitOrder).first();
  }

  async openConfirm(): Promise<void> {
    await this.goto(this.cfg.routes.checkoutConfirm);
  }

  async expectOnConfirm(): Promise<void> {
    await this.expectPath(this.cfg.routes.checkoutConfirm);
    await expect(this.submitButton).toBeVisible();
  }

  async selectPaymentMethod(label: string): Promise<void> {
    const lbl = this.$(this.s.checkout.paymentMethodLabel).filter({ hasText: new RegExp(escapeRegExp(label), 'i') }).first();
    await Promise.all([this.page.waitForLoadState('domcontentloaded'), lbl.click()]);
  }

  async selectShippingMethod(label: string): Promise<void> {
    const lbl = this.$(this.s.checkout.shippingMethodLabel).filter({ hasText: new RegExp(escapeRegExp(label), 'i') }).first();
    await Promise.all([this.page.waitForLoadState('domcontentloaded'), lbl.click()]);
  }

  async acceptTerms(): Promise<void> {
    const tos = this.$(this.s.checkout.tos).first();
    if (!(await tos.count())) return;
    // Shopware JS can re-render the confirm page right after load and drop the
    // checked state → wait for load and retry until the checkbox stays checked.
    await this.page.waitForLoadState('load');
    await expect(async () => {
      if (!(await tos.isChecked())) await tos.check();
      await expect(tos).toBeChecked({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  }

  /** Accepts TOS, applies configured payment/shipping, places the order. Returns the order number if shown. */
  async placeOrder(): Promise<string | undefined> {
    const { paymentMethod, shippingMethod } = this.cfg.testData;
    if (shippingMethod) await this.selectShippingMethod(shippingMethod);
    if (paymentMethod) await this.selectPaymentMethod(paymentMethod);
    await this.acceptTerms();
    await Promise.all([
      this.page.waitForURL(new RegExp(escapeRegExp(this.cfg.routes.checkoutFinish)), { timeout: 45_000, waitUntil: 'domcontentloaded' }), // finish page keeps loading third-party widgets (promo popup)
      this.submitButton.click(),
    ]);
    const nr = this.$(this.s.checkout.finishOrderNumber).first();
    return (await nr.count()) ? (await nr.innerText()).replace(/\D+/g, ' ').trim().split(' ').pop() : undefined;
  }

  get finishHeader(): Locator {
    return this.$(this.s.checkout.finishHeader).first();
  }
}
