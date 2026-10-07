import type { Selectors } from "../selectors/shopware67";

/** Deep partial helper used for project-level overrides. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/**
 * Switch storefront features on/off per client project.
 * Tests for a disabled feature are skipped automatically.
 */
export interface FeatureFlags {
  wishlist: boolean;
  guestCheckout: boolean;
  registration: boolean;
  /** Registration requires e-mail confirmation (double opt-in). */
  doubleOptInRegistration: boolean;
  productReviews: boolean;
  contactForm: boolean;
  newsletter: boolean;
  promotionCodes: boolean;
  /** Cookie consent banner is shown to first-time visitors. */
  cookieBanner: boolean;
  languageSwitch: boolean;
  currencySwitch: boolean;
  /** Mobile off-canvas navigation exists (Shopware default). */
  mobileNavigation: boolean;
  /** Third-party consent layer (Usercentrics) instead of Shopware's cookie banner: `selectors.cookie.*` describe it. */
  consentLayer?: boolean;
  /** Private/business customer switch that toggles prices incl./excl. VAT (TonerPartner shops). */
  vatSwitch?: boolean;
  /** TonerPartner shop family (HD-Toner, HQ-Patronen, Tintencenter): enables tests/storefront/tonerpartner.spec.ts. */
  tonerPartner?: boolean;
  /** Hovering a main category opens a mega-menu flyout with sub categories. */
  megaMenuFlyout?: boolean;
}

export interface ProductRef {
  /** SEO path relative to baseURL, e.g. "/Canvas-Tote-Bag/A-BAG-001-CREAM" */
  path: string;
  productNumber: string;
  name: string;
}

export interface RedirectRule {
  from: string;
  /** Expected final path (regex source or plain path prefix). */
  to: string;
  /** Only applies to logged-out visitors (default true). */
  guestOnly?: boolean;
}

export interface CustomerAddress {
  street: string;
  zipcode: string;
  city: string;
  /** ISO 3166 alpha-2, resolved to a countryId via Store API / UI */
  countryIso: string;
  /** Visible country name in the storefront select (used by UI flows). */
  countryLabel?: string;
}

export interface ProjectConfig {
  /** Human readable name, shown in reports. */
  name: string;
  baseURL: string;
  /** Shopware storefront locale — used for price parsing only. */
  locale: string;
  currencySymbol: string;

  features: FeatureFlags;

  /** Paths of important storefront routes (override for custom routing). */
  routes: {
    home: string;
    login: string;
    register: string;
    account: string;
    accountProfile: string;
    accountAddresses: string;
    accountOrders: string;
    logout: string;
    cart: string;
    checkoutRegister: string;
    checkoutConfirm: string;
    checkoutFinish: string;
    search: string;
    /** Query parameter of the search results URL (default "search"; FACT-Finder uses "query"). */
    searchParam?: string;
    wishlist: string;
    /** Path of a CMS page containing the contact form (null = discover via footer). */
    contactPage: string | null;
  };

  testData: {
    /** Main navigation category names in display order (first N are checked). */
    mainCategories: string[];
    /** A category with enough products for listing / filter / sorting tests. */
    listingCategoryPath: string;
    /** A simple (non-variant) product that can be bought. */
    simpleProduct: ProductRef;
    /** A product with variants (configurator). */
    variantProduct: ProductRef & { optionGroups: string[] };
    /** Search term that returns results. */
    searchTerm: string;
    /** Minimum number of hits expected for searchTerm. */
    searchMinResults: number;
    /** Search term guaranteed to return nothing. */
    searchNoResultTerm: string;

    breadcrumbPagePath?: string;
    outOfRangePageReturns500?: boolean;
    notFoundPage?: "shop" | "exception";
    /** Filter types that must exist on the listing page (language independent). */
    expectedFilterTypes: Array<
      "manufacturer" | "properties" | "price" | "rating" | "boolean"
    >;
    /** Sorting option keys that must exist (Shopware values). */
    expectedSortings: string[];
    customer: {
      emailDomain: string;
      emailPrefix: string;
      password: string;
      firstName: string;
      lastName: string;
      /** Salutation option index in the select (0 = "not specified"). */
      salutationIndex: number;
      address: CustomerAddress;
      /** Address rejected by the shop's address validation (negative tests); omit if the shop has none. */
      invalidAddress?: CustomerAddress;
    };
    /** Printer model finder (Hersteller > Serie > Modell, TonerPartner shops); omit if the shop has none. */
    printerFinder?: {
      manufacturer: string;
      /** Brand page listing the printer series, e.g. "/drucker/brother/". */
      manufacturerPath: string;
      series: string;
      /** Visible model name as listed in the model dropdown. */
      model: string;
      /** Substring of the printer page URL after selecting the model. */
      modelUrlPart: RegExp;
    };
    /** Page with the newsletter sign-up form (third party iframe on the TonerPartner shops). */
    newsletterPath?: string;
    /** Visible text of the footer link leading to the contact form. */
    contactLinkText: RegExp;
    /** Payment/shipping method labels to select in checkout; null = keep default. */
    paymentMethod: string | null;
    shippingMethod: string | null;
    promotionCode: string | null;
  };

  /** Redirects that must work (checked for guests unless stated). */
  redirects: RedirectRule[];

  /** Links (paths) that must resolve with a status < 400. */
  importantLinks: string[];

  /** Selector overrides for themes / customisations. Merged over Shopware 6.7 defaults. */
  selectors?: DeepPartial<Selectors>;
}

/** Final config after env overrides + selector merge. */
export interface ResolvedConfig extends Omit<ProjectConfig, "selectors"> {
  selectors: Selectors;
  env: {
    httpCredentials?: { username: string; password: string };
    admin: {
      clientId?: string;
      clientSecret?: string;
      username?: string;
      password?: string;
    };
    accessKey?: string;
    allowWriteTests: boolean;
    cleanupTestData: boolean;
  };
}
