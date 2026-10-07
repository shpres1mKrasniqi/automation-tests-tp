import { test, expect, shopConfig } from '../../src/fixtures';

/** Native Shopware contact/newsletter forms. Registered only for shops that have them; the TonerPartner shops embed third-party forms (see tonerpartner.spec.ts). */

if (shopConfig.features.contactForm) test.describe('Contact form', () => {
  test.beforeEach(async ({ contact }) => {
    await contact.open();
  });

  test('empty submit shows validation errors', { tag: '@smoke' }, async ({ contact }) => {
    await contact.submit();
    // Shopware shows either inline field errors or a server-side alert list
    await expect(contact.validationErrors.first()).toBeVisible();
  });

  test('invalid e-mail is flagged', async ({ contact, cfg }) => {
    await contact.fill({ email: 'invalid@', firstName: 'E2E', lastName: 'Test' });
    await contact.submit();
    await expect(
      contact.form.locator(`${cfg.selectors.contact.email}${cfg.selectors.page.invalidField}`).or(contact.validationErrors).first(),
    ).toBeVisible();
  });

  test('valid submission shows a confirmation', async ({ page, cfg, contact, requireWriteAccess }) => {
    void requireWriteAccess;
    const c = cfg.testData.customer;
    await contact.fill({
      salutationIndex: c.salutationIndex,
      firstName: c.firstName,
      lastName: c.lastName,
      email: `${c.emailPrefix}.contact.${Date.now()}@${c.emailDomain}`,
      phone: '0123456789',
      subject: 'E2E test – please ignore',
      comment: 'Automated Playwright test message. Please ignore.',
    });
    await Promise.all([page.waitForResponse(/\/form\/contact/), contact.submit()]);
    await expect(page.locator(cfg.selectors.contact.success).first()).toBeVisible();
  });
});

if (shopConfig.features.newsletter) test.describe('Newsletter', () => {
  test('newsletter form is present', async ({ page, cfg }) => {
    await page.goto(cfg.routes.home);
    await expect(page.locator('form[action*="newsletter"]').first()).toBeAttached();
  });
});
