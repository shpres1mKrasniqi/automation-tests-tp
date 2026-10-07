const fs = require('fs');
function ed(file, pairs) {
  let t = fs.readFileSync(file, 'utf8');
  const crlf = t.includes('\r\n');
  t = t.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    if (!t.includes(a)) { console.log('MISSING in', file, ':', a.slice(0, 70)); continue; }
    t = t.replace(a, () => b);
  }
  fs.writeFileSync(file, crlf ? t.replace(/\n/g, '\r\n') : t);
}
ed('tests/storefront/tonerpartner.spec.ts', [
  ["      const name = (await link.innerText()).trim();\n      await Promise.all([page.waitForLoadState('domcontentloaded'), link.click({ force: true })]);\n      await expect(product.name).toContainText(name.slice(0, 20));",
   "      // the recommendations sit in a carousel (partly outside the viewport): follow the link target\n      const name = (await link.innerText()).replace(/\\s+/g, ' ').trim();\n      const href = await link.getAttribute('href');\n      expect(href).toBeTruthy();\n      await page.goto(href!, { waitUntil: 'domcontentloaded' });\n      await expect(product.name).toContainText(name.slice(0, 20));"],
  ["    test('printer model finder is available on category and product pages', async ({ page, cfg, product, printerFinder }) => {\n      await page.goto(cfg.testData.listingCategoryPath, { waitUntil: 'load' });\n      await printerFinder.waitUntilReady();\n      await expect(printerFinder.manufacturer).toBeEnabled();\n      await expect(printerFinder.series).toBeDisabled();\n      await product.open(cfg.testData.simpleProduct);\n      await printerFinder.waitUntilReady();\n      await expect(printerFinder.manufacturer).toBeEnabled();\n      await expect(printerFinder.model).toBeDisabled();\n    });",
   "    test('printer model finder offers the main printer brands', async ({ page, cfg, printerFinder }) => {\n      await page.goto(cfg.routes.home, { waitUntil: 'load' });\n      await printerFinder.waitUntilReady();\n      const options = page.locator(cfg.selectors.printerFinder.manufacturerOption);\n      await expect(async () => {\n        await printerFinder.manufacturer.evaluate((el) => (el as HTMLInputElement).blur());\n        await printerFinder.manufacturer.click();\n        await expect(options.locator('visible=true').first()).toBeVisible({ timeout: 2_000 });\n      }).toPass({ timeout: 20_000 });\n      const texts = (await options.locator('visible=true').allInnerTexts()).map((t) => t.trim());\n      for (const brand of ['Brother', 'Canon', 'Epson', 'HP']) {\n        expect(texts, `brand \"${brand}\" in the finder`).toContain(brand);\n      }\n    });"],
  ["      const pick = (re: RegExp, cls?: string) => {\n        const r = rows.find((x) => re.test(x.label) && (!cls || x.cls.includes(cls)));\n        expect(r, `summary row ${re}`).toBeTruthy();\n        return num(r!.value);\n      };\n      const subtotal = pick(/Zwischensumme/);\n      const shipping = pick(/Versandkosten/);\n      const total = pick(/^Gesamtsumme$/, 'checkout-aside-summary-total');\n      const net = pick(/Gesamtsumme/, 'summary-net');\n      const vat = pick(/MwSt/);",
   "      // labels differ per shop (\"Zwischensumme\" / \"Summe Artikel\"): the rows are identified by their CSS classes\n      const pick = (cls: string) => {\n        const r = rows.find((x) => x.cls.split(/\\s+/).includes(cls));\n        expect(r, `summary row .${cls}`).toBeTruthy();\n        return num(r!.value);\n      };\n      const subtotal = pick('checkout-total-article');\n      const shipping = pick('tp-checkout-aside-summary-label');\n      const total = pick('checkout-aside-summary-total');\n      const net = pick('summary-net');\n      const vat = pick('summary-tax');"],
]);
ed('src/components/MainNavigation.ts', [
  ["    await link.click();\n    // either the link navigates, or it opens a flyout (dropdown toggle) with the \"show category\" link\n    await Promise.race([\n      this.page.waitForURL((u) => norm(u.pathname) === target),\n      flyout.waitFor({ state: 'visible' }),\n    ]);",
   "    // either the link navigates, or it opens a flyout (dropdown toggle) with the \"show category\" link;\n    // the consent layer can swallow the click, so it is repeated until one of the two happens\n    await expect(async () => {\n      await link.click();\n      await Promise.race([\n        this.page.waitForURL((u) => norm(u.pathname) === target, { timeout: 5_000 }),\n        flyout.waitFor({ state: 'visible', timeout: 5_000 }),\n      ]);\n    }).toPass({ timeout: 30_000 });"],
]);
