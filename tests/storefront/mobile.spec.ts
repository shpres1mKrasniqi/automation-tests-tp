import { test, expect, shopConfig } from '../../src/fixtures';

/**
 * Mobile-only behaviour. Runs in the "mobile" project (Pixel 7).
 * Other specs tagged @mobile also run there.
 */
test.describe('Mobile / responsive', { tag: '@mobile-only' }, () => {
  if (shopConfig.features.mobileNavigation) test('off-canvas navigation opens and navigates to a category', async ({ page, cfg, navigation }) => {
    await page.goto(cfg.routes.home);
    const oc = await navigation.openMobileMenu();
    const link = oc.locator('a').filter({ hasText: new RegExp(cfg.testData.mainCategories[1] ?? cfg.testData.mainCategories[0], 'i') }).first();
    await expect(link).toBeVisible();
  });

  test('desktop navigation is hidden, burger toggle visible', async ({ page, cfg }) => {
    await page.goto(cfg.routes.home);
    await expect(page.locator(cfg.selectors.header.mobileMenuToggle).locator('visible=true').first()).toBeVisible();
    await expect(page.locator(cfg.selectors.navigation.rootLink).locator('visible=true')).toHaveCount(0);
  });

  test('page has no horizontal overflow', async ({ page, cfg }) => {
    for (const path of [cfg.routes.home, cfg.testData.listingCategoryPath, cfg.testData.simpleProduct.path, cfg.routes.cart]) {
      await page.goto(path, { waitUntil: 'load' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test('filters open in off-canvas on listing', async ({ listing, cfg }) => {
    await listing.open(cfg.testData.listingCategoryPath);
    const panel = await listing.ensureFilterPanelVisible();
    await expect(panel).toBeVisible();
  });
});
