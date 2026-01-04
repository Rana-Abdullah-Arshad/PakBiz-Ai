
import { CreditPack, PlatformConfig, PageSEO } from './types';

const defaultPageSEO = (title: string, desc: string): PageSEO => ({
  title,
  description: desc,
  keywords: "pakbiz, pakistan business, ai automation, ecommerce pakistan",
  primaryKeyword: title.toLowerCase(),
  internalNote: "Default system SEO template",
  canonical: "",
  noindex: false,
  nofollow: false,
  sitemapInclude: true,
  ogTitle: title,
  ogDescription: desc,
  ogImage: "https://picsum.photos/seed/pakbiz-og/1200/630",
  twitterCard: 'summary_large_image'
});

export const DEFAULT_CONFIG: PlatformConfig = {
  siteName: "PakBiz AI",
  licensePricePKR: 1500,
  aiCostPerAction: 1,
  signingSecret: "PAKBIZ_SECRET_2024",
  jazzCashNumber: "0300-1234567",
  easypaisaNumber: "0311-7654321",
  bankAccount: "HBL - 1234567890123",
  paymentInstructions: "1. Transfer the exact amount to any account. 2. Capture the TID from the SMS. 3. Paste it here for instant activation.",
  footerNote: "Pakistan's #1 Stateless Business Suite",
  adminSecret: "Abdullah@123",
  generatedKeys: [],
  themePrimary: "#16a34a",
  themeSecondary: "#0f172a",
  packPrices: {
    small: 500,
    medium: 2000,
    large: 4000
  },
  seo: {
    global: {
      titleSuffix: "| PakBiz AI",
      defaultDescription: "The premier AI automation suite for Pakistani entrepreneurs.",
      defaultOgImage: "https://picsum.photos/seed/pakbiz-og/1200/630",
      siteLanguage: "en",
      targetCountry: "Pakistan",
      enableSitemap: true,
      enableRobots: true,
      enableSchema: true
    },
    pages: {
      home: defaultPageSEO("Home", "Automate your Pakistani business with AI profit calculators and WhatsApp scripts."),
      pricing: defaultPageSEO("Pricing & Plans", "Fair lifetime pricing for Pakistan's best business AI tools."),
      dashboard: defaultPageSEO("Dashboard", "Your PakBiz command center."),
      terms: defaultPageSEO("Terms of Service", "Legal terms for using the platform."),
      privacy: defaultPageSEO("Privacy Policy", "How we protect your stateless business data.")
    }
  },
  ai: {
    provider: 'gemini',
    model: 'gemini-3-flash-preview'
  }
};

export const CREDIT_PACKS: Omit<CreditPack, 'pricePKR'>[] = [
  { id: 'small', name: 'Starter Pack', credits: 50 },
  { id: 'medium', name: 'Growth Pack', credits: 250, popular: true },
  { id: 'large', name: 'Scale Pack', credits: 600 },
];

export const STORAGE_KEYS = {
  USER_STATE: 'pb_user_state',
  ADMIN_CONFIG: 'pb_admin_config',
  SALES_HISTORY: 'pb_sales_history'
};
