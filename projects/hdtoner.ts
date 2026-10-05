import type { ProjectConfig } from "../src/config/types";

const config: ProjectConfig = {
  name: "HD-Toner",
  baseURL: "https://staging.hd-toner.de",
  locale: "de-DE",
  currencySymbol: "€",

  features: {
    wishlist: false,
    guestCheckout: true, // TODO: confirm in staging
    registration: true, // TODO: confirm in staging
    doubleOptInRegistration: false, // TODO: confirm in staging
    // No review teaser / review tab found on the PDP (verified on production)
    productReviews: false,
    contactForm: false,
    newsletter: false, // page /service/newsletter/ exists; no form seen on the homepage
    promotionCodes: true, // TODO: confirm
    // Usercentrics is accepted automatically by the page fixture (addLocatorHandler on
    // cookie.acceptAll). Keep false: the cookie spec asserts Shopware's cookie-preference cookie.
    cookieBanner: false,
    languageSwitch: false,
    currencySwitch: false,
    mobileNavigation: true,
  },

  routes: {
    home: "/",
    login: "/account/login",
    register: "/account/register",
    account: "/account",
    accountProfile: "/account/profile",
    accountAddresses: "/account/address",
    accountOrders: "/account/order",
    logout: "/account/logout",
    cart: "/checkout/cart",
    checkoutRegister: "/checkout/register",
    checkoutConfirm: "/checkout/confirm",
    checkoutFinish: "/checkout/finish",
    // Search is FACT-Finder: results live at /factfinder/result?query=...
    search: "/factfinder/result",
    searchParam: "query",
    wishlist: "/wishlist",
    contactPage: "/informationen/kontakt/",
  },

  testData: {
    // Header order. "Farbbänder" is left out on purpose: its link (/navigation/<id>)
    // redirects to /Farbband-Schriftband/, which returns 404 on production.
    mainCategories: [
      "Druckerpatronen",
      "Toner",
      "Trommel",
      "Papier",
      "Büroartikel",
    ],
    // /Papier/ has only 2 products; /bueroartikel/ has 24 + pagination + sorting
    listingCategoryPath: "/bueroartikel/",
    simpleProduct: {
      path: "/Papier/Druckerpapier-DIN-A4/Druckerpapier-DIN-A4-80g-weiss-500-Blatt.html",
      productNumber: "43924",
      name: "Druckerpapier DIN A4 - 80g - weiß - 500 Blatt",
    },
    // TODO: no variant product found yet. Give me one, or remove the variant test.
    variantProduct: {
      path: "/TODO-variant-product/",
      productNumber: "TODO",
      name: "TODO",
      optionGroups: ["TODO"],
    },
    searchTerm: "43924", // the search field takes printer models or product numbers
    searchMinResults: 1,
    // staging deliberately throws the Symfony routing exception for unknown URLs (production shows the shop 404 page)
    notFoundPage: "exception",
    searchNoResultTerm: "9999999999999",
    expectedFilterTypes: [], // only a printer-model filter on desktop, no standard filter panel
    expectedSortings: ["name-asc", "name-desc", "price-asc", "price-desc"],
    customer: {
      emailDomain: "example.com",
      emailPrefix: "e2e",
      password: "Shopware-E2E-2026!",
      firstName: "Erika",
      lastName: "Tester",
      salutationIndex: 1,
      // Endereco validates addresses on registration/checkout. This one is accepted unchanged
      // (a street like "Oststraße 1" would be rewritten to "Oststr. 1" by the plugin).
      address: {
        street: "Unter den Linden 77",
        zipcode: "10117",
        city: "Berlin",
        countryIso: "DE",
        countryLabel: "Deutschland|Germany",
      },
      // Not a real street in 48624 -> Endereco opens its "Rechnungsadresse prüfen" modal
      invalidAddress: {
        street: "Teststraße 1",
        zipcode: "48624",
        city: "Schöppingen",
        countryIso: "DE",
        countryLabel: "Deutschland|Germany",
      },
    },
    contactLinkText: /Kontakt|Contact/i,
    paymentMethod: null, // TODO: only an offline method, e.g. 'Vorkasse'
    shippingMethod: null,
    promotionCode: null, // TODO: a valid test code
  },

  redirects: [
    { from: "/account", to: "/account/login" },
    { from: "/checkout/confirm", to: "/checkout/cart" },
  ],

  importantLinks: [
    "/",
    "/checkout/cart",
    "/account/login",
    "/sitemap.xml",
    "/robots.txt",
    "/Toner/",
    "/Druckerpatronen/",
    "/Papier/",
    "/service/kontakt/",
    "/Impressum/",
    "/Datenschutz/",
    "/AGB/",
    "/Zahlung-und-Lieferung/",
    "/Widerrufsrecht/",
  ],

  selectors: {
    page: {
      // the auth forms contain hidden `.alert.alert-danger.d-none` placeholders
      alertDanger: ".alert-danger:not(.d-none)",
    },
    header: {
      logo: ".header-logo-main-link:visible >> nth=0",
      // FACT-Finder suggest list
      searchSuggest: ".ff-suggest-container",
    },
    login: {
      email: "#floatingInput-loginMail",
      password: "#floatingInput-loginPassword",
      submit: "form.login-form .tp-login-btn-submit",
    },
    offcanvasCart: {
      // the hidden .js-quantity-selector inputs are plugin stubs; the real control is the <select>
      quantityInput: 'select[name="quantity"]',
    },
    cart: {
      checkoutButton: "a.tp-confirm-form-proceed",
      promotionInput: 'form.offcanvas-cart-promotion-form input[name="code"]',
      promotionSubmit: "#addPromotionOffcanvasCart",
    },
    product: {
      productNumber: ".product-pim-id",
      description: '[role="tablist"]',
      tax: 'main p:has-text("inkl. MwSt."):visible',
      quantityInput: 'input.js-quantity-selector[type="number"]',
      delivery: 'main p:has-text("Bestellen Sie innerhalb von"):visible',
    },
    cookie: {
      banner: "#usercentrics-cmp-ui",
      acceptAll: '#usercentrics-cmp-ui button:has-text("Alles akzeptieren")',
      onlyNecessary: '#usercentrics-cmp-ui button:has-text("Ablehnen")',
    },
  },
};

export default config;
