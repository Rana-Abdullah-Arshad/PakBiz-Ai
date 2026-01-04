
import React from 'react';
import { AppView, PlatformConfig } from '../types';

interface LegalProps {
  type: AppView.PRIVACY | AppView.TERMS | AppView.WHITELABEL;
  config: PlatformConfig;
}

const Legal: React.FC<LegalProps> = ({ type, config }) => {
  const content = {
    [AppView.PRIVACY]: {
      title: "Privacy Policy",
      subtitle: "How we protect your business data at " + config.siteName,
      body: `
        At ${config.siteName}, we take your privacy seriously. Unlike traditional SaaS platforms, we operate on a **Stateless Architecture**. 
        This means your sensitive business data, prompts, and license information are stored primarily in your browser's local storage.

        ### 1. Data Collection
        We do not maintain a central database of your personal information. Your AI prompts are processed directly via the Gemini API and are not stored by us.
        
        ### 2. Payment Data
        Payment verification is handled manually via Transaction IDs. We do not store your bank details or wallet numbers.
        
        ### 3. Cookies
        We use browser LocalStorage to maintain your session, license status, and credit balance.
      `
    },
    [AppView.TERMS]: {
      title: "Terms of Service",
      subtitle: "Usage guidelines for the " + config.siteName + " platform",
      body: `
        By using ${config.siteName}, you agree to the following terms:
        
        ### 1. License Usage
        A lifetime license is valid for a single user/browser instance. Sharing license keys is strictly prohibited.
        
        ### 2. AI Credits
        Credits are non-refundable and non-transferable. Credits are consumed per successful AI generation.
        
        ### 3. Ethical Use
        You agree not to use our AI assistant for generating harmful, illegal, or spam content. We reserve the right to blacklist keys found in violation.
        
        ### 4. Limitation of Liability
        ${config.siteName} provides tools for business logic. We are not responsible for pricing errors or business losses incurred.
      `
    },
    [AppView.WHITELABEL]: {
      title: "White-label License",
      subtitle: "Terms for reselling and re-branding our technology",
      body: `
        The ${config.siteName} White-label license allows you to:
        
        ### 1. Re-branding
        Modify the platform name, logo, and theme colors via the Admin Panel for your own business or clients.
        
        ### 2. Reselling
        Sell access to your customized version of the platform to local sellers in Pakistan or globally.
        
        ### 3. Technical Support
        As a white-label owner, you are responsible for providing support to your end-users. ${config.siteName} provides support only to the primary license holder.
        
        ### 4. Code Integrity
        The core logic remains the property of the original developers. You are licensed to use and resell the front-end implementation.
      `
    }
  };

  const active = content[type];

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">{active.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{active.subtitle}</p>
      </div>
      <div className="prose prose-slate prose-lg max-w-none bg-white dark:bg-slate-800 p-10 md:p-16 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm leading-relaxed transition-colors">
        {active.body.split('\n').map((line, i) => {
          if (line.trim().startsWith('###')) {
            return <h3 key={i} className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">{line.replace('###', '').trim()}</h3>;
          }
          if (line.trim() === '') return <br key={i} />;
          return <p key={i} className="text-slate-600 dark:text-slate-300 mb-4">{line.trim()}</p>;
        })}
      </div>
    </div>
  );
};

export default Legal;
