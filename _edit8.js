const fs = require('fs');
const f = 'tests/storefront/tonerpartner.spec.ts';
let t = fs.readFileSync(f, 'utf8');
const crlf = t.includes('\r\n');
t = t.replace(/\r\n/g, '\n');
const a = `        // the consent layer can pop up and take the mouse away: hover again until the flyout stays open
        await expect(async () => {
          await root.hover();
          await expect(sub).toBeVisible({ timeout: 3_000 });
        }).toPass({ timeout: 20_000 });
        const href = await sub.getAttribute('href');
        await Promise.all([page.waitForLoadState('domcontentloaded'), sub.click()]);
`;
const b = `        // the flyout closes when the mouse leaves or the consent layer takes it away: hover and click together, retried
        let href: string | null = null;
        await expect(async () => {
          await root.hover();
          await expect(sub).toBeVisible({ timeout: 3_000 });
          href = await sub.getAttribute('href');
          await sub.click({ timeout: 3_000 });
        }).toPass({ timeout: 30_000 });
        await page.waitForLoadState('domcontentloaded');
`;
if (!t.includes(a)) throw new Error('missing');
t = t.replace(a, () => b);
fs.writeFileSync(f, crlf ? t.replace(/\n/g, '\r\n') : t);
