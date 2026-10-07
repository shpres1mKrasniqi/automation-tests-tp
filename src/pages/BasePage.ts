import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";
import type { ResolvedConfig } from "../config/types";
import type { Selectors } from "../selectors/shopware67";

const consentAccepted = new WeakSet<BrowserContext>();

/**
 * Base for all page objects: config + selectors + common Shopware helpers.
 * Page objects expose *intent* (addToCart, applyFilter), specs contain assertions.
 */
export abstract class BasePage {
  protected readonly s: Selectors;

  constructor(
    readonly page: Page,
    protected readonly cfg: ResolvedConfig,
  ) {
    this.s = cfg.selectors;
  }

  $(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * The consent layer (Usercentrics) shows up a few seconds after load and then overlays the page
   * (clicks/typing get lost). Wait for it once per browser context; after it was accepted the
   * choice is stored and later navigations in the same context do not show it again.
   */
  async dismissConsent(): Promise<void> {
    if (consentAccepted.has(this.page.context())) return;
    const accept = this.page.locator(this.s.cookie.acceptAll).first();
    try {
      await accept.click({ timeout: 10_000 });
      await expect(accept).toBeHidden();
      consentAccepted.add(this.page.context());
    } catch {
      /* banner not shown (consent already stored) */
    }
  }
  /**
   * Waits for `load` so Shopware's JS plugins are bound — clicking earlier submits
   * forms natively (e.g. add-to-cart reloads the page instead of opening the off-canvas).
   */
  async goto(path: string): Promise<Response | null> {
    const res = await this.page.goto(path, { waitUntil: "load" });
    await this.dismissConsent();
    return res;
  }

  /** Clicks a link and waits for the next document's `load` (see `goto`). */
  async clickAndLoad(target: Locator): Promise<void> {
    await Promise.all([this.page.waitForEvent("load"), target.click()]);
  }

  /** Shopware sets body classes like "is-ctl-checkout is-act-cartpage". */
  async expectController(ctl: string | RegExp): Promise<void> {
    const re =
      typeof ctl === "string" ? new RegExp(`\\bis-ctl-${ctl}\\b`) : ctl;
    await expect(this.page.locator("body")).toHaveClass(re);
  }

  async expectPath(path: string | RegExp): Promise<void> {
    const re =
      typeof path === "string"
        ? new RegExp(`${escapeRegExp(path)}(\\?.*)?$`)
        : path;
    await expect(this.page).toHaveURL(re);
  }

  /**
   * Waits for the Shopware AJAX call triggered by `action` (listing, offcanvas, cart …).
   * `anyStatus`: do not require a successful status. Firefox reports a fetch() behind basic auth
   * (staging) with the 401 challenge although the shop renders the retried response; the caller
   * must then assert the resulting page state instead.
   */
  async waitForXhr(
    urlPart: string | RegExp,
    action: () => Promise<unknown>,
    opts: { anyStatus?: boolean } = {},
  ): Promise<Response> {
    const matcher = (r: Response) =>
      (typeof urlPart === "string"
        ? r.url().includes(urlPart)
        : urlPart.test(r.url())) && (opts.anyStatus || r.status() < 400);
    const [res] = await Promise.all([
      this.page.waitForResponse(matcher),
      action(),
    ]);
    return res;
  }
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
