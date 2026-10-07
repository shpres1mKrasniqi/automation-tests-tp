import { test as base, expect, type Page } from "@playwright/test";
import { loadConfig, hasAdminCredentials } from "../config/loader";
import type { ResolvedConfig } from "../config/types";
import { AdminApiClient } from "../api/AdminApiClient";
import { StoreApiClient } from "../api/StoreApiClient";
import { buildCustomer, type TestCustomer } from "../data/customer";
import { Header } from "../components/Header";
import { MainNavigation } from "../components/MainNavigation";
import { CookieBanner } from "../components/CookieBanner";
import { OffcanvasCart } from "../components/OffcanvasCart";
import { PrinterFinder } from "../components/PrinterFinder";
import { ListingPage } from "../pages/ListingPage";
import { ProductPage } from "../pages/ProductPage";
import { CartPage } from "../pages/CartPage";
import { AuthPage } from "../pages/AuthPage";
import { AccountPage } from "../pages/AccountPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { ContactPage } from "../pages/ContactPage";

/** Fast storefront cart setup through the storefront's own form endpoint (shares the browser session). */
export class CartHelper {
  constructor(
    private readonly page: Page,
    private readonly cfg: ResolvedConfig,
    private readonly storeApi: StoreApiClient | null,
  ) {}

  /** Adds a product by product number. Falls back to the UI (PDP) if Store API is unavailable. */
  async add(
    product = this.cfg.testData.simpleProduct,
    quantity = 1,
  ): Promise<void> {
    if (!this.storeApi) {
      const pdp = new ProductPage(this.page, this.cfg);
      await pdp.open(product);
      await pdp.addToCart(quantity);
      return;
    }
    const id = await this.storeApi.productIdByNumber(product.productNumber);
    const res = await this.page.request.post("/checkout/line-item/add", {
      form: {
        redirectTo: "frontend.cart.offcanvas",
        [`lineItems[${id}][id]`]: id,
        [`lineItems[${id}][referencedId]`]: id,
        [`lineItems[${id}][type]`]: "product",
        [`lineItems[${id}][quantity]`]: String(quantity),
        [`lineItems[${id}][stackable]`]: "1",
        [`lineItems[${id}][removable]`]: "1",
      },
    });
    expect(
      res.ok(),
      `add to cart via request failed: ${res.status()}`,
    ).toBeTruthy();
  }
}

/** The consent layer (Usercentrics) can appear late and intercept clicks: accept it whenever it shows up. */
async function autoAcceptConsent(page: Page, cfg: ResolvedConfig): Promise<void> {
  const accept = page.locator(cfg.selectors.cookie.acceptAll).first();
  await page.addLocatorHandler(accept, async () => {
    await accept.click();
  });
}

type WorkerFixtures = {
  cfg: ResolvedConfig;
  adminApi: AdminApiClient | null;
  storeApi: StoreApiClient | null;
};

