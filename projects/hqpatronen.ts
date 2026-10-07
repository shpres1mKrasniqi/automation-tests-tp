import type { ProjectConfig } from "../src/config/types";

const config: ProjectConfig = {
  name: "HQ-Patronen",
  baseURL: "https://staging.hq-patronen.de",
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
    newsletter: false, // page /kundenservice/newsletter/ exists; no form seen on the homepage
    promotionCodes: true, // TODO: confirm
    // Usercentrics is accepted automatically by the page fixture (addLocatorHandler on
    // cookie.acceptAll). Keep false: the cookie spec asserts Shopware's cookie-preference cookie.
    cookieBanner: false,
    languageSwitch: false,
    currencySwitch: false,
    mobileNavigation: true,
    consentLayer: true, // Usercentrics (see selectors.cookie)
    vatSwitch: true, // Privatkund*in inkl. MwSt. / Geschäftskunde exkl. MwSt.
    tonerPartner: true, // enables tests/storefront/tonerpartner.spec.ts
    megaMenuFlyout: false, // hovering a main category opens the mega menu
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
    contactPage: "/unternehmen/kontakt/",
  },

  testData: {
    // Header order of staging.hq-patronen.de (same TonerPartner theme as HD-Toner, different categories).
    mainCategories: ["Tinte", "Toner", "Trommel", "Sonstige", "Band", "Büroartikel", "Papier"],
    // /bueroartikel/ has many products + pagination + sorting
    listingCategoryPath: "/bueroartikel/",
    // main category pages have no breadcrumb (production www.hq-patronen.de neither); manufacturer pages do
    breadcrumbPagePath: "/brother/",
    simpleProduct: {
      path: "/kopierpapier-druckerpapier-500-blatt-din-a4-80-g-m2-weiss/43924",
      productNumber: "43924",
      name: "Kopierpapier / Druckerpapier, 500 Blatt, DIN A4, 80 g/m², weiß",
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
    outOfRangePageReturns500: true, // reproduced on production www.hq-patronen.de and staging (read-only GET)
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
    printerFinder: {
      manufacturer: "Brother",
      manufacturerPath: "/brother/",
      series: "HL-L",
      model: "Brother HL-L 2300 D",
      modelUrlPart: /\/brother-hl-l-2300-d\//,
    },
    newsletterPath: "/kundenservice/newsletter/",
    contactLinkText: /Kontakt|Contact/i,
    paymentMethod: "Vorkasse", // default is PayPal, which replaces the submit button with the PayPal button (#confirmFormSubmit stays d-none)
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
    "/toner",
    "/tinte",
    "/papier/",
    "/bueroartikel/",
    "/unternehmen/kontakt/",
    "/unternehmen/impressum/",
    "/garantie-sicherheit/datenschutz/",
    "/garantie-sicherheit/agb/",
    "/garantie-sicherheit/widerrufsrecht/",
    "/kundenservice/versandarten-kosten/",
  ],

  selectors: {
    page: {
      // the auth forms contain hidden `.alert.alert-danger.d-none` placeholders
      alertDanger: ".alert-danger:not(.d-none)",
    },
    navigation: {
      // root links carry .mega-menu-trigger instead of .root
      rootLink: ".main-navigation-link.mega-menu-trigger",
    },
    listing: {
      // each box renders its price twice and may add a "product-price-unit-list-price" (strike-through list price)
      productPrice: ".product-price:not(.product-price-unit-list-price)",
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
      // time dependent ("Versand noch heute" / ...): assert the card, not its wording
      delivery: ".tp-delivery-countdown-shipping-card",
    },
    cookie: {
      banner: "#usercentrics-cmp-ui",
      acceptAll: '#usercentrics-cmp-ui button:has-text("Alles akzeptieren")',
      onlyNecessary: '#usercentrics-cmp-ui button:has-text("Ablehnen")',
    },
  },
};

export default config;
