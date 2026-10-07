import { test, expect, shopConfig } from "../../src/fixtures";
import { expectNotFoundPage } from "../../src/utils/notFound";

test.describe("Product detail page", () => {
  test(
    "shows core product information",
    { tag: ["@smoke", "@mobile"] },
    async ({ product, cfg }) => {
      const p = cfg.testData.simpleProduct;
      await product.open(p);
      const s = cfg.selectors.product;
      await expect(product.name).toContainText(p.name);
      await expect(product.productNumber).toContainText(p.productNumber);
      expect(await product.priceValue()).toBeGreaterThan(0);
      await expect(product.buyButton).toBeEnabled();
      await expect(product.page.locator(s.gallery).first()).toBeVisible();
      await expect(product.page.locator(s.tax).first()).toBeVisible();
      await expect(product.page.locator(s.delivery).first()).toBeVisible();
      await expect(product.page.locator(s.description).first()).toBeAttached();
    },
  );

  test("has product structured data / canonical link", async ({
    product,
    cfg,
    page,
  }) => {
    await product.open(cfg.testData.simpleProduct);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(
      page
        .locator(
          '[itemtype*="schema.org/Product"], script[type="application/ld+json"]',
        )
        .first(),
    ).toBeAttached();
  });

  // registered only for shops with a configured variant product (the TonerPartner shops sell none)
  if (shopConfig.testData.variantProduct.productNumber !== "TODO") test(
    "variant switch updates product number and URL",
    { tag: "@smoke" },
    async ({ product, cfg, page }) => {
      const v = cfg.testData.variantProduct;
      await product.open(v);
      await expect(product.configuratorGroups).toHaveCount(
        v.optionGroups.length,
      );
      const { before, after } = await product.switchVariant(
        v.optionGroups.length - 1,
      );
      expect(after).not.toEqual(before);
      await expect(page).toHaveURL(new RegExp(after.replace(/[.]/g, "\\.")));
    },
  );

  test("breadcrumb links back to the category", async ({
    product,
    cfg,
    page,
  }) => {
    await product.open(cfg.testData.simpleProduct);
    const crumb = page.locator(`${cfg.selectors.page.breadcrumb} a`).first();
    await expect(crumb).toBeVisible();
    await Promise.all([
      page.waitForLoadState("domcontentloaded"),
      crumb.click(),
    ]);
    await expect(page.locator("body")).toHaveClass(/is-ctl-(navigation|landingpage)/);
  });

  // registered only for shops with product reviews (the TonerPartner shops have none)
  if (shopConfig.features.productReviews) test("reviews tab/teaser is present", async ({ product, cfg }) => {
    await product.open(cfg.testData.simpleProduct);
    await expect(
      product.page.locator(cfg.selectors.product.reviewTeaser).first(),
    ).toBeAttached();
  });

  test("unknown product URL returns 404", async ({ page, cfg }) => {
    const res = await page.goto("/this-product-does-not-exist-e2e/XX-000");
    expect(res?.status()).toBe(404);
    await expectNotFoundPage(page, cfg);
  });
});
