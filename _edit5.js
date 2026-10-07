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
ed('src/config/types.ts', [
  ['    /** Visible text of the footer link leading to the contact form. */', '    /** Page with the newsletter sign-up form (third party iframe on the TonerPartner shops). */\n    newsletterPath?: string;\n    /** Visible text of the footer link leading to the contact form. */'],
]);
ed('projects/hdtoner.ts', [['    contactLinkText: /Kontakt|Contact/i,', '    newsletterPath: "/service/newsletter/",\n    contactLinkText: /Kontakt|Contact/i,']]);
ed('projects/hqpatronen.ts', [['    contactLinkText: /Kontakt|Contact/i,', '    newsletterPath: "/kundenservice/newsletter/",\n    contactLinkText: /Kontakt|Contact/i,']]);
ed('projects/tintencenter.ts', [['    contactLinkText: /Kontakt|Contact/i,', '    newsletterPath: "/kundenservice/newsletter/",\n    contactLinkText: /Kontakt|Contact/i,']]);
