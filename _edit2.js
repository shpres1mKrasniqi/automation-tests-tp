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
ed('tests/storefront/checkout.spec.ts', [
  ["import { test, expect, skipUnless } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["  test('guest checkout places an order', { tag: ['@smoke', '@mobile'] }, async ({ page, cfg, cart, cartHelper, auth, checkout, requireWriteAccess }) => {\n    void requireWriteAccess;\n    skipUnless(cfg.features.guestCheckout, 'guestCheckout');\n",
   "  if (shopConfig.features.guestCheckout) test('guest checkout places an order', { tag: ['@smoke', '@mobile'] }, async ({ page, cfg, cart, cartHelper, auth, checkout, requireWriteAccess }) => {\n    void requireWriteAccess;\n"],
]);
ed('tests/storefront/mobile.spec.ts', [
  ["import { test, expect, skipUnless } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["  test('off-canvas navigation opens and navigates to a category', async ({ page, cfg, navigation }) => {\n    skipUnless(cfg.features.mobileNavigation, 'mobileNavigation');\n",
   "  if (shopConfig.features.mobileNavigation) test('off-canvas navigation opens and navigates to a category', async ({ page, cfg, navigation }) => {\n"],
]);
ed('tests/storefront/registration.spec.ts', [
  ["import { test, expect, skipUnless } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["test.describe('Customer registration', () => {\n  test.beforeEach(async ({ cfg, auth }) => {\n    skipUnless(cfg.features.registration, 'registration');\n",
   "if (shopConfig.features.registration) test.describe('Customer registration', () => {\n  test.beforeEach(async ({ auth }) => {\n"],
]);
ed('tests/storefront/vat-switch.spec.ts', [
  ["import { test, expect, skipUnless } from '../../src/fixtures';", "import { test, expect, shopConfig } from '../../src/fixtures';"],
  ["test.describe('Private / business price switch', () => {\n  test.beforeEach(({ cfg }) => skipUnless(!!cfg.features.vatSwitch, 'vatSwitch'));\n",
   "if (shopConfig.features.vatSwitch) test.describe('Private / business price switch', () => {"],
]);
// product-detail: import
ed('tests/storefront/product-detail.spec.ts', [
  ['import { test, expect, skipUnless } from "../../src/fixtures";', 'import { test, expect, shopConfig } from "../../src/fixtures";'],
]);
