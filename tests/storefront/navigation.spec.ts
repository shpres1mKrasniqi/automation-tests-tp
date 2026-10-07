import { test, expect, shopConfig } from '../../src/fixtures';

test.describe('Main navigation', () => {
  test('shows the configured main categories', { tag: '@smoke' }, async ({ page, cfg, navigation }) => {
    await page.goto(cfg.routes.home);
    const texts = (await navigation.rootLinkTexts()).map((t) => t.toLowerCase());
    for (const name of cfg.testData.mainCategories) {
      expect(texts, `main navigation should contain "${name}"`).toContain(name.toLowerCase());
    }
  });

  test('every main category opens a listing page', async ({ page, cfg, navigation }) => {
    // one full homepage load per category: more categories than the default budget allows
    test.slow();
    for (const name of cfg.testData.mainCategories) {
      await page.goto(cfg.routes.home);
      await navigation.openCategory(name);
      await expect(page.locator('body')).toHaveClass(/is-ctl-(navigation|landingpage)/);
      await expect(page).not.toHaveURL(new RegExp(`${cfg.baseURL.replace(/[.]/g, '\\.')}/?$`));
      await expect(page.locator(cfg.selectors.page.main).first()).toBeVisible();
    }
  });

  // Bootstrap-dropdown flyouts: registered only for shops without the TonerPartner mega menu (see tonerpartner.spec.ts)
  if (!shopConfig.features.tonerPartner) test('flyout shows sub categories (desktop)', async ({ page, cfg, navigation }) => {
    await page.goto(cfg.routes.home);
    const withFlyout = page.locator(`${cfg.selectors.navigation.rootLink}.dropdown-toggle`).first();
    await expect(withFlyout).toBeAttached();
    const name = (await withFlyout.innerText()).trim();
    const flyout = await navigation.openFlyout(name);
    const sub = flyout.locator(cfg.selectors.navigation.flyoutLink).first();
    await expect(sub).toBeVisible();
    await Promise.all([page.waitForLoadState('domcontentloaded'), sub.click()]);
    await expect(page.locator(cfg.selectors.page.breadcrumb).first()).toBeVisible();
  });

  test('category page shows breadcrumb', async ({ page, cfg }) => {
    await page.goto(cfg.testData.breadcrumbPagePath ?? cfg.testData.listingCategoryPath);
    await expect(page.locator(cfg.selectors.page.breadcrumb).first()).toBeVisible();
  });
});
