import { test, expect, shopConfig } from '../../src/fixtures';

/** Registered only for shops with features.wishlist = true (the TonerPartner shops have no wishlist). */
if (shopConfig.features.wishlist) test.describe('Wishlist', () => {
  test('guest can add a product to the wishlist', { tag: '@smoke' }, async ({ page, cfg, product }) => {
    await product.open(cfg.testData.simpleProduct);
    await product.wishlistButton.click();
    await expect(page.locator(cfg.selectors.header.wishlistBadge).first()).toContainText('1');
  });

  test('wishlist page shows added product and allows removal', async ({ page, cfg, product }) => {
    await product.open(cfg.testData.simpleProduct);
    await product.wishlistButton.click();
    await page.goto(cfg.routes.wishlist);
    const box = page.locator(cfg.selectors.wishlist.productBox).filter({ hasText: cfg.testData.simpleProduct.name });
    await expect(box).toBeVisible();
    await box.locator(cfg.selectors.wishlist.remove).first().click();
    await expect(box).toHaveCount(0);
  });

  test('logged-in wishlist persists after re-login', async ({ loggedInPage: page, cfg, product, auth, account, customer }) => {
    await product.open(cfg.testData.simpleProduct);
    await product.wishlistButton.click();
    await account.logout();
    await auth.open();
    await auth.loginAndExpectSuccess(customer.email, customer.password);
    await page.goto(cfg.routes.wishlist);
    await expect(page.locator(cfg.selectors.wishlist.productBox).filter({ hasText: cfg.testData.simpleProduct.name })).toBeVisible();
  });
});
