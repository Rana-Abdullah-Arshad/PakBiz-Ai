
export enum AppView {
  HOME = 'home',
  PRICING = 'pricing',
  DASHBOARD = 'dashboard',
  ADMIN = 'admin',
  SETTINGS = 'settings',
  PRIVACY = 'privacy',
  TERMS = 'terms',
  WHITELABEL = 'whitelabel'
}

export type AIProvider = 'gemini' | 'openai' | 'openrouter' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  customApiKey?: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  popular?: boolean;
  pricePKR: number;
}

export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  primaryKeyword?: string;
  internalNote?: string;
  canonical: string;
  noindex: boolean;
  nofollow: boolean;
  sitemapInclude: boolean;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
}

export interface GlobalSEO {
  titleSuffix: string;
  defaultDescription: string;
  defaultOgImage: string;
  siteLanguage: string;
  targetCountry: string;
  enableSitemap: boolean;
  enableRobots: boolean;
  enableSchema: boolean;
}

export interface PlatformConfig {
  siteName: string;
  licensePricePKR: number;
  aiCostPerAction: number;
  signingSecret: string;
  jazzCashNumber: string;
  easypaisaNumber: string;
  bankAccount: string;
  paymentInstructions: string;
  footerNote: string;
  adminSecret: string;
  generatedKeys: string[];
  themePrimary: string;
  themeSecondary: string;
  packPrices: Record<string, number>;
  seo: {
    global: GlobalSEO;
    pages: Record<string, PageSEO>;
  };
  ai: AIConfig;
}

export interface UserState {
  isLicensed: boolean;
  licenseKey: string | null;
  credits: number;
  darkMode: boolean;
}

export interface SalesRecord {
  timestamp: number;
  type: 'license' | 'credits';
  amount: number;
  transactionId: string;
  details?: string;
}

export interface BusinessLogicParams {
  cost: number;
  shipping: number;
  adCost: number;
  targetMargin: number;
}
