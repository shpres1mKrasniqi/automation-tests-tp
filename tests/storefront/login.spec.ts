import { test, expect } from '../../src/fixtures';

test.describe('Login / logout', () => {
  test('customer can log in and log out', { tag: ['@smoke', '@mobile'] }, async ({ page, cfg, auth, account, customer }) => {
    await auth.open();
    await auth.loginAndExpectSuccess(customer.email, customer.password);
    await expect(page).toHaveURL(new RegExp(`${cfg.routes.account}(\\?.*)?$`));

    await account.logout();
    await page.goto(cfg.routes.account);
    await expect(page).toHaveURL(new RegExp(cfg.routes.login));
  });

  test('wrong password shows an error', { tag: '@smoke' }, async ({ page, cfg, auth, customer }) => {
    await auth.open();
    await auth.login(customer.email, 'wrong-password-123');
    await expect(page).toHaveURL(new RegExp(cfg.routes.login));
    await expect(auth.loginError).toBeVisible();
  });

  test('unknown user shows an error', async ({ page, cfg, auth }) => {
    await auth.open();
    await auth.login(`nobody.${Date.now()}@${cfg.testData.customer.emailDomain}`, 'whatever-123');
    await expect(page).toHaveURL(new RegExp(cfg.routes.login));
    await expect(auth.loginError).toBeVisible();
  });

  test('account menu in header offers login', async ({ page, cfg, header }) => {
    await page.goto(cfg.routes.home);
    await expect(await header.guestLoginLink()).toBeVisible();
  });

  test('logged-in header menu offers logout', async ({ loggedInPage: page, cfg, header }) => {
    await page.goto(cfg.routes.home);
    const dd = await header.openAccountMenu();
    await expect(dd.locator(cfg.selectors.header.accountLogoutLink).first()).toBeVisible();
  });

  test('cart is kept after login', async ({ page, cfg, auth, cart, cartHelper, customer }) => {
    await cartHelper.add(cfg.testData.simpleProduct);
    await auth.open();
    await auth.loginAndExpectSuccess(customer.email, customer.password);
    await cart.open();
    await expect(cart.lineItem(cfg.testData.simpleProduct.name)).toBeVisible();
    void page;
  });
});
