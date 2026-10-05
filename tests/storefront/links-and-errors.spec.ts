import { test, expect } from '../../src/fixtures';
import { expectNotFoundPage } from '../../src/utils/notFound';
import { loadConfig } from '../../src/config/loader';

test.describe('Important links & redirects', () => {
  test('important pages respond without error', { tag: '@smoke' }, async ({ request, cfg }) => {
    const failures: string[] = [];
    for (const path of cfg.importantLinks) {
      const res = await request.get(path);
      if (res.status() >= 400) failures.push(`${path} → ${res.status()}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });

  for (const rule of loadConfig().redirects) {
    test(`redirect ${rule.from} → ${rule.to}`, async ({ page }) => {
      await page.goto(rule.from);
      await expect(page).toHaveURL(new RegExp(rule.to));
    });
  }

  test('header and footer links on the homepage are not broken', async ({ page, request, cfg }) => {
    await page.goto(cfg.routes.home);
    const hrefs = await page
      .locator(`${cfg.selectors.header.root} a[href], ${cfg.selectors.footer.root} a[href]`)
      // getAttribute: SVG <a> elements expose href as SVGAnimatedString, not a string
      .evaluateAll((as) => as.map((a) => new URL(a.getAttribute('href') ?? '', document.baseURI).href));
    const origin = new URL(cfg.baseURL).origin;
    const internal = [...new Set(hrefs)].filter((h) => h.startsWith(origin) && !h.includes('/account/logout')).slice(0, 60);
    const broken: string[] = [];
    for (const href of internal) {
      const res = await request.get(href, { maxRedirects: 5 });
      if (res.status() >= 400) broken.push(`${href} → ${res.status()}`);
    }
    expect(broken, broken.join('\n')).toEqual([]);
  });

  test('sitemap and robots.txt are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('<sitemapindex');
  });
});

test.describe('Error handling', () => {
  test('unknown URL shows a 404 page with a way back', { tag: ['@smoke', '@mobile'] }, async ({ page, cfg }) => {
    const res = await page.goto(`/e2e-not-existing-${Date.now()}`);
    expect(res?.status()).toBe(404);
    await expectNotFoundPage(page, cfg);
  });

  test('unknown category/deep URL returns 404, not 500', async ({ request, cfg }) => {
    const res = await request.get(`${cfg.testData.listingCategoryPath.replace(/\/$/, '')}/does-not-exist-${Date.now()}/`);
    expect(res.status()).toBe(404);
  });

  test('invalid sorting and filter parameters do not crash the page', async ({ page, cfg }) => {
    const res = await page.goto(`${cfg.testData.listingCategoryPath}?order=invalid&manufacturer=xyz`);
    expect(res?.status()).toBeLessThan(500);
  });

  test('page number beyond the last page does not crash the page', async ({ page, cfg }) => {
    // KNOWN SHOP DEFECT (reproduced on staging and production, HD-Toner): /bueroartikel/?p=99999 answers 500.
    // test.fail() keeps it visible: the run fails as soon as the shop is fixed, so remove the line then.
    test.fail(cfg.name === 'HD-Toner', 'Out-of-range ?p= returns HTTP 500 in the HD-Toner shop');
    const res = await page.goto(`${cfg.testData.listingCategoryPath}?p=99999`);
    expect(res?.status()).toBeLessThan(500);
  });

  test('POST to add-to-cart with invalid product does not 500', async ({ page, cfg }) => {
    await page.goto(cfg.routes.home);
    const res = await page.request.post('/checkout/line-item/add', {
      form: { 'lineItems[x][id]': 'x', 'lineItems[x][type]': 'product', 'lineItems[x][referencedId]': 'invalid', 'lineItems[x][quantity]': '1' },
      maxRedirects: 0,
    });
    expect(res.status()).toBeLessThan(500);
  });
});
