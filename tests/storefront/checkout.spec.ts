import { test, expect, shopConfig } from '../../src/fixtures';
import { buildCustomer } from '../../src/data/customer';

test.describe('Checkout', () => {
  test('empty cart cannot proceed to checkout', { tag: '@smoke' }, async ({ page, cfg }) => {
    await page.goto(cfg.routes.checkoutConfirm);
    await expect(page).toHaveURL(new RegExp(cfg.routes.cart));
  });

  test('guest is asked to log in or register before confirm', { tag: '@smoke' }, async ({ page, cartHelper, cfg, auth }) => {
    await cartHelper.add(cfg.testData.simpleProduct);
    await page.goto(cfg.routes.checkoutConfirm);
    await expect(page).toHaveURL(new RegExp(cfg.routes.checkoutRegister));
    await expect(auth.registerForm).toBeVisible();
  });

  if (shopConfig.features.guestCheckout) test('guest checkout places an order', { tag: ['@smoke', '@mobile'] }, async ({ page, cfg, cart, cartHelper, auth, checkout, requireWriteAccess }) => {
    void requireWriteAccess;
    // cart + guest registration (address check) + order takes ~60s on staging: more than the default budget
    test.slow();

    await cartHelper.add(cfg.testData.simpleProduct);
    await cart.open();
    await cart.proceedToCheckout();
    await expect(page).toHaveURL(new RegExp(cfg.routes.checkoutRegister));

    await auth.register(buildCustomer(cfg), { guest: true });
    await checkout.expectOnConfirm();
    await expect(checkout.lineItems.filter({ hasText: cfg.testData.simpleProduct.name })).toHaveCount(1);

    await checkout.placeOrder();
    await expect(page.locator('body')).toHaveClass(/is-act-finishpage/);
    await expect(checkout.finishHeader).toBeVisible();
  });

  test('registered customer places an order and sees it in the account', { tag: '@smoke' }, async ({ loggedInPage: page, cfg, cartHelper, checkout, account }) => {
    // login + order + account order list on staging: more than the default budget when run in parallel
    test.slow();
    await cartHelper.add(cfg.testData.simpleProduct, 2);
    await checkout.openConfirm();
    await checkout.expectOnConfirm();
    await expect(page.locator(cfg.selectors.checkout.address).first()).toBeVisible();

    await checkout.placeOrder();
    await expect(checkout.finishHeader).toBeVisible();

    await account.openOrders();
    await expect(account.orders.first()).toBeVisible();
  });

  test('order cannot be placed without accepting terms', async ({ loggedInPage: page, cfg, cartHelper, checkout }) => {
    await cartHelper.add(cfg.testData.simpleProduct);
    await checkout.openConfirm();
    const tos = page.locator(cfg.selectors.checkout.tos);
    await expect(tos).toHaveCount(1);
    // the default payment method may swap the submit button for its own (e.g. PayPal)
    await checkout.ensurePaymentMethod();
    await checkout.submitButton.click();
    // Shopware rewrites the URL client-side (history API) without submitting — assert
    // we are still on the confirm page instead of matching the URL.
    await expect(page).not.toHaveURL(/\/checkout\/finish/);
    await expect(checkout.submitButton).toBeVisible();
    const s = cfg.selectors.checkout.tos;
    await expect(page.locator(`${s}:invalid, ${s}${cfg.selectors.page.invalidField}`)).toHaveCount(1);
  });

  test('confirm page lists payment and shipping methods', async ({ loggedInPage: page, cfg, cartHelper, checkout }) => {
    await cartHelper.add(cfg.testData.simpleProduct);
    await checkout.openConfirm();
    expect(await page.locator(cfg.selectors.checkout.paymentMethod).count()).toBeGreaterThan(0);
    expect(await page.locator(cfg.selectors.checkout.shippingMethod).count()).toBeGreaterThan(0);
    await expect(page.locator(`${cfg.selectors.checkout.paymentMethod}:checked`)).toHaveCount(1);
  });
});
