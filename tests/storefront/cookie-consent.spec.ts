import { test, expect, shopConfig } from '../../src/fixtures';

/** Shopware's own cookie banner: registered only for shops that use it (the others use the consent layer below). */
if (shopConfig.features.cookieBanner) test.describe('Cookie consent', () => {
  test.use({ acceptCookies: false });

  test('banner is shown to new visitors and remembered after choice', { tag: ['@smoke', '@mobile'] }, async ({ page, cfg, cookieBanner, context }) => {
    await page.goto(cfg.routes.home);
    await expect(cookieBanner.banner).toBeVisible();

    await cookieBanner.acceptOnlyNecessary();
    await expect(cookieBanner.banner).toBeHidden();

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'cookie-preference')?.value).toBe('1');

    await page.reload();
    await expect(cookieBanner.banner).toBeHidden();
  });
});

/**
 * Shops with a third-party consent layer (Usercentrics) instead of Shopware's cookie banner.
 * The other specs accept it automatically (page fixture); here it is left alone on purpose.
 */
if (shopConfig.features.consentLayer) test.describe('Consent layer (Usercentrics)', () => {
  test.use({ autoConsent: false });

  test('is shown to new visitors, can be declined and is remembered', { tag: '@smoke' }, async ({ page, cfg }) => {
    const c = cfg.selectors.cookie;
    await page.goto(cfg.routes.home);
    // #usercentrics-cmp-ui is a zero-size shadow host: its buttons are the visible signal
    const accept = page.locator(c.acceptAll).first();
    const decline = page.locator(c.onlyNecessary).first();
    await expect(accept).toBeVisible({ timeout: 20_000 });
    await expect(decline).toBeVisible();

    await decline.click();
    await expect(accept).toBeHidden();

    // the decision is stored: neither a reload nor another page brings the layer back
    await page.reload({ waitUntil: 'load' });
    await page.goto(cfg.testData.listingCategoryPath, { waitUntil: 'load' });
    // give the layer the time it needs to show up on a fresh visit before asserting its absence
    await expect(page.locator('footer').first()).toBeVisible();
    await expect(accept).toBeHidden();
  });

  test('accepting everything closes the layer', async ({ page, cfg }) => {
    const c = cfg.selectors.cookie;
    await page.goto(cfg.routes.home);
    const accept = page.locator(c.acceptAll).first();
    await accept.click({ timeout: 20_000 });
    await expect(accept).toBeHidden();
  });
});
