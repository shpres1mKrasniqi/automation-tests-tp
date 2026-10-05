import { expect, type Page } from '@playwright/test';
import type { ResolvedConfig } from '../config/types';

/**
 * Asserts the shop's "page not found" response (HTTP status checked by the caller).
 * Shops render either the storefront error page, or — when `testData.notFoundPage` is
 * "exception" (HD-Toner staging throws the routing exception on purpose) — the framework
 * exception page for the unmatched route.
 */
export async function expectNotFoundPage(page: Page, cfg: ResolvedConfig): Promise<void> {
  if (cfg.testData.notFoundPage === 'exception') {
    await expect(page.getByRole('heading', { name: /No route found for "GET / })).toBeVisible();
    return;
  }
  await expect(page.locator(cfg.selectors.error.body)).toBeAttached();
  await expect(page.locator(cfg.selectors.header.logo)).toBeVisible();
  await expect(page.locator(cfg.selectors.error.backToShop).first()).toBeVisible();
}
