import type { ProjectConfig } from "../src/config/types";

const config: ProjectConfig = {
  name: "Tintencenter",
  baseURL: "https://staging.tintencenter.com",
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
    // Usercentrics consent layer (see selectors.cookie)
    consentLayer: true,
    // "Privatkund*in inkl. MwSt." / "Geschäftskunde exkl. MwSt." switch in the top bar
    vatSwitch: true,
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
    search: "/factfinder/result",
    searchParam: "query",
    wishlist: "/wishlist",
    contactPage: "/unternehmen/kontakt/",
  },

  testData: {
    mainCategories: [
      "Tinte",
      "Toner",
      "Trommel",
      "Sonstige",
      "Band",
      "Büroartikel",
      "Papier",
    ],
    // /bueroartikel/ has many products + pagination + sorting
    listingCategoryPath: "/bueroartikel/",
    // main category pages have no breadcrumb (production www.tintencenter.com neither); manufacturer pages do
    breadcrumbPagePath: "/drucker/brother/",
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
    notFoundPage: "exception",
    outOfRangePageReturns500: true,
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
      address: {
        street: "Unter den Linden 77",
        zipcode: "10117",
        city: "Berlin",
        countryIso: "DE",
        countryLabel: "Deutschland|Germany",
      },
      invalidAddress: {
        street: "Teststraße 1",
        zipcode: "48624",
        city: "Schöppingen",
        countryIso: "DE",
        countryLabel: "Deutschland|Germany",
      },
    },
    // Tintencenter replaces the (missing) standard filter panel with the printer model finder in the header bar
    printerFinder: {
      manufacturer: "Brother",
      manufacturerPath: "/drucker/brother/",
      series: "HL-L",
      model: "Brother HL-L 2300 D",
      modelUrlPart: /\/brother\/brother-hl-l-2300-d\//,
    },
    newsletterPath: "/kundenservice/newsletter/",
    contactLinkText: /Kontakt|Contact/i,
    paymentMethod: "Vorkasse",
    shippingMethod: null,
    promotionCode: null,
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
    "/unternehmen/datenschutz/",
    "/unternehmen/agb/",
    "/unternehmen/widerrufsrecht/",
    "/kundenservice/versandarten-kosten/",
  ],

  selectors: {
    page: {
      alertDanger: ".alert-danger:not(.d-none)",
    },
    navigation: {
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
      // Tintencenter shows the delivery time ("Lieferung ... Lieferbar, 1-2 Tage") instead of the shipping countdown card
      delivery: ".product-detail-delivery-info",
    },
    cookie: {
      banner: "#usercentrics-cmp-ui",
      acceptAll: '#usercentrics-cmp-ui button:has-text("Alles akzeptieren")',
      onlyNecessary: '#usercentrics-cmp-ui button:has-text("Ablehnen")',
    },
  },
};

export default config;
