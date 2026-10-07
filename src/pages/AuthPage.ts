import { expect, type Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import type { TestCustomer } from "../data/customer";

/**
 * Login + registration forms. Used on /account/login and /checkout/register
 * (checkout variant additionally offers guest checkout).
 */
export class AuthPage extends BasePage {
  get loginForm(): Locator {
    return this.$(this.s.login.form).first();
  }
  get registerForm(): Locator {
    return this.$(this.s.register.form).first();
  }

  private async openRegisterTab(): Promise<void> {
    if (await this.registerForm.isVisible()) return;
    await this.page.getByRole("tab", { name: "Neukunde" }).click();
    await expect(this.registerForm).toBeVisible();
  }

  async open(): Promise<void> {
    await this.goto(this.cfg.routes.login);
    await expect(this.loginForm).toBeVisible();
  }

  // ---------------- login ----------------
  async login(email: string, password: string): Promise<void> {
    // /checkout/register (tabbed variant): the login form sits behind the "Bereits Kunde" tab
    const loginTab = this.page.getByRole("tab", { name: "Bereits Kunde" });
    if (
      (await loginTab.isVisible()) &&
      !(await this.$(this.s.login.email).isVisible())
    )
      await loginTab.click();

    // On /checkout/register the login form is collapsed
    const toggle = this.$(this.s.login.collapseToggle).first();
    if (
      (await toggle.isVisible()) &&
      !(await this.$(this.s.login.email).isVisible())
    )
      await toggle.click();

    await this.$(this.s.login.email).fill(email);
    await this.$(this.s.login.password).fill(password);
    await this.$(this.s.login.submit).click();
  }

  async loginAndExpectSuccess(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await expect(this.page).not.toHaveURL(/\/account\/login/);
  }

  get loginError(): Locator {
    return this.loginForm
      .locator(this.s.page.alertDanger)
      .or(this.$(this.s.page.main).locator(this.s.page.alertDanger))
      .first();
  }

  // ---------------- registration ----------------
  async fillRegistration(
    c: TestCustomer,
    opts: { guest?: boolean; invalidAddress?: boolean } = {},
  ): Promise<void> {
    await this.openRegisterTab();
    const r = this.s.register;
    const form = this.registerForm;

    // /checkout/register: checkbox; /account/login: hidden input (value=1) → leave it alone
    const createAccount = form.locator(`${r.createAccount}[type="checkbox"]`);
    if (await createAccount.count()) {
      // checkout variant: checked = create account, unchecked = guest
      await createAccount.setChecked(!opts.guest, { force: true });
    }

    const salutation = form.locator(r.salutation);
    if (await salutation.isVisible())
      await salutation.selectOption({ index: c.salutationIndex });

    await form.locator(r.firstName).fill(c.firstName);
    await form.locator(r.lastName).fill(c.lastName);
    await form.locator(r.email).fill(c.email);

    const pw = form.locator(r.password);
    if (!opts.guest && (await pw.isVisible())) await pw.fill(c.password);
    // some themes add a password confirmation field
    const pwConfirm = form.locator('[name="passwordConfirmation"]');
    if (!opts.guest && (await pwConfirm.isVisible()))
      await pwConfirm.fill(c.password);

    await this.revealAddressStep(form);
    await this.selectCountry(
      form.locator(r.country).first(),
      c.address.countryLabel,
    );
    await form.locator(r.street).fill(c.address.street);
    await form.locator(r.zipcode).fill(c.address.zipcode);
    await form.locator(r.city).fill(c.address.city);
    // the address check starts when the last address field loses focus
    await form.locator(r.city).blur();
    await this.waitForAddressCheck(opts.invalidAddress);

    const dp = form.locator(r.dataProtection);
    if (await dp.count()) await dp.check({ force: true });
  }

  /**
   * /checkout/register (HD-Toner) is a stepped form: the address fields only appear after the
   * contact data was confirmed with "Weiter". A swallowed click (see submitRegistration) is retried.
   */
  private async revealAddressStep(form: Locator): Promise<void> {
    const street = form.locator(this.s.register.street);
    if (await street.isVisible()) return;
    await expect(async () => {
      if (!(await street.isVisible())) await form.locator(this.s.register.submit).first().click();
      await expect(street).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
  }

  /**
   * Address validation (Endereco) runs asynchronously after the address fields are filled; it may
   * rewrite the street and swallows a submit that happens while it is still working. For valid
   * addresses wait until the plugin reports a verdict. An invalid address never gets one before
   * submit, so nothing is awaited there (the modal is asserted by the test).
   */
  private async waitForAddressCheck(invalidAddress = false): Promise<void> {
    const status = this.registerForm.locator(this.s.addressCheck.status).first();
    if (invalidAddress || !(await status.count())) return;
    await expect(status, "address validation did not finish").not.toHaveValue("");
  }

  /** Address validation popup (shown on submit when the address is not accepted as entered). */
  get addressCheckModal(): Locator {
    return this.$(this.s.addressCheck.modal);
  }

  /** Accepts the shop's proposed address in the popup and confirms it. */
  async acceptSuggestedAddress(): Promise<void> {
    const a = this.s.addressCheck;
    const modal = this.addressCheckModal;
    await modal.locator(a.suggestion).first().check({ force: true });
    await modal.locator(a.useSelection).click();
    await expect(modal).toBeHidden();
  }

  private async selectCountry(select: Locator, label?: string): Promise<void> {
    if (!label || !(await select.isVisible())) return;
    const re = new RegExp(label, "i");
    const values = await select.locator("option").evaluateAll((opts, src) => {
      const rx = new RegExp(src, "i");
      return opts
        .filter((o) => rx.test(o.textContent ?? ""))
        .map((o) => (o as HTMLOptionElement).value);
    }, re.source);
    if (values[0]) await select.selectOption(values[0]);
  }

  /**
   * Submits the registration form. In a fresh session the shop's submit handling swallows the first
   * click (no `submit` event, nothing happens), so a click that produced no outcome is repeated.
   * Outcome = the form POST, the address check popup, or visible validation errors.
   */
  async submitRegistration(): Promise<void> {
    await this.openRegisterTab();
    const form = this.registerForm;
    const submit = form.locator(this.s.register.submit).first();
    const action = new URL((await form.getAttribute("action")) ?? "", this.page.url()).pathname;
    const feedback = this.addressCheckModal.or(this.validationErrors).first();

    for (let attempt = 1; attempt <= 3; attempt++) {
      // HQ-Patronen: the address check popup can already be open (opened by the field blur) and then
      // covers the submit button — that popup is the outcome the caller asserts on
      if (await this.addressCheckModal.isVisible()) return;
      const outcomes = [
        this.page
          .waitForRequest((r) => r.method() === "POST" && new URL(r.url()).pathname === action, { timeout: 3_000 })
          .then(() => true, () => false),
        feedback.waitFor({ state: "visible", timeout: 3_000 }).then(() => true, () => false),
      ];
      try {
        await submit.click();
      } catch (e) {
        // the popup opened while the click was being performed and now intercepts it
        if (await this.addressCheckModal.isVisible()) return;
        throw e;
      }
      const happened = await new Promise<boolean>((resolve) => {
        let pending = outcomes.length;
        for (const o of outcomes) o.then((ok) => (ok ? resolve(true) : --pending === 0 && resolve(false)));
      });
      if (happened) return;
    }
    throw new Error("Registration form was not submitted: the submit click had no effect after 3 attempts");
  }

  async register(
    c: TestCustomer,
    opts: { guest?: boolean; invalidAddress?: boolean } = {},
  ): Promise<void> {
    await this.fillRegistration(c, opts);
    await this.submitRegistration();
  }

  get invalidFields(): Locator {
    return this.registerForm.locator(this.s.page.invalidField);
  }

  /** Inline invalid fields (client/server validation) or an error alert on the page. */
  get validationErrors(): Locator {
    return this.invalidFields
      .or(this.$(this.s.page.main).locator(this.s.page.alertDanger))
      .locator("visible=true");
  }
}
