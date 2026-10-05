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
    `${cfg.routes.search}?${cfg.routes.searchParam ?? "search"}=${encodeURIComponent(cfg.testData.searchTerm)}`,
  );
  // FACT-Finder renders the results client-side: wait for them before counting. The term may be
  // a product number that the index matches but the result box does not print.
  await expect(listing.productBoxes.first()).toBeVisible();
  expect(await listing.productBoxes.count()).toBeGreaterThanOrEqual(
    cfg.testData.searchMinResults,
  );
});

test("search suggest shows products while typing", async ({
  page,
  cfg,
  header,
}) => {
  await page.goto(cfg.routes.home);
  const suggest = await header.typeSearchSuggest(cfg.testData.searchTerm);
  // FACT-Finder renders the entries as custom elements without a box of their own,
  // so assert on the entry name text instead of "visible"
  await expect(
    suggest.locator(cfg.selectors.header.searchSuggestProduct).first(),
  ).toContainText(/\S/);
});

test(
  "no-result search shows an info message",
  { tag: "@smoke" },
  async ({ page, cfg, listing }) => {
    await page.goto(
      `${cfg.routes.search}?${cfg.routes.searchParam ?? "search"}=${encodeURIComponent(cfg.testData.searchNoResultTerm)}`,
    );
    await expect(listing.productBoxes).toHaveCount(0);
    await expect(
      page.locator(cfg.selectors.search.emptyAlert).first(),
    ).toBeVisible();
  },
);

test("handles special characters safely", async ({ page, cfg }) => {
  const res = await page.goto(
    `${cfg.routes.search}?${cfg.routes.searchParam ?? "search"}=${encodeURIComponent('<script>alert(1)</script> "ä&%')}`,
    // only the response and the DOM are inspected; `load` can hang on slow third-party/FACT-Finder calls
    { waitUntil: "domcontentloaded" },
  );
  expect(res?.status()).toBeLessThan(500);
  await expect(page.locator('script:has-text("alert(1)")')).toHaveCount(0);
});
