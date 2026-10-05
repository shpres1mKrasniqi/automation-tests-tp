import { expect, type Locator } from '@playwright/test';
import { BasePage, escapeRegExp } from '../pages/BasePage';

/**
 * Desktop main navigation + mobile off-canvas navigation.
 *
 * Shopware 6.7: root categories with children are Bootstrap dropdown toggles
 * (data-bs-toggle="dropdown"), so a click opens the flyout instead of navigating.
 * The flyout then contains a "go to category" link with the same href.
 */
export class MainNavigation extends BasePage {
  rootLink(name: string): Locator {
    return this.$(this.s.navigation.rootLink)
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(name)}\\s*$`, 'i') })
      .first();
  }

  async rootLinkTexts(): Promise<string[]> {
    return (await this.$(this.s.navigation.rootLink).allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }

  async openCategory(name: string): Promise<void> {
    const link = this.rootLink(name);
    const href = (await link.getAttribute('href')) ?? '';
    const target = new URL(href, this.cfg.baseURL).pathname;
    const flyout = this.$(this.s.navigation.flyout).locator('visible=true').first();
    await link.click();
    // either the link navigates, or it opens a flyout (dropdown toggle) with the "show category" link
    await Promise.race([
      this.page.waitForURL((u) => u.pathname === target),
      flyout.waitFor({ state: 'visible' }),
    ]);
    if (new URL(this.page.url()).pathname !== target) {
      const inFlyout = flyout.locator(`a[href="${href}"]`).first();
      await Promise.all([this.page.waitForURL((u) => u.pathname === target), inFlyout.click()]);
    }
  }

  /** Opens the flyout of a root category (hover, fallback click) and returns it. */
  async openFlyout(name: string): Promise<Locator> {
    const link = this.rootLink(name);
    await link.hover();
    const visible = this.$(this.s.navigation.flyout).locator('visible=true').first();
    if (!(await visible.isVisible().catch(() => false))) {
      await this.page.waitForTimeout(500);
      if (!(await visible.isVisible())) await link.click();
    }
    await expect(visible).toBeVisible();
    return visible;
  }

  // --- mobile ---
  async openMobileMenu(): Promise<Locator> {
    const toggle = this.$(this.s.header.mobileMenuToggle).locator('visible=true').first();
    await toggle.click();
    const oc = this.$(this.s.navigation.offcanvas).first();
    await expect(oc).toBeVisible();
    // Shopware lazy-loads the menu content (/widgets/menu/offcanvas)
    await expect(oc.locator('a').first()).toBeVisible();
    return oc;
  }
}
