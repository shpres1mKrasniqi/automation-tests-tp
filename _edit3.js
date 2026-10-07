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
ed('tests/storefront/printer-finder.spec.ts', [
  ["import { test, expect } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["test.describe('Printer finder', () => {\n  test.beforeEach(({ cfg }) => {\n    test.skip(!cfg.testData.printerFinder, 'No printerFinder configured in the project profile');\n",
   "if (shopConfig.testData.printerFinder) test.describe('Printer finder', () => {\n  test.beforeEach(() => {\n"],
  // manufacturer page: heading level and link text differ per shop (HD-Toner: "Brother HL-L" + "88 Modelle", HQ-Patronen: h2 only, upper-case link)
  ["    await expect(page.getByRole('heading', { level: 1 })).toContainText(f.manufacturer);\n    const seriesLink = page.locator('main a', { hasText: new RegExp(`^\\\\s*${f.manufacturer} ${f.series}\\\\s*$`) }).first();",
   "    await expect(page.getByRole('heading', { name: new RegExp(f.manufacturer, 'i') }).first()).toBeVisible();\n    const seriesLink = page.locator('main a', { hasText: new RegExp(`^\\\\s*${f.manufacturer} ${f.series}(\\\\s|$)`, 'i') }).first();"],
]);
ed('tests/setup/cleanup.teardown.ts', [
  ["import { test } from '../../src/fixtures';", "import { test, shopConfig } from '../../src/fixtures';\nimport { hasAdminCredentials } from '../../src/config/loader';"],
  ["test('delete leftover test customers', async ({ cfg, adminApi }) => {\n  test.skip(!adminApi || !cfg.env.cleanupTestData, 'Cleanup disabled or no Admin API credentials');\n  const { emailPrefix, emailDomain } = cfg.testData.customer;\n  const deleted = await adminApi!.deleteTestCustomers(emailPrefix, emailDomain);",
   "// registered only when cleanup is enabled and Admin API credentials exist (without them the customers cannot be deleted)\nif (hasAdminCredentials(shopConfig) && shopConfig.env.cleanupTestData) test('delete leftover test customers', async ({ cfg, adminApi }) => {\n  const { emailPrefix, emailDomain } = cfg.testData.customer;\n  const deleted = await adminApi!.deleteTestCustomers(emailPrefix, emailDomain);"],
]);
ed('tests/storefront/login.spec.ts', [
  ["  test('cart is kept after login', async ({ page, cfg, auth, cart, cartHelper, customer }) => {\n",
   "  test('cart is kept after login', async ({ page, cfg, auth, cart, cartHelper, customer }) => {\n    // UI cart setup (no Store API) + login + cart page take ~50s on staging: too close to the default budget\n    test.slow();\n"],
]);
ed('playwright.config.ts', [
  ["  testIgnore: /setup\\/.*/,\n  grepInvert", "  testIgnore: [/setup\\/.*/, /client\\/example-.*/],\n  grepInvert"],
]);
