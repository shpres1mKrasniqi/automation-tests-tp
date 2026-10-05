import { test, expect, skipUnless } from '../../src/fixtures';
import { buildCustomer } from '../../src/data/customer';

test.describe('Customer registration', () => {
  test.beforeEach(async ({ cfg, auth }) => {
    skipUnless(cfg.features.registration, 'registration');
    await auth.open();
  });

  test('new customer can register', { tag: ['@smoke', '@mobile'] }, async ({ page, cfg, auth, adminApi, requireWriteAccess }) => {
    void requireWriteAccess;
    const customer = buildCustomer(cfg);
    await auth.register(customer);

    if (cfg.features.doubleOptInRegistration) {
      await expect(page.locator(cfg.selectors.page.alertSuccess).first()).toBeVisible();
    } else {
      await expect(page).toHaveURL(new RegExp(`${cfg.routes.account}(\\?.*)?$`));
      // account sidebar is collapsed on mobile → check it is rendered, not visible
      await expect(page.locator(cfg.selectors.account.aside).first()).toBeAttached();
    }
    if (adminApi && cfg.env.cleanupTestData) await adminApi.deleteCustomerByEmail(customer.email);
  });

  test('empty form shows validation errors', { tag: '@smoke' }, async ({ page, cfg, auth }) => {
    await auth.submitRegistration();
    await expect(auth.validationErrors.first()).toBeVisible();
    // server-side validation re-renders the form on /account/register
    await expect(page).toHaveURL(/\/account\/(login|register)/);
    void cfg;
  });

  test('invalid e-mail is rejected', async ({ cfg, auth }) => {
    await auth.fillRegistration(buildCustomer(cfg, { email: 'not-an-email' }));
    await auth.submitRegistration();
    await expect(auth.registerForm.locator(`${cfg.selectors.register.email}${cfg.selectors.page.invalidField}`).or(auth.validationErrors).first()).toBeVisible();
  });

  test('too short password is rejected', async ({ cfg, auth }) => {
    await auth.fillRegistration(buildCustomer(cfg, { password: '123' }));
    await auth.submitRegistration();
    await expect(auth.registerForm.locator(`${cfg.selectors.register.password}${cfg.selectors.page.invalidField}`).or(auth.validationErrors).first()).toBeVisible();
  });

  test('already registered e-mail is rejected', async ({ page, cfg, auth, customer }) => {
    await auth.register(buildCustomer(cfg, { email: customer.email }));
    await expect(page).toHaveURL(/\/account\/(login|register)/);
    await expect(page.locator(`${cfg.selectors.page.alertDanger}, ${cfg.selectors.page.invalidFeedback}`).locator('visible=true').first()).toBeVisible();
  });

  test('invalid address opens the address check popup and blocks registration', async ({ page, cfg, auth, adminApi, requireWriteAccess }) => {
    void requireWriteAccess;
    const invalidAddress = cfg.testData.customer.invalidAddress;
    test.skip(!invalidAddress, 'No invalidAddress configured (shop without address validation)');
    const customer = buildCustomer(cfg, { address: invalidAddress! });

    await auth.register(customer, { invalidAddress: true });

    // the popup is expected here: it must be shown and the form must not have been submitted
    await expect(auth.addressCheckModal).toBeVisible();
    await expect(page).toHaveURL(/\/account\/(login|register)/);

    // taking over the shop's suggestion corrects the form (it does not submit by itself)
    await auth.acceptSuggestedAddress();
    await expect(auth.registerForm.locator(cfg.selectors.register.street)).not.toHaveValue(invalidAddress!.street);
    await auth.submitRegistration();
    await auth.expectPath(cfg.routes.account);
    if (adminApi && cfg.env.cleanupTestData) await adminApi.deleteCustomerByEmail(customer.email);
  });

  test('valid address is accepted without the address check popup', async ({ page, cfg, auth, adminApi, requireWriteAccess }) => {
    void requireWriteAccess;
    const customer = buildCustomer(cfg);
    await auth.register(customer);
    await auth.expectPath(cfg.routes.account);
    await expect(auth.addressCheckModal).toHaveCount(0);
    if (adminApi && cfg.env.cleanupTestData) await adminApi.deleteCustomerByEmail(customer.email);
  });
});
