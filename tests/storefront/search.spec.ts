import { test, expect } from "../../src/fixtures";

test(
  "search via header returns matching products",
  { tag: ["@smoke", "@mobile"] },
  async ({ page, cfg, header }) => {
    const { searchTerm } = cfg.testData;
    await page.goto(cfg.routes.home);
    await header.search(searchTerm);
    await expect(page).toHaveURL(
      new RegExp(`(search|query)=${encodeURIComponent(searchTerm)}`),
    );
    await expect(page.locator("main")).toContainText(searchTerm);
    await expect(
      page
        .locator("main")
        .getByRole("button", { name: "In den Warenkorb" })
        .first(),
    ).toBeVisible();
  },
);

test("results contain the search term", async ({ page, cfg, listing }) => {
  await page.goto(
    `${cfg.routes.search}?search=${encodeURIComponent(cfg.testData.searchTerm)}`,
  );
  const names = await listing.productNames();
  const hits = names.filter((n) =>
    n.toLowerCase().includes(cfg.testData.searchTerm.toLowerCase()),
  );
  expect(hits.length, `names: ${names.join(" | ")}`).toBeGreaterThan(0);
});

test("search suggest shows products while typing", async ({
  page,
  cfg,
  header,
}) => {
  await page.goto(cfg.routes.home);
  const suggest = await header.typeSearchSuggest(cfg.testData.searchTerm);
  await expect(
    suggest.locator(cfg.selectors.header.searchSuggestProduct).first(),
  ).toBeVisible();
});

test(
  "no-result search shows an info message",
  { tag: "@smoke" },
  async ({ page, cfg, listing }) => {
    await page.goto(
      `${cfg.routes.search}?search=${encodeURIComponent(cfg.testData.searchNoResultTerm)}`,
    );
    await expect(listing.productBoxes).toHaveCount(0);
    await expect(
      page.locator(cfg.selectors.search.emptyAlert).first(),
    ).toBeVisible();
  },
);

test("handles special characters safely", async ({ page, cfg }) => {
  const res = await page.goto(
    `${cfg.routes.search}?search=${encodeURIComponent('<script>alert(1)</script> "ä&%')}`,
  );
  expect(res?.status()).toBeLessThan(500);
  await expect(page.locator('script:has-text("alert(1)")')).toHaveCount(0);
});
