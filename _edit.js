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
ed('tests/storefront/wishlist.spec.ts', [
  ["import { test, expect, skipUnless } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["/** Only runs when features.wishlist = true in the project profile. */\ntest.describe('Wishlist', () => {\n  test.beforeEach(({ cfg }) => skipUnless(cfg.features.wishlist, 'wishlist'));\n",
   "/** Registered only for shops with features.wishlist = true (the TonerPartner shops have no wishlist). */\nif (shopConfig.features.wishlist) test.describe('Wishlist', () => {"],
]);
ed('tests/storefront/forms.spec.ts', [
  ["import { test, expect, skipUnless } from '../../src/fixtures';",
   "import { test, expect, shopConfig } from '../../src/fixtures';\n\n/** Native Shopware contact/newsletter forms. Registered only for shops that have them; the TonerPartner shops embed third-party forms (see tonerpartner.spec.ts). */"],
  ["test.describe('Contact form', () => {\n  test.beforeEach(async ({ cfg, contact }) => {\n    skipUnless(cfg.features.contactForm, 'contactForm');\n    await contact.open();",
   "if (shopConfig.features.contactForm) test.describe('Contact form', () => {\n  test.beforeEach(async ({ contact }) => {\n    await contact.open();"],
  ["test.describe('Newsletter', () => {\n  test('newsletter form is present', async ({ page, cfg }) => {\n    skipUnless(cfg.features.newsletter, 'newsletter');\n",
   "if (shopConfig.features.newsletter) test.describe('Newsletter', () => {\n  test('newsletter form is present', async ({ page, cfg }) => {\n"],
]);
ed('tests/storefront/cookie-consent.spec.ts', [
  ["import { test, expect, skipUnless } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["test.describe('Cookie consent', () => {\n  test.use({ acceptCookies: false });\n\n  test.beforeEach(({ cfg }) => skipUnless(cfg.features.cookieBanner, 'cookieBanner'));\n",
   "/** Shopware's own cookie banner: registered only for shops that use it (the others use the consent layer below). */\nif (shopConfig.features.cookieBanner) test.describe('Cookie consent', () => {\n  test.use({ acceptCookies: false });\n"],
  ["test.describe('Consent layer (Usercentrics)', () => {\n  test.use({ autoConsent: false });\n\n  test.beforeEach(({ cfg }) => skipUnless(!!cfg.features.consentLayer, 'consentLayer'));\n",
   "if (shopConfig.features.consentLayer) test.describe('Consent layer (Usercentrics)', () => {\n  test.use({ autoConsent: false });\n"],
]);
ed('tests/storefront/product-detail.spec.ts', [
  ['import { test, expect, skipUnless } from "../../src/fixtures";', 'import { test, expect, shopConfig } from "../../src/fixtures";'],
  ['  test(\n    "variant switch updates product number and URL",\n    { tag: "@smoke" },\n    async ({ product, cfg, page }) => {\n      const v = cfg.testData.variantProduct;\n      test.skip(v.productNumber === "TODO", "No variant product configured in the project profile");\n',
   '  // registered only for shops with a configured variant product (the TonerPartner shops sell none)\n  if (shopConfig.testData.variantProduct.productNumber !== "TODO") test(\n    "variant switch updates product number and URL",\n    { tag: "@smoke" },\n    async ({ product, cfg, page }) => {\n      const v = cfg.testData.variantProduct;\n'],
  ['  test("reviews tab/teaser is present", async ({ product, cfg }) => {\n    skipUnless(cfg.features.productReviews, "productReviews");\n',
   '  // registered only for shops with product reviews (the TonerPartner shops have none)\n  if (shopConfig.features.productReviews) test("reviews tab/teaser is present", async ({ product, cfg }) => {\n'],
]);
ed('tests/storefront/listing.spec.ts', [
  ['import { test, expect } from "../../src/fixtures";', 'import { test, expect, shopConfig } from "../../src/fixtures";'],
  ['test.describe("Filters", () => {\n  test.beforeEach(async ({ listing, cfg }) => {\n    test.skip(\n      cfg.testData.expectedFilterTypes.length === 0,\n      "Shop has no standard filter panel (expectedFilterTypes is empty in the project profile)",\n    );\n',
   '// registered only for shops with the standard filter panel (the TonerPartner shops filter by printer model instead, see printer-finder.spec.ts)\nif (shopConfig.testData.expectedFilterTypes.length > 0) test.describe("Filters", () => {\n  test.beforeEach(async ({ listing, cfg }) => {\n'],
  ['    test.skip(\n      !(await listing.pagination.isVisible()),\n      "Category fits on one page — no pagination",\n    );\n',
   '    await expect(\n      listing.pagination,\n      "the configured listing category must span several pages",\n    ).toBeVisible();\n'],
]);
ed('tests/storefront/navigation.spec.ts', [
  ["import { test, expect } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["  test('flyout shows sub categories (desktop)', async ({ page, cfg, navigation }) => {\n    await page.goto(cfg.routes.home);\n    const withFlyout = page.locator(`${cfg.selectors.navigation.rootLink}.dropdown-toggle`).first();\n    test.skip((await withFlyout.count()) === 0, 'No category with flyout');\n",
   "  // Bootstrap-dropdown flyouts: registered only for shops without the TonerPartner mega menu (see tonerpartner.spec.ts)\n  if (!shopConfig.features.tonerPartner) test('flyout shows sub categories (desktop)', async ({ page, cfg, navigation }) => {\n    await page.goto(cfg.routes.home);\n    const withFlyout = page.locator(`${cfg.selectors.navigation.rootLink}.dropdown-toggle`).first();\n    await expect(withFlyout).toBeAttached();\n"],
]);
ed('tests/storefront/cart.spec.ts', [
  ["import { test, expect } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["    test.skip(idx < 0, 'No directly buyable product on listing');\n", "    expect(idx, 'the listing offers no directly buyable product').toBeGreaterThanOrEqual(0);\n"],
  ["    test.skip(!cfg.features.promotionCodes, 'promotion codes disabled');\n", ""],
  ["  test('valid promotion code reduces total', async ({ cart, cartHelper, cfg }) => {\n    const code = cfg.testData.promotionCode;\n    test.skip(!cfg.features.promotionCodes || !code, 'No promotion code configured');\n",
   "  // registered only when the profile has a valid test promotion code (staging has none; see \"cart total adds up\" in tonerpartner.spec.ts)\n  if (shopConfig.features.promotionCodes && shopConfig.testData.promotionCode) test('valid promotion code reduces total', async ({ cart, cartHelper, cfg }) => {\n    const code = cfg.testData.promotionCode;\n"],
]);
ed('tests/storefront/homepage.spec.ts', [["    test.skip(count === 0, 'No product images on homepage');\n", "    expect(count, 'no product images on the homepage').toBeGreaterThan(0);\n"]]);
ed('tests/storefront/checkout.spec.ts', [["    test.skip((await tos.count()) === 0, 'Shop has no TOS checkbox');\n", "    await expect(tos).toHaveCount(1);\n"]]);
ed('tests/storefront/registration.spec.ts', [["    test.skip(!invalidAddress, 'No invalidAddress configured (shop without address validation)');\n", "    expect(invalidAddress, 'invalidAddress must be configured for shops with address validation').toBeTruthy();\n"]]);
