
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, UserState, PlatformConfig } from './types';
import { storageService } from './services/storageService';
import { supabaseService } from './services/supabaseService';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Legal from './pages/Legal';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [userState, setUserState] = useState<UserState>(storageService.getUserState());
  const [config, setConfig] = useState<PlatformConfig>(storageService.getAdminConfig());
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync Global Configuration from Supabase on Mount
  useEffect(() => {
    const syncConfig = async () => {
      const cloudConfig = await supabaseService.fetchConfig();
      if (cloudConfig) {
        setConfig(cloudConfig);
        storageService.setAdminConfig(cloudConfig);
      }
      setIsInitializing(false);
    };
    syncConfig();
  }, []);

  // Dynamic SEO Injection
  useEffect(() => {
    if (isInitializing) return;
    const pageKey = view.toString() as keyof typeof config.seo.pages;
    const pageSeo = config.seo.pages[pageKey] || config.seo.pages.home;
    const { global } = config.seo;

    document.title = `${pageSeo.title} ${global.titleSuffix}`;

    const updateMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const updateLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    updateMeta('description', pageSeo.description || global.defaultDescription);
    updateMeta('keywords', pageSeo.keywords);
    updateMeta('robots', `${pageSeo.noindex ? 'noindex' : 'index'}, ${pageSeo.nofollow ? 'nofollow' : 'follow'}`);
    
    const canonicalUrl = pageSeo.canonical || window.location.origin + (view === AppView.HOME ? '' : '/' + view);
    updateLink('canonical', canonicalUrl);

    updateMeta('og:title', pageSeo.ogTitle || pageSeo.title, 'property');
    updateMeta('og:description', pageSeo.ogDescription || pageSeo.description, 'property');
    updateMeta('og:image', pageSeo.ogImage || global.defaultOgImage, 'property');
    updateMeta('og:type', 'website', 'property');
    updateMeta('og:locale', global.siteLanguage, 'property');
    
    updateMeta('twitter:card', pageSeo.twitterCard);
    updateMeta('twitter:title', pageSeo.ogTitle || pageSeo.title);
    updateMeta('twitter:description', pageSeo.ogDescription || pageSeo.description);
    updateMeta('twitter:image', pageSeo.ogImage || global.defaultOgImage);

    if (global.enableSchema) {
      let script = document.getElementById('seo-schema');
      if (!script) {
        script = document.createElement('script');
        script.id = 'seo-schema';
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": config.siteName,
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "inLanguage": global.siteLanguage,
        "offers": {
          "@type": "Offer",
          "price": config.licensePricePKR,
          "priceCurrency": "PKR",
          "areaServed": global.targetCountry
        },
        "description": global.defaultDescription,
        "brand": {
          "@type": "Brand",
          "name": config.siteName
        }
      };
      script.textContent = JSON.stringify(schema);
    }
  }, [view, config, isInitializing]);

  // Update CSS Variables based on config
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', config.themePrimary);
    root.style.setProperty('--secondary', config.themeSecondary);
    
    if (userState.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config, userState.darkMode]);

  useEffect(() => {
    storageService.setUserState(userState);
  }, [userState]);

  useEffect(() => {
    storageService.setAdminConfig(config);
  }, [config]);

  const handleNavigate = (newView: AppView) => {
    window.scrollTo(0, 0);
    setView(newView);
  };

  const deductCredits = useCallback((amount: number) => {
    if (userState.credits >= amount) {
      setUserState(prev => ({ ...prev, credits: prev.credits - amount }));
      return true;
    }
    return false;
  }, [userState.credits]);

  const addCredits = (amount: number) => {
    setUserState(prev => ({ ...prev, credits: prev.credits + amount }));
  };

  const activateLicense = (key: string) => {
    setUserState(prev => ({ ...prev, isLicensed: true, licenseKey: key }));
  };

  const toggleDarkMode = () => {
    setUserState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const renderView = () => {
    if (isInitializing) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Synchronizing Nodes...</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case AppView.HOME:
        return <Home onNavigate={handleNavigate} isLicensed={userState.isLicensed} config={config} />;
      case AppView.PRICING:
        return (
          <Pricing 
            config={config} 
            onNavigate={handleNavigate} 
            isLicensed={userState.isLicensed} 
            onPurchaseCredits={addCredits}
            onActivateLicense={activateLicense}
          />
        );
      case AppView.DASHBOARD:
        if (!userState.isLicensed) {
          handleNavigate(AppView.PRICING);
          return null;
        }
        return (
          <Dashboard 
            userState={userState} 
            config={config} 
            onDeductCredits={deductCredits} 
            onNavigate={handleNavigate}
          />
        );
      case AppView.ADMIN:
        return <Admin config={config} onUpdateConfig={setConfig} />;
      case AppView.SETTINGS:
        return <Settings userState={userState} onUpdateUserState={setUserState} />;
      case AppView.PRIVACY:
      case AppView.TERMS:
      case AppView.WHITELABEL:
        return <Legal type={view} config={config} />;
      default:
        return <Home onNavigate={handleNavigate} isLicensed={userState.isLicensed} config={config} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Navbar 
        view={view} 
        onNavigate={handleNavigate} 
        credits={userState.credits} 
        isLicensed={userState.isLicensed}
        config={config}
        darkMode={userState.darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      <main className="flex-grow">
        {renderView()}
      </main>
      <Footer onNavigate={handleNavigate} config={config} />
    </div>
  );
};

export default App;
