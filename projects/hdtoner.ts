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
    productReviews: true,
    contactForm: false,
    newsletter: false, // page /service/newsletter/ exists; no form seen on the homepage
    promotionCodes: true, // TODO: confirm
    cookieBanner: false, // Usercentrics, see notes below
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
    search: "/search",
    wishlist: "/wishlist",
    contactPage: "/informationen/kontakt/",
  },

  testData: {
    mainCategories: [
      "Druckerpatronen",
      "Toner",
      "Trommel",
      "Papier",
      "Büroartikel",
    ],
    listingCategoryPath: "/Papier/",
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
    searchNoResultTerm: "9999999999999",
    expectedFilterTypes: [], // no standard filter panel seen on /Papier/, verify on Toner
    expectedSortings: ["name-asc", "name-desc", "price-asc", "price-desc"],
    customer: {
      emailDomain: "example.com",
      emailPrefix: "e2e",
      password: "Shopware-E2E-2026!",
      firstName: "Erika",
      lastName: "Tester",
      salutationIndex: 1,
      address: {
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
    header: { logo: ".header-logo-main-link:visible >> nth=0" },
    product: {
      productNumber: 'tr:has-text("Produktnummer") td',
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
