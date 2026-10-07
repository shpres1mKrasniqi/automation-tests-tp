import { expect, type Locator } from '@playwright/test';
import { BasePage, escapeRegExp } from '../pages/BasePage';

/**
 * TonerPartner printer model finder: three dependent comboboxes (Hersteller > Serie > Modell).
 * They are text inputs with a custom option list (not <select>); a later field stays disabled
 * until the previous one has a value. Choosing a model navigates to the printer page.
 */
export class PrinterFinder extends BasePage {
  get manufacturer(): Locator {
    return this.$(this.s.printerFinder.manufacturerInput);
  }
  get series(): Locator {
    return this.$(this.s.printerFinder.seriesInput);
  }
  get model(): Locator {
    return this.$(this.s.printerFinder.modelInput);
  }

  /**
   * The finder script does not always start on a page load (observed on staging.tintencenter.com
   * and, more often, on production: the inputs then stay inert, `aria-expanded` is never set).
   * A fresh load fixes it, so the page is reloaded a bounded number of times; if it never starts
   * the test fails. Call before the first interaction (a reload resets everything chosen so far).
   */
  async waitUntilReady(): Promise<void> {
    await this.dismissConsent();
    for (let attempt = 1; ; attempt++) {
      try {
        await expect(this.manufacturer, 'printer finder did not initialise after page load').toHaveAttribute(
          'aria-expanded',
          /true|false/,
          { timeout: 8_000 },
        );
        return;
      } catch (e) {
        if (attempt === 3) throw e;
        await this.page.reload({ waitUntil: 'load' });
      }
    }
  }

  /**
   * Picks the option whose text equals `label`. The list opens on click but may also open by
   * itself after the previous choice (a click then closes it again) and the plugin binds late
   * after page load, so the list is only (re)opened while the option is not visible yet.
   */
  private async choose(input: Locator, options: string, label: string): Promise<void> {
    // the consent layer overlays the page for a few seconds after load and swallows clicks
    await this.dismissConsent();
    await expect(input).toBeEnabled();
    const option = this.$(options)
      .locator('visible=true')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })
      .first();
    await expect(async () => {
      if (!(await option.isVisible())) {
        // a click on an already focused input does not reopen the list: re-focus it
        await input.evaluate((el) => (el as HTMLInputElement).blur());
        await input.click();
      }
      await expect(option).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    await option.click();
  }

  async chooseManufacturer(label: string): Promise<void> {
    await this.waitUntilReady();
    await this.choose(this.manufacturer, this.s.printerFinder.manufacturerOption, label);
  }

  async chooseSeries(label: string): Promise<void> {
    await this.choose(this.series, this.s.printerFinder.seriesOption, label);
  }

  /** Selects the model and waits for the printer page. */
  async chooseModel(label: string): Promise<void> {
    const before = new URL(this.page.url()).pathname;
    await Promise.all([
      this.page.waitForURL((u) => u.pathname !== before, { waitUntil: 'load' }),
      this.choose(this.model, this.s.printerFinder.modelOption, label),
    ]);
  }
}
