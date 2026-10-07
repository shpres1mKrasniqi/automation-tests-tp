import { test, expect, shopConfig } from '../../src/fixtures';

/** TonerPartner shops: private customers see prices incl. VAT, business customers excl. VAT. */
if (shopConfig.features.vatSwitch) test.describe('Private / business price switch', () => {
  test('switching to business customer shows lower net prices and is remembered', async ({ page, cfg, product }) => {
    const v = cfg.selectors.vatSwitch;
    await product.open(cfg.testData.simpleProduct);
    const trigger = page.locator(v.trigger).locator('visible=true').first();
    await expect(trigger).toContainText(/inkl\. MwSt/i);
    const gross = await product.priceValue();

    // the choice is persisted by the shop via POST, then the prices are re-rendered in place
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === 'POST' && /priceTypeStatus/.test(r.url())),
      (async () => {
        await trigger.click();
        await page.locator(v.businessOption).click();
      })(),
    ]);
    await expect(trigger).toContainText(/exkl\. MwSt/i);
    await expect.poll(() => product.priceValue()).toBeLessThan(gross);
    const net = await product.priceValue();
    // German VAT 19 %: net = gross / 1.19 (allow rounding of a cent)
    expect(Math.abs(net - gross / 1.19)).toBeLessThanOrEqual(0.02);

    expect((await page.context().cookies()).find((c) => c.name === v.cookie)?.value).toBe('true');
    await page.reload({ waitUntil: 'load' });
    await expect(trigger).toContainText(/exkl\. MwSt/i);
    expect(await product.priceValue()).toBeCloseTo(net, 2);
  });
});
