import { test, expect, shopConfig } from '../../src/fixtures';

/**
 * Functionality of the TonerPartner shops (HD-Toner, HQ-Patronen, Tintencenter) that replaces the
 * generic tests for features these shops do not have: native contact/newsletter forms, wishlist,
 * product reviews, variant products, standard filter panel, a valid promotion code and the
 * Bootstrap dropdown flyouts. Registered when `features.tonerPartner` is set in the project profile.
 */
if (shopConfig.features.tonerPartner) {
  test.describe('Embedded service forms (third party iframes)', () => {
    test('contact page embeds the contact form with its topics', async ({ page, cfg }) => {
      await page.goto(cfg.routes.contactPage!, { waitUntil: 'load' });
      const frame = page.locator('main iframe[src*="formcrafts"]');
      await expect(frame).toBeVisible();
      const form = page.frameLocator('main iframe[src*="formcrafts"]');
      await expect(form.getByText('Kundenservice')).toBeVisible({ timeout: 30_000 });
      // the form first asks for the topic of the request
      await expect(form.locator('input[type="checkbox"]')).toHaveCount(6);
      for (const topic of ['Bestellung & Beratung', 'Lieferung', 'Rechnung & Zahlung', 'Kundenkonto', 'Beanstandung', 'Widerruf']) {
        await expect(form.getByText(topic, { exact: true }).first(), `topic "${topic}"`).toBeVisible();
      }
    });

    test('newsletter page embeds the sign-up form and rejects an invalid e-mail address', async ({ page, cfg }) => {
      await page.goto(cfg.testData.newsletterPath!, { waitUntil: 'load' });
      const form = page.frameLocator('main iframe[src*="salesmanago"]');
      const email = form.locator('input[type="email"]');
      await expect(email).toBeVisible({ timeout: 30_000 });
      await expect(form.getByRole('button', { name: /jetzt anmelden/i })).toBeVisible();
      await expect(form.locator('input[type="radio"]')).toHaveCount(2); // Firmenkunde / Privatkunde

      // nothing is sent to the third party: the browser blocks the submit of an invalid address
      await email.fill('not-an-email');
      await form.getByRole('button', { name: /jetzt anmelden/i }).click();
      await expect(email).toHaveJSProperty('validity.valid', false);
      await expect(form.getByText(/vielen dank|erfolgreich/i)).toHaveCount(0);
    });
  });

  test.describe('Product detail page content', () => {
    test('product detail tabs switch between details, description and product safety', async ({ product, cfg, page }) => {
      await product.open(cfg.testData.simpleProduct);
      const tabs = page.getByRole('tab');
      for (const name of ['Produktdetails', 'Beschreibung', 'Produktsicherheit']) {
        const tab = tabs.filter({ hasText: name }).first();
        await expect(tab, `tab "${name}"`).toBeVisible();
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        const panelId = await tab.getAttribute('aria-controls');
        expect(panelId, `tab "${name}" must control a panel`).toBeTruthy();
        await expect(page.locator(`#${panelId}`)).toBeVisible();
      }
    });

    test('product detail page recommends matching products that open their own detail page', async ({ product, cfg, page }) => {
      await product.open(cfg.testData.simpleProduct);
      const heading = page.getByRole('heading', { level: 2, name: /^passende Produkte/i });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible();
      const boxes = page.locator(cfg.selectors.listing.productBox).filter({ has: page.locator(cfg.selectors.listing.productName) });
      await expect(boxes.first()).toBeAttached();
      const link = boxes.first().locator(`${cfg.selectors.listing.productName} a, a${cfg.selectors.listing.productName}`).first();
      // the recommendations sit in a carousel (partly outside the viewport): follow the link target
      const name = (await link.innerText()).replace(/\s+/g, ' ').trim();
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      await page.goto(href!, { waitUntil: 'domcontentloaded' });
      await expect(product.name).toContainText(name.slice(0, 20));
    });

    test('quantity can be raised on the product page and is added to the cart', async ({ product, cart, cfg }) => {
      const p = cfg.testData.simpleProduct;
      await product.open(p);
      await product.addToCart(2);
      await cart.open();
      expect(await cart.quantityOf(p.name)).toBe(2);
    });
  });

  test.describe('Header and navigation', () => {
    test('logo returns to the start page and the account icon leads a guest to the login', async ({ page, cfg, header }) => {
      await page.goto(cfg.testData.listingCategoryPath, { waitUntil: 'load' });
      await Promise.all([page.waitForURL((u) => u.pathname === '/', { waitUntil: 'load' }), header.logo.click()]);
      await expect(page.locator('body')).toHaveClass(/is-ctl-navigation|is-ctl-landingpage|is-act-home/);
      const login = await header.guestLoginLink();
      await Promise.all([page.waitForURL(new RegExp(cfg.routes.login)), login.click()]);
      await expect(page.locator(cfg.selectors.login.form).first()).toBeVisible();
    });

    test('printer model finder offers the main printer brands', async ({ page, cfg, printerFinder }) => {
      await page.goto(cfg.routes.home, { waitUntil: 'load' });
      await printerFinder.waitUntilReady();
      const options = page.locator(cfg.selectors.printerFinder.manufacturerOption);
      await expect(async () => {
        await printerFinder.manufacturer.evaluate((el) => (el as HTMLInputElement).blur());
        await printerFinder.manufacturer.click();
        await expect(options.locator('visible=true').first()).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 20_000 });
      const texts = (await options.locator('visible=true').allInnerTexts()).map((t) => t.trim());
      for (const brand of ['Brother', 'Canon', 'Epson', 'HP']) {
        expect(texts, `brand "${brand}" in the finder`).toContain(brand);
      }
    });

    if (shopConfig.features.megaMenuFlyout) {
      test('hovering a main category opens the mega menu with sub categories', async ({ page, cfg, navigation }) => {
        await page.goto(cfg.routes.home, { waitUntil: 'load' });
        await navigation.dismissConsent();
        const root = navigation.rootLink(cfg.testData.mainCategories[0]);
        const flyout = page.locator('.tp-mega-menu-flyout.is-open');
        const sub = flyout.locator('a:visible').first();
        // the flyout closes when the mouse leaves or the consent layer takes it away: hover and click together, retried
        let href: string | null = null;
        await expect(async () => {
          await root.hover();
          await expect(sub).toBeVisible({ timeout: 3_000 });
          href = await sub.getAttribute('href');
          await sub.click({ timeout: 3_000 });
        }).toPass({ timeout: 30_000 });
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(new RegExp(`${new URL(href!, cfg.baseURL).pathname.replace(/\/$/, '')}`, 'i'));
        await expect(page.locator(cfg.selectors.page.breadcrumb).first()).toBeVisible();
      });
    }
  });

  test.describe('Cart arithmetic', () => {
    test('cart total adds up: subtotal + shipping = total and net + VAT = total', async ({ page, cart, cartHelper, cfg }) => {
      await cartHelper.add(cfg.testData.simpleProduct, 2);
      await cart.open();
      const rows = await page.locator('.checkout-aside-summary-label').evaluateAll((labels) =>
        labels.map((l) => ({
          label: (l.textContent ?? '').replace(/\s+/g, ' ').trim(),
          cls: l.className,
          value: (l.nextElementSibling?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        })),
      );
      const num = (s: string) => parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.'));
      // labels differ per shop ("Zwischensumme" / "Summe Artikel"): the rows are identified by their CSS classes
      const pick = (cls: string) => {
        const r = rows.find((x) => x.cls.split(/\s+/).includes(cls));
        expect(r, `summary row .${cls}`).toBeTruthy();
        return num(r!.value);
      };
      const subtotal = pick('checkout-total-article');
      const shipping = pick('tp-checkout-aside-summary-label');
      const total = pick('checkout-aside-summary-total');
      const net = pick('summary-net');
      const vat = pick('summary-tax');
      expect(subtotal + shipping).toBeCloseTo(total, 2);
      expect(net + vat).toBeCloseTo(total, 2);
      // a quantity discount shows the struck-through list price first: the payable amount is the last one
      const lineText = await cart.lineItem(cfg.testData.simpleProduct.name).locator(cfg.selectors.cart.lineItemTotal).first().innerText();
      const amounts = lineText.match(/\d[\d.]*,\d{2}/g) ?? [];
      expect(amounts.length, `no amount in "${lineText}"`).toBeGreaterThan(0);
      expect(num(amounts[amounts.length - 1])).toBeCloseTo(subtotal, 2);
    });
  });

  test.describe('Customer address book', () => {
    test('a logged-in customer can add a second address that is then listed', async ({ loggedInPage: page, cfg, account }) => {
      test.slow();
      const a = cfg.testData.customer.address;
      await account.openAddresses();
      await Promise.all([
        page.waitForURL(/\/account\/address\/create/),
        page.locator(cfg.selectors.account.addAddressButton).first().click(),
      ]);
      const form = page.locator('form[action*="/account/address/create"]').first();
      await expect(form).toBeVisible();
      await form.locator('select[name="address[salutationId]"]').selectOption({ index: cfg.testData.customer.salutationIndex });
      await form.locator('input[name="address[firstName]"]').fill('Second');
      await form.locator('input[name="address[lastName]"]').fill('Address');
      await form.locator('input[name="address[street]"]').fill(a.street);
      await form.locator('input[name="address[zipcode]"]').fill(a.zipcode);
      await form.locator('input[name="address[city]"]').fill(a.city);
      await form.locator('select[name="address[countryId]"]').selectOption({ label: (a.countryLabel ?? 'Deutschland').split('|')[0] });
      await form.locator('button[type="submit"]').first().click();
      await expect(page).toHaveURL(/\/account\/address(?!\/create)/);
      await expect(page.locator(cfg.selectors.account.addressCard).filter({ hasText: 'Second Address' }).first()).toBeVisible();
    });
  });
}
