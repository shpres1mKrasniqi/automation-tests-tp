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
  ["      const dd = await header.openAccountMenu();\n      await expect(dd.locator(cfg.selectors.header.accountLoginLink).first()).toBeVisible();\n",
   "      const login = await header.guestLoginLink();\n      await Promise.all([page.waitForURL(new RegExp(cfg.routes.login)), login.click()]);\n      await expect(page.locator(cfg.selectors.login.form).first()).toBeVisible();\n"],
  ["        await navigation.rootLink(cfg.testData.mainCategories[0]).hover();\n        const flyout = page.locator('.tp-mega-menu-flyout.is-open');\n        await expect(flyout).toBeVisible();\n        const sub = flyout.locator('a').first();\n        await expect(sub).toBeVisible();\n",
   "        const root = navigation.rootLink(cfg.testData.mainCategories[0]);\n        const flyout = page.locator('.tp-mega-menu-flyout.is-open');\n        const sub = flyout.locator('a:visible').first();\n        // the consent layer can pop up and take the mouse away: hover again until the flyout stays open\n        await expect(async () => {\n          await root.hover();\n          await expect(sub).toBeVisible({ timeout: 3_000 });\n        }).toPass({ timeout: 20_000 });\n"],
  ["      const total = pick(/^Gesamtsumme$/, 'checkout-aside-summary-to');", "      const total = pick(/^Gesamtsumme$/, 'checkout-aside-summary-total');"],
  ["      const unit = await cart.lineItem(cfg.testData.simpleProduct.name).locator(cfg.selectors.cart.lineItemTotal).first().innerText();\n      expect(num(unit)).toBeCloseTo(subtotal, 2);",
   "      // a quantity discount shows the struck-through list price first: the payable amount is the last one\n      const lineText = await cart.lineItem(cfg.testData.simpleProduct.name).locator(cfg.selectors.cart.lineItemTotal).first().innerText();\n      const amounts = lineText.match(/\\d[\\d.]*,\\d{2}/g) ?? [];\n      expect(amounts.length, `no amount in \"${lineText}\"`).toBeGreaterThan(0);\n      expect(num(amounts[amounts.length - 1])).toBeCloseTo(subtotal, 2);"],
  ["selectOption({ label: a.countryLabel.split('|')[0] })", "selectOption({ label: (a.countryLabel ?? 'Deutschland').split('|')[0] })"],
]);
