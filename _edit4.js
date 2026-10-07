const fs = require('fs');
function ed(file, pairs) {
  let t = fs.readFileSync(file, 'utf8');
  const crlf = t.includes('\r\n');
  t = t.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) {
    if (!t.includes(a)) { console.log('MISSING in', file, ':', a.slice(0, 70)); continue; }
    t = t.replace(a, () => b);
  }
  fs.writeFileSync(file, crlf ? t.replace(/\n/g, '\r\n') : t);
}
const flags = (mega) => `    tonerPartner: true, // enables tests/storefront/tonerpartner.spec.ts\n    megaMenuFlyout: ${mega}, // hovering a main category opens the mega menu\n`;
ed('projects/hdtoner.ts', [
  ['    vatSwitch: true, // Privatkund*in inkl. MwSt. / Geschäftskunde exkl. MwSt.\n', '    vatSwitch: true, // Privatkund*in inkl. MwSt. / Geschäftskunde exkl. MwSt.\n' + flags('true')],
  ['    contactLinkText: /Kontakt|Contact/i,', '    printerFinder: {\n      manufacturer: "Brother",\n      manufacturerPath: "/toner/brother/",\n      series: "HL-L",\n      model: "Brother HL-L 2300 D",\n      modelUrlPart: /\\/Toner\\/Brother\\/HL-L2300D\\//i,\n    },\n    contactLinkText: /Kontakt|Contact/i,'],
]);
ed('projects/hqpatronen.ts', [
  ['    vatSwitch: true, // Privatkund*in inkl. MwSt. / Geschäftskunde exkl. MwSt.\n', '    vatSwitch: true, // Privatkund*in inkl. MwSt. / Geschäftskunde exkl. MwSt.\n' + flags('false')],
  ['    contactLinkText: /Kontakt|Contact/i,', '    printerFinder: {\n      manufacturer: "Brother",\n      manufacturerPath: "/brother/",\n      series: "HL-L",\n      model: "Brother HL-L 2300 D",\n      modelUrlPart: /\\/brother-hl-l-2300-d\\//,\n    },\n    contactLinkText: /Kontakt|Contact/i,'],
]);
ed('projects/tintencenter.ts', [
  ['    vatSwitch: true,\n', '    vatSwitch: true,\n' + flags('false')],
]);