type TestFixtures = {
  /** Set false via test.use({ acceptCookies: false }) to see the cookie banner. */
  acceptCookies: boolean;
  /** Set false via test.use({ autoConsent: false }) to see the consent layer (Usercentrics) instead of accepting it. */
  autoConsent: boolean;
  header: Header;
  navigation: MainNavigation;
  cookieBanner: CookieBanner;
  offcanvasCart: OffcanvasCart;
  printerFinder: PrinterFinder;
  listing: ListingPage;
  product: ProductPage;
  cart: CartPage;
  auth: AuthPage;
  account: AccountPage;
  checkout: CheckoutPage;
  contact: ContactPage;
  cartHelper: CartHelper;
  /** A fresh, registered (not logged-in) customer. Deleted afterwards if cleanup is on. */
  customer: TestCustomer;
  /** The page, logged in as `customer`. */
  loggedInPage: Page;
  /** Skips the test when ALLOW_WRITE_TESTS=false (production-safe runs). */
  requireWriteAccess: void;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // ---------- worker scoped (shared by all tests of a worker) ----------
  cfg: [async ({}, use) => use(loadConfig()), { scope: "worker" }],

  adminApi: [
    async ({ cfg }, use) => {
      if (!hasAdminCredentials(cfg)) return use(null);
      const client = await AdminApiClient.create(cfg);
      await use(client);
      await client.dispose();
    },
    { scope: "worker" },
  ],

  storeApi: [
    async ({ cfg, adminApi }, use) => {
      let key = cfg.env.accessKey;
      if (!key && adminApi)
        key = await adminApi
          .resolveAccessKey(cfg.baseURL)
          .catch(() => undefined);
      if (!key) return use(null);
      const client = await StoreApiClient.create(cfg, key);
      await use(client);
      await client.dispose();
    },
    { scope: "worker" },
  ],

  // ---------- test scoped ----------
  acceptCookies: [true, { option: true }],
  autoConsent: [true, { option: true }],

  context: async ({ context, cfg, acceptCookies }, use) => {
    if (acceptCookies && cfg.features.cookieBanner)
      await CookieBanner.preAccept(context, cfg.baseURL);
    await use(context);
  },

  page: async ({ page, cfg, autoConsent }, use) => {
    if (autoConsent) await autoAcceptConsent(page, cfg);
    await use(page);
  },

  header: async ({ page, cfg }, use) => use(new Header(page, cfg)),
  navigation: async ({ page, cfg }, use) => use(new MainNavigation(page, cfg)),
  cookieBanner: async ({ page, cfg }, use) => use(new CookieBanner(page, cfg)),
  offcanvasCart: async ({ page, cfg }, use) =>
    use(new OffcanvasCart(page, cfg)),
  printerFinder: async ({ page, cfg }, use) => use(new PrinterFinder(page, cfg)),
  listing: async ({ page, cfg }, use) => use(new ListingPage(page, cfg)),
  product: async ({ page, cfg }, use) => use(new ProductPage(page, cfg)),
  cart: async ({ page, cfg }, use) => use(new CartPage(page, cfg)),
  auth: async ({ page, cfg }, use) => use(new AuthPage(page, cfg)),
  account: async ({ page, cfg }, use) => use(new AccountPage(page, cfg)),
  checkout: async ({ page, cfg }, use) => use(new CheckoutPage(page, cfg)),
  contact: async ({ page, cfg }, use) => use(new ContactPage(page, cfg)),
  cartHelper: async ({ page, cfg, storeApi }, use) =>
    use(new CartHelper(page, cfg, storeApi)),

  requireWriteAccess: async ({ cfg }, use) => {
    test.skip(
      !cfg.env.allowWriteTests,
      "Write tests disabled (ALLOW_WRITE_TESTS=false)",
    );
    await use();
  },

  // UI registration (no Store API) with address validation takes ~30s, so it gets its own budget
  customer: [async (
    { cfg, storeApi, adminApi, browser, requireWriteAccess },
    use,
  ) => {
    void requireWriteAccess;
    const customer = buildCustomer(cfg);

    if (storeApi) {
      await storeApi.registerCustomer(customer);
    } else {
      // Fallback: register through the UI in an isolated context
      const ctx = await browser.newContext({
        baseURL: cfg.baseURL,
        httpCredentials: cfg.env.httpCredentials,
      });
      await CookieBanner.preAccept(ctx, cfg.baseURL);
      const p = await ctx.newPage();
      await autoAcceptConsent(p, cfg);
      const auth = new AuthPage(p, cfg);
      await auth.open();
      await auth.register(customer);
      await expect(p).not.toHaveURL(/\/account\/login/);
      await ctx.close();
    }
    if (cfg.features.doubleOptInRegistration) {
      test.skip(
        !adminApi,
        "Double opt-in active: Admin API credentials needed to activate test customers",
      );
      await adminApi!.activateCustomer(customer.email);
    }

    await use(customer);

    if (cfg.env.cleanupTestData && adminApi) {
      await adminApi
        .deleteCustomerByEmail(customer.email)
        .catch(() => undefined);
    }
  }, { timeout: 120_000 }],

  loggedInPage: [async ({ page, auth, customer }, use) => {
    await auth.open();
    await auth.loginAndExpectSuccess(customer.email, customer.password);
    await use(page);
  }, { timeout: 60_000 }],
});

export { expect };

/**
 * Resolved project profile at registration time: a spec registers only the tests that apply to the
 * shop (`if (shopConfig.features.x) test.describe(...)`) instead of skipping them at run time.
 */
export const shopConfig = loadConfig();
