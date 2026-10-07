import { test, expect, shopConfig } from '../../src/fixtures';

test.describe('Cart', () => {
  test('add product from detail page opens off-canvas cart', { tag: ['@smoke', '@mobile'] }, async ({ product, offcanvasCart, header, cfg }) => {
    const p = cfg.testData.simpleProduct;
    await product.open(p);
    const price = await product.priceValue();
    await product.addToCart();

    await offcanvasCart.expectOpen();
    await expect(offcanvasCart.lineItem(p.name)).toBeVisible();

    // header widget refreshes asynchronously / on next page load → verify after reload
    await product.page.reload();
    await expect.poll(() => header.cartTotal()).toBeCloseTo(price, 2);
  });

  test('add product from listing', async ({ listing, offcanvasCart, cfg }) => {
    await listing.open(cfg.testData.listingCategoryPath);
    const idx = await listing.firstBuyableIndex();
    expect(idx, 'the listing offers no directly buyable product').toBeGreaterThanOrEqual(0);
    const name = await listing.addToCartFromListing(idx);
    await offcanvasCart.expectOpen();
    await expect(offcanvasCart.lineItem(name)).toBeVisible();
  });

  test('add with quantity > 1 from detail page', async ({ product, cart, cfg }) => {
    const p = cfg.testData.simpleProduct;
    await product.open(p);
    await product.addToCart(3);
    await cart.open();
    expect(await cart.quantityOf(p.name)).toBe(3);
  });

  test('update quantity in off-canvas cart', async ({ product, offcanvasCart, cfg }) => {
    const p = cfg.testData.simpleProduct;
    await product.open(p);
    await product.addToCart();
    await offcanvasCart.increaseQuantity(p.name);
    await expect(offcanvasCart.lineItem(p.name).locator(cfg.selectors.offcanvasCart.quantityInput)).toHaveValue('2');
  });

  test('update quantity on cart page recalculates total', { tag: '@smoke' }, async ({ cart, cartHelper, cfg }) => {
    const p = cfg.testData.simpleProduct;
    await cartHelper.add(p, 1);
    await cart.open();
    const single = await cart.totalValue();
    await cart.setQuantity(p.name, 2);
    expect(await cart.quantityOf(p.name)).toBe(2);
    await expect.poll(() => cart.totalValue()).toBeGreaterThan(single);
  });

  test('remove product from cart page', { tag: '@smoke' }, async ({ cart, cartHelper, cfg }) => {
    const p = cfg.testData.simpleProduct;
    await cartHelper.add(p, 1);
    await cart.open();
    await expect(cart.lineItem(p.name)).toBeVisible();
    await cart.remove(p.name);
    await cart.expectEmpty();
  });

  test('remove product from off-canvas cart', async ({ product, offcanvasCart, cfg }) => {
    const p = cfg.testData.simpleProduct;
    await product.open(p);
    await product.addToCart();
    await offcanvasCart.remove(p.name);
    await expect(offcanvasCart.lineItems).toHaveCount(0);
  });

  test('cart persists across page navigation', async ({ page, cart, cartHelper, header, cfg }) => {
    await cartHelper.add(cfg.testData.simpleProduct, 1);
    await page.goto(cfg.testData.listingCategoryPath);
    await expect.poll(() => header.cartTotal()).toBeGreaterThan(0);
    await cart.open();
    await expect(cart.lineItems).toHaveCount(1);
  });

  test('invalid promotion code is rejected', async ({ page, cart, cartHelper, cfg }) => {
    await cartHelper.add(cfg.testData.simpleProduct, 1);
    await cart.open();
    await cart.applyPromotion('E2E-INVALID-CODE-4711');
    await expect(page.locator(`${cfg.selectors.page.alertDanger}, .alert-warning`).first()).toBeVisible();
  });

  // registered only when the profile has a valid test promotion code (staging has none; see "cart total adds up" in tonerpartner.spec.ts)
  if (shopConfig.features.promotionCodes && shopConfig.testData.promotionCode) test('valid promotion code reduces total', async ({ cart, cartHelper, cfg }) => {
    const code = cfg.testData.promotionCode;
    await cartHelper.add(cfg.testData.simpleProduct, 1);
    await cart.open();
    const before = await cart.totalValue();
    await cart.applyPromotion(code!);
    await expect.poll(() => cart.totalValue()).toBeLessThan(before);
  });
});
