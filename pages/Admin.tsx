
import React, { useState, useRef, useEffect } from 'react';
import { PlatformConfig, SalesRecord, PageSEO, AIProvider, GlobalSEO } from '../types';
import { storageService } from '../services/storageService';
import { securityService } from '../services/securityService';
import { CREDIT_PACKS } from '../constants';
import JSZip from 'jszip';

interface AdminProps {
  config: PlatformConfig;
  onUpdateConfig: (config: PlatformConfig) => void;
}

const Admin: React.FC<AdminProps> = ({ config, onUpdateConfig }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  // White Label Export State
  const [exportStep, setExportStep] = useState<'idle' | 'branding' | 'business' | 'generating' | 'success'>('idle');
  const [exportConfig, setExportConfig] = useState<PlatformConfig>({ ...config });
  
  const [revealApiKey, setRevealApiKey] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [localConfig, setLocalConfig] = useState<PlatformConfig>(config);
  const [sales] = useState<SalesRecord[]>(storageService.getSalesHistory());
  const [message, setMessage] = useState('');

  // SEO Suite State
  const [selectedSeoPage, setSelectedSeoPage] = useState<string | null>(null);
  const [seoTab, setSeoTab] = useState<'dashboard' | 'global'>('dashboard');

  // Vault plain text storage (session only - Volatile Memory)
  const [plainApiKey, setPlainApiKey] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretInput === config.adminSecret) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect Secret Key. Access Denied.');
    }
  };

  const handleSave = async () => {
    let finalConfig = { ...localConfig };

    // Encrypt AI Key if changed
    if (isAiModalOpen && plainApiKey && !plainApiKey.startsWith('ENCRYPTED:')) {
      const encryptedKey = await securityService.encrypt(plainApiKey, config.adminSecret);
      finalConfig.ai.customApiKey = encryptedKey;
    }

    onUpdateConfig(finalConfig);
    setMessage('Settings synchronized!');
    setIsPriceModalOpen(false);
    setIsSeoModalOpen(false);
    setIsAiModalOpen(false);
    
    // SECURITY: Wipe plain text from volatile memory
    setPlainApiKey('');
    setRevealApiKey(false);
    
    setTimeout(() => setMessage(''), 3000);
  };

  const generateNewKey = () => {
    const prefix = 'PK';
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `${prefix}-${segment()}-${segment()}-${segment()}`;
    const updatedKeys = [...localConfig.generatedKeys, newKey];
    const newConfig = { ...localConfig, generatedKeys: updatedKeys };
    setLocalConfig(newConfig);
    onUpdateConfig(newConfig);
    setMessage(`Key: ${newKey}`);
    setIsDropdownOpen(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const deleteKey = (keyToDelete: string) => {
    if(!confirm('Permanently revoke this Master Key?')) return;
    const updatedKeys = localConfig.generatedKeys.filter(k => k !== keyToDelete);
    const newConfig = { ...localConfig, generatedKeys: updatedKeys };
    setLocalConfig(newConfig);
    onUpdateConfig(newConfig);
  };

  const handlePackPriceChange = (id: string, price: number) => {
    setLocalConfig({
      ...localConfig,
      packPrices: { ...localConfig.packPrices, [id]: price }
    });
  };

  const updatePageSeo = (page: string, data: Partial<PageSEO>) => {
    setLocalConfig({
      ...localConfig,
      seo: {
        ...localConfig.seo,
        pages: {
          ...localConfig.seo.pages,
          [page]: { ...localConfig.seo.pages[page], ...data }
        }
      }
    });
  };

  const updateGlobalSeo = (data: Partial<GlobalSEO>) => {
    setLocalConfig({
      ...localConfig,
      seo: {
        ...localConfig.seo,
        global: { ...localConfig.seo.global, ...data }
      }
    });
  };

  const calculateSeoHealth = (page: PageSEO) => {
    let score = 0;
    if (page.title && page.title.length >= 40 && page.title.length <= 65) score += 30;
    else if (page.title && page.title.length > 0) score += 15;

    if (page.description && page.description.length >= 120 && page.description.length <= 160) score += 30;
    else if (page.description && page.description.length > 0) score += 15;

    if (page.ogImage && page.ogImage.length > 10) score += 20;
    if (page.primaryKeyword && page.primaryKeyword.length > 3) score += 20;
    
    return score;
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);

  const runExportSystem = async () => {
    setExportStep('generating');
    try {
      const zip = new JSZip();
      const newAdminSecret = "Root@" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const newSigningSecret = Math.random().toString(36).substring(2, 16) + Math.random().toString(36).substring(2, 16);
      
      const cleanConfig = { 
        ...exportConfig, 
        adminSecret: newAdminSecret, 
        signingSecret: newSigningSecret, 
        generatedKeys: [],
        ai: { ...exportConfig.ai, customApiKey: "" }
      };

      zip.file("config.json", JSON.stringify(cleanConfig, null, 2));
      zip.file("README.md", `# Distribution Bundle: ${exportConfig.siteName}\n\nCredentials:\nAdmin: ${newAdminSecret}\nSecret: ${newSigningSecret}`);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pakbiz-whitelabel-${exportConfig.siteName.toLowerCase().replace(/\s/g, '-')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportStep('success');
    } catch (err) {
      console.error(err);
      setExportStep('branding');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl text-center">
          <div className="w-24 h-24 bg-secondary text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Authority Required</h1>
          <form onSubmit={handleAuth} className="space-y-6">
            <input 
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="••••••••"
              className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-secondary outline-none text-center font-black tracking-[0.5em] transition-all bg-slate-50 dark:bg-slate-900 dark:text-white"
              autoFocus
            />
            {authError && <p className="text-red-500 font-bold">{authError}</p>}
            <button type="submit" className="w-full text-white py-5 rounded-2xl font-black text-xl bg-secondary hover:opacity-95 shadow-lg">Verify & Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
        <div>
          <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">Command Center</h1>
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Node Cluster: Secure</p>
          </div>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-secondary dark:bg-slate-800 text-white px-10 py-5 rounded-3xl font-black hover:opacity-90 transition-all flex items-center shadow-2xl border border-transparent dark:border-slate-700"
          >
            Management Modules
            <svg className={`w-6 h-6 ml-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-5 w-80 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 py-5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
              <button onClick={generateNewKey} className="w-full px-8 py-4 text-left flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                <svg className="w-5 h-5 mr-4 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                 License Authority
              </button>
              <button onClick={() => { setIsPriceModalOpen(true); setIsDropdownOpen(false); }} className="w-full px-8 py-4 text-left flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                <svg className="w-5 h-5 mr-4 text-amber-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                 Pack Optimization
              </button>
              <button onClick={() => { setIsAiModalOpen(true); setIsDropdownOpen(false); }} className="w-full px-8 py-4 text-left flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                <svg className="w-5 h-5 mr-4 text-indigo-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                 AI Security Vault
              </button>
              <button onClick={() => { setIsSeoModalOpen(true); setIsDropdownOpen(false); }} className="w-full px-8 py-4 text-left flex items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                <svg className="w-5 h-5 mr-4 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                 SEO Strategy Suite
              </button>
              <button onClick={() => { setIsExportModalOpen(true); setIsDropdownOpen(false); setExportStep('branding'); }} className="w-full px-8 py-4 text-left flex items-center hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-bold group transition-colors">
                <svg className="w-5 h-5 mr-4 text-rose-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                 White-Label Bundle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* AI Vault */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative">
            
            {/* Security Indicator */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
            
            {/* Vault Header */}
            <div className="p-10 border-b dark:border-slate-800 flex items-center justify-between bg-indigo-50/20 dark:bg-indigo-900/10">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black dark:text-white tracking-tighter">Neural Access Vault</h2>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AES-256 Memory Encrypted</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setIsAiModalOpen(false); setPlainApiKey(''); }}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-10 space-y-10">
              {/* Provider Grid */}
              <div className="grid grid-cols-2 gap-4">
                {(['gemini', 'openai', 'openrouter', 'deepseek'] as AIProvider[]).map((prov) => (
                  <button 
                    key={prov} 
                    onClick={() => setLocalConfig({...localConfig, ai: {...localConfig.ai, provider: prov}})} 
                    className={`p-6 rounded-[2rem] border-2 transition-all text-left relative overflow-hidden group ${localConfig.ai.provider === prov ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}
                  >
                    <div className="flex justify-between items-start mb-3 relative z-10">
                      <div className={`capitalize font-black text-lg ${localConfig.ai.provider === prov ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{prov}</div>
                      {localConfig.ai.provider === prov && (
                        <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">{prov === 'gemini' ? 'Native SDK' : 'API Bridge'}</div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500"></div>
                  </button>
                ))}
              </div>

              {/* Secure Inputs */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Deployment Model</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. gemini-3-pro-preview" 
                      value={localConfig.ai.model} 
                      onChange={(e) => setLocalConfig({...localConfig, ai: {...localConfig.ai, model: e.target.value}})} 
                      className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center">
                       <span className="text-[9px] font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full uppercase tracking-tighter">Active Target</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">External API Secret (Volatile Input)</label>
                    {localConfig.ai.provider !== 'gemini' && (
                      <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${localConfig.ai.customApiKey ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {localConfig.ai.customApiKey ? 'Sealed' : 'Empty'}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <input 
                      type={revealApiKey ? "text" : "password"} 
                      placeholder={localConfig.ai.customApiKey ? "•••••••••••••••• (Hacker Protected)" : "Enter API Key..."} 
                      value={plainApiKey} 
                      onChange={(e) => setPlainApiKey(e.target.value)} 
                      className={`w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-mono text-sm outline-none transition-all focus:border-indigo-500 ${localConfig.ai.provider === 'gemini' ? 'opacity-30 grayscale cursor-not-allowed' : 'opacity-100'}`}
                      disabled={localConfig.ai.provider === 'gemini'}
                    />
                    {localConfig.ai.provider !== 'gemini' && (
                      <button 
                        onClick={() => setRevealApiKey(!revealApiKey)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {revealApiKey ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.882 9.882L5.172 5.172M19 19L5 5" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium italic ml-2 mt-2 leading-relaxed">
                    * Gemini uses system-injected key. Others require manual entry which will be AES-256 encrypted using your Admin Secret.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 flex justify-between items-center">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vault Status</span>
                 <span className="text-xs font-bold text-indigo-500">Cluster Synchronized</span>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => { setIsAiModalOpen(false); setPlainApiKey(''); }} 
                  className="px-10 py-5 font-black text-slate-400 hover:text-slate-600 transition-colors text-sm uppercase tracking-widest"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSave} 
                  className="bg-indigo-500 text-white px-14 py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Seal & Sync Vault
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEO Suite */}
      {isSeoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in fade-in">
          <div className="w-full max-w-7xl bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[95vh] transition-all">
            
            {/* Modal Header */}
            <div className="p-10 border-b dark:border-slate-700 flex items-center justify-between bg-emerald-50/20 dark:bg-emerald-900/10">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <h2 className="text-4xl font-black dark:text-white tracking-tighter">SEO Strategy Suite</h2>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.2em] mt-1">Organic Visibility & Asset Control</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsSeoModalOpen(false); setSelectedSeoPage(null); }}
                className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-slate-100 dark:border-slate-700"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex px-12 py-6 bg-slate-50/50 dark:bg-slate-900/40 border-b dark:border-slate-700 space-x-12">
              <button 
                onClick={() => {setSeoTab('dashboard'); setSelectedSeoPage(null);}} 
                className={`flex items-center text-[11px] font-black uppercase tracking-[0.3em] pb-3 border-b-4 transition-all ${seoTab === 'dashboard' ? 'text-emerald-500 border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Health Matrix
              </button>
              <button 
                onClick={() => {setSeoTab('global'); setSelectedSeoPage(null);}} 
                className={`flex items-center text-[11px] font-black uppercase tracking-[0.3em] pb-3 border-b-4 transition-all ${seoTab === 'global' ? 'text-emerald-500 border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>
                Global Rules
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
               {/* Tab 1: Page Dashboard */}
               {seoTab === 'dashboard' && !selectedSeoPage && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
                    {Object.keys(localConfig.seo.pages).map(page => {
                      const health = calculateSeoHealth(localConfig.seo.pages[page]);
                      return (
                        <div 
                          key={page} 
                          className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-500/30 transition-all group flex flex-col justify-between shadow-sm hover:shadow-xl"
                        >
                           <div>
                             <div className="flex justify-between items-start mb-8">
                               <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-emerald-500">
                                 {page.charAt(0).toUpperCase()}
                               </div>
                               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${health >= 80 ? 'bg-green-100 text-green-600' : health >= 40 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                 {health}% EFFICIENT
                               </div>
                             </div>
                             <h3 className="text-2xl font-black dark:text-white capitalize tracking-tighter mb-4">{page}</h3>
                             <div className="space-y-3 mb-8">
                                <div className="flex items-center text-xs font-bold text-slate-500">
                                  <div className={`w-2 h-2 rounded-full mr-3 ${localConfig.seo.pages[page].title ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  Metadata Assets
                                </div>
                                <div className="flex items-center text-xs font-bold text-slate-500">
                                  <div className={`w-2 h-2 rounded-full mr-3 ${localConfig.seo.pages[page].ogImage ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  Social Integration
                                </div>
                                <div className="flex items-center text-xs font-bold text-slate-500">
                                  <div className={`w-2 h-2 rounded-full mr-3 ${!localConfig.seo.pages[page].noindex ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                  Crawl Priority
                                </div>
                             </div>
                           </div>
                           <button 
                             onClick={() => setSelectedSeoPage(page)} 
                             className="w-full py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all border border-transparent dark:border-slate-700"
                           >
                             Manage Strategy
                           </button>
                        </div>
                      );
                    })}
                 </div>
               )}

               {/* Tab 2: Global Config Suite */}
               {seoTab === 'global' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="space-y-10">
                      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-700 space-y-8">
                        <h3 className="text-xs font-black dark:text-white uppercase tracking-[0.4em] text-emerald-500">Sitewide Identity</h3>
                        <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Title Brand Suffix</label>
                             <input 
                                type="text" 
                                value={localConfig.seo.global.titleSuffix} 
                                onChange={(e) => updateGlobalSeo({ titleSuffix: e.target.value })} 
                                className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 transition-all" 
                                placeholder="| PakBiz AI"
                             />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Default Social Image (OG)</label>
                             <input 
                                type="text" 
                                value={localConfig.seo.global.defaultOgImage} 
                                onChange={(e) => updateGlobalSeo({ defaultOgImage: e.target.value })} 
                                className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono text-xs outline-none focus:border-emerald-500 transition-all" 
                                placeholder="https://..."
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Site Language (ISO)</label>
                                <input 
                                   type="text" 
                                   value={localConfig.seo.global.siteLanguage} 
                                   onChange={(e) => updateGlobalSeo({ siteLanguage: e.target.value })} 
                                   className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold" 
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Target Market</label>
                                <input 
                                   type="text" 
                                   value={localConfig.seo.global.targetCountry} 
                                   onChange={(e) => updateGlobalSeo({ targetCountry: e.target.value })} 
                                   className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold" 
                                />
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl space-y-10 border border-slate-800">
                       <h3 className="text-xl font-black flex items-center tracking-tighter">
                         <svg className="w-6 h-6 mr-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                         Technical Deployment Logics
                       </h3>
                       <div className="space-y-6">
                         {[
                           { label: "Auto-Generate Sitemap.xml", key: 'enableSitemap', desc: "Automatically index platform pages for Google Bot." },
                           { label: "Deploy Custom Robots.txt", key: 'enableRobots', desc: "Manage crawler directives sitewide." },
                           { label: "Inject Schema.org JSON-LD", key: 'enableSchema', desc: "Add rich result data for search engines." }
                         ].map(item => (
                           <div key={item.key} className="flex items-center justify-between p-6 bg-slate-800/50 rounded-[2rem] border border-slate-700/50 hover:bg-slate-800 transition-colors">
                             <div className="flex-grow">
                               <div className="font-bold text-sm tracking-wide">{item.label}</div>
                               <div className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-widest">{item.desc}</div>
                             </div>
                             <button 
                               onClick={() => updateGlobalSeo({ [item.key]: !localConfig.seo.global[item.key as keyof GlobalSEO] })} 
                               className={`w-14 h-7 rounded-full transition-all relative ${localConfig.seo.global[item.key as keyof GlobalSEO] ? 'bg-emerald-500' : 'bg-slate-600'}`}
                             >
                               <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${localConfig.seo.global[item.key as keyof GlobalSEO] ? 'right-1' : 'left-1'}`}></div>
                             </button>
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>
               )}

               {/* Editor: Selected Page Strategy */}
               {selectedSeoPage && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-in slide-in-from-right-10 duration-500">
                    <div className="space-y-12">
                       <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border-2 border-emerald-500/20 space-y-10 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                          
                          <div className="space-y-8">
                             <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">Core Metadata</h4>
                             <div className="space-y-6">
                                <div className="space-y-2">
                                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">SEO Title Tag</label>
                                   <input 
                                      type="text" 
                                      value={localConfig.seo.pages[selectedSeoPage].title} 
                                      onChange={(e) => updatePageSeo(selectedSeoPage, { title: e.target.value })} 
                                      className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 transition-all" 
                                   />
                                   <div className="flex justify-between px-2 text-[9px] font-bold uppercase tracking-widest">
                                      <span className={localConfig.seo.pages[selectedSeoPage].title.length > 65 ? 'text-red-500' : 'text-slate-400'}>
                                         {localConfig.seo.pages[selectedSeoPage].title.length} / 65 Characters
                                      </span>
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Meta Description</label>
                                   <textarea 
                                      value={localConfig.seo.pages[selectedSeoPage].description} 
                                      onChange={(e) => updatePageSeo(selectedSeoPage, { description: e.target.value })} 
                                      className="w-full px-8 py-5 rounded-3xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold h-32 resize-none outline-none focus:border-emerald-500 transition-all" 
                                   />
                                   <div className="flex justify-between px-2 text-[9px] font-bold uppercase tracking-widest">
                                      <span className={localConfig.seo.pages[selectedSeoPage].description.length > 160 ? 'text-red-500' : 'text-slate-400'}>
                                         {localConfig.seo.pages[selectedSeoPage].description.length} / 160 Characters
                                      </span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-8">
                             <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">Advanced Directives</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <button 
                                  onClick={() => updatePageSeo(selectedSeoPage, { noindex: !localConfig.seo.pages[selectedSeoPage].noindex })}
                                  className={`flex items-center justify-center p-6 rounded-2xl border-2 transition-all font-black text-[10px] tracking-widest uppercase ${localConfig.seo.pages[selectedSeoPage].noindex ? 'bg-red-50 border-red-500 text-red-600' : 'bg-green-50 border-green-500 text-green-600'}`}
                                >
                                  {localConfig.seo.pages[selectedSeoPage].noindex ? 'NO-INDEX Active' : 'Indexable'}
                                </button>
                                <button 
                                  onClick={() => updatePageSeo(selectedSeoPage, { nofollow: !localConfig.seo.pages[selectedSeoPage].nofollow })}
                                  className={`flex items-center justify-center p-6 rounded-2xl border-2 transition-all font-black text-[10px] tracking-widest uppercase ${localConfig.seo.pages[selectedSeoPage].nofollow ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                >
                                  {localConfig.seo.pages[selectedSeoPage].nofollow ? 'NO-FOLLOW' : 'Do-Follow'}
                                </button>
                             </div>
                             <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Canonical Overload</label>
                                <input 
                                   type="text" 
                                   value={localConfig.seo.pages[selectedSeoPage].canonical} 
                                   onChange={(e) => updatePageSeo(selectedSeoPage, { canonical: e.target.value })} 
                                   className="w-full px-8 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-mono text-xs outline-none" 
                                   placeholder="Leave empty for auto-canonical"
                                />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-12">
                       <div className="space-y-6">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Google Search Preview</h4>
                          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-w-lg transition-all hover:scale-[1.02]">
                             <div className="flex items-center text-sm text-slate-500 mb-2 truncate">
                                https://{localConfig.siteName.toLowerCase().replace(/\s/g, '')}.pk 
                                <span className="mx-1">›</span>
                                <span className="font-medium text-slate-800">{selectedSeoPage}</span>
                             </div>
                             <div className="text-2xl text-[#1a0dab] font-medium mb-2 line-clamp-1 hover:underline cursor-pointer">
                                {localConfig.seo.pages[selectedSeoPage].title} {localConfig.seo.global.titleSuffix}
                             </div>
                             <div className="text-sm text-[#4d5156] line-clamp-3 leading-relaxed">
                                {localConfig.seo.pages[selectedSeoPage].description || "Missing description tag..."}
                             </div>
                          </div>
                       </div>

                       <div className="bg-slate-50 dark:bg-slate-900/40 p-10 rounded-[3rem] border-2 border-slate-100 dark:border-slate-700 space-y-8">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Social Assets</h4>
                          <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">OpenGraph Image</label>
                                <input 
                                   type="text" 
                                   value={localConfig.seo.pages[selectedSeoPage].ogImage} 
                                   onChange={(e) => updatePageSeo(selectedSeoPage, { ogImage: e.target.value })} 
                                   className="w-full px-6 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white font-mono text-xs outline-none" 
                                   placeholder="URL to 1200x630 image"
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Primary Keyword</label>
                                <input 
                                   type="text" 
                                   value={localConfig.seo.pages[selectedSeoPage].primaryKeyword} 
                                   onChange={(e) => updatePageSeo(selectedSeoPage, { primaryKeyword: e.target.value })} 
                                   className="w-full px-6 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white font-bold outline-none" 
                                />
                             </div>
                          </div>
                       </div>

                       <div className="flex space-x-4">
                          <button 
                             onClick={() => setSelectedSeoPage(null)} 
                             className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
                          >
                             Commit & Return
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="p-10 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-700 flex justify-end items-center space-x-8">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center">
                 <svg className="w-5 h-5 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 Changes persist in cluster memory
               </div>
               <button 
                  onClick={handleSave} 
                  className="bg-emerald-500 text-white px-20 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] transition-transform active:scale-95"
               >
                  Sync SEO Cluster
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. WHITE-LABEL BUNDLER MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b dark:border-slate-700 flex items-center justify-between bg-rose-50/20 dark:bg-rose-900/10">
              <div>
                <h2 className="text-4xl font-black dark:text-white tracking-tighter flex items-center">
                  <svg className="w-10 h-10 mr-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  SaaS Bundler
                </h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-2">White-label distribution system</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
              {exportStep === 'branding' && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-300">
                   <h3 className="text-2xl font-black dark:text-white flex items-center"><span className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center mr-4">01</span> Distribution Branding</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Name</label>
                        <input type="text" value={exportConfig.siteName} onChange={(e) => setExportConfig({...exportConfig, siteName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Price (PKR)</label>
                        <input type="number" value={exportConfig.licensePricePKR} onChange={(e) => setExportConfig({...exportConfig, licensePricePKR: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Identity Color</label>
                        <input type="color" value={exportConfig.themePrimary} onChange={(e) => setExportConfig({...exportConfig, themePrimary: e.target.value})} className="w-full h-14 rounded-2xl border-2 border-slate-50 dark:border-slate-700 cursor-pointer" />
                      </div>
                   </div>
                   <button onClick={() => setExportStep('business')} className="w-full bg-primary text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-primary/20">Next: Logic Isolation</button>
                </div>
              )}
              {exportStep === 'business' && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-300">
                   <h3 className="text-2xl font-black dark:text-white flex items-center"><span className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center mr-4">02</span> Isolated Logic</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New JazzCash No.</label>
                        <input type="text" value={exportConfig.jazzCashNumber} onChange={(e) => setExportConfig({...exportConfig, jazzCashNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Easypaisa No.</label>
                        <input type="text" value={exportConfig.easypaisaNumber} onChange={(e) => setExportConfig({...exportConfig, easypaisaNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                   </div>
                   <div className="p-8 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl border border-rose-100/50 dark:border-rose-700/30 text-xs font-bold text-rose-600 leading-relaxed">
                     ⚠️ All original Master Keys and Admin Secrets will be stripped and regenerated for the safety of this distribution bundle.
                   </div>
                   <div className="flex space-x-4">
                     <button onClick={() => setExportStep('branding')} className="px-10 py-5 font-black text-slate-400 hover:text-slate-600">Back</button>
                     <button onClick={runExportSystem} className="flex-grow bg-slate-900 text-white py-5 rounded-3xl font-black text-xl shadow-2xl">Deploy Build Pipeline</button>
                   </div>
                </div>
              )}
              {exportStep === 'generating' && (
                <div className="py-24 text-center">
                   <div className="w-24 h-24 border-[10px] border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-10"></div>
                   <h3 className="text-3xl font-black dark:text-white">Isolating RSA Framework...</h3>
                </div>
              )}
              {exportStep === 'success' && (
                <div className="py-12 text-center animate-in zoom-in duration-500">
                   <div className="w-32 h-32 bg-green-500 text-white rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
                     <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <h3 className="text-5xl font-black dark:text-white mb-6 tracking-tighter">Cluster Packed!</h3>
                   <button onClick={() => setIsExportModalOpen(false)} className="bg-slate-900 text-white px-16 py-6 rounded-3xl font-black text-xl hover:scale-105 transition-transform">Command Dashboard</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. PACK OPTIMIZATION SUITE (UPGRADED) */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-400">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-10 border-b dark:border-slate-800 flex items-center justify-between bg-amber-50/20 dark:bg-amber-900/10">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                </div>
                <div>
                  <h2 className="text-4xl font-black dark:text-white tracking-tighter">Node Pack Optimization</h2>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">Revenue Architecture & Pricing Strategy</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPriceModalOpen(false)} 
                className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Suite Body */}
            <div className="p-12 overflow-y-auto flex-grow custom-scrollbar bg-slate-50/30 dark:bg-slate-900/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {CREDIT_PACKS.map((pack) => {
                  const currentPrice = localConfig.packPrices[pack.id];
                  const pricePerCredit = (currentPrice / pack.credits).toFixed(2);
                  const starterPricePerCredit = (localConfig.packPrices['small'] / 50);
                  const savings = starterPricePerCredit > 0 ? (100 - (Number(pricePerCredit) / starterPricePerCredit * 100)).toFixed(0) : 0;

                  return (
                    <div 
                      key={pack.id} 
                      className={`relative bg-white dark:bg-slate-800 p-10 rounded-[3rem] border-2 transition-all group hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between ${pack.popular ? 'border-amber-500/30 shadow-xl' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                      {pack.popular && (
                        <div className="absolute top-6 right-8 bg-amber-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                          MOST STRATEGIC
                        </div>
                      )}
                      
                      <div className="mb-10">
                        <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4">Pack Definition</div>
                        <h3 className="text-3xl font-black dark:text-white mb-2 tracking-tighter">{pack.name}</h3>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">{pack.credits} Active Nodes</div>
                        
                        <div className="space-y-6">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Market Price (PKR)</label>
                             <div className="relative">
                               <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">₨</span>
                               <input 
                                 type="number" 
                                 value={currentPrice} 
                                 onChange={(e) => handlePackPriceChange(pack.id, Number(e.target.value))} 
                                 className="w-full pl-14 pr-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-black text-2xl focus:border-amber-500 transition-all shadow-sm" 
                               />
                             </div>
                           </div>
                        </div>
                      </div>

                      {/* Strategy Insights */}
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4">
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                           <span>Cost / Node</span>
                           <span className="text-amber-500">PKR {pricePerCredit}</span>
                         </div>
                         <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (Number(pricePerCredit) / 10) * 100)}%` }}></div>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Cluster Efficiency</span>
                            {Number(savings) > 0 ? (
                              <span className="text-[9px] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase">-{savings}% Optimal</span>
                            ) : (
                              <span className="text-[9px] font-black text-slate-400 uppercase">Baseline</span>
                            )}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advanced Controls Placeholder */}
              <div className="mt-12 p-10 bg-slate-900 text-white rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                       <h3 className="text-2xl font-black tracking-tighter mb-4 flex items-center">
                         <svg className="w-8 h-8 mr-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                         Global Profit Thresholds
                       </h3>
                       <p className="text-slate-400 text-sm font-medium leading-relaxed">
                         Adjust the minimum threshold for node generation actions. Increasing this value will protect your AI API budget during periods of high traffic but may decrease user engagement.
                       </p>
                    </div>
                    <div className="w-full md:w-80 space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Min Cost Per Action</label>
                       <input 
                         type="number" 
                         value={localConfig.aiCostPerAction} 
                         onChange={(e) => setLocalConfig({...localConfig, aiCostPerAction: Number(e.target.value)})} 
                         className="w-full px-8 py-5 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white font-black text-xl outline-none focus:border-amber-500 transition-all" 
                       />
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-10 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 flex justify-end items-center space-x-8">
               <div className="flex items-center space-x-4 opacity-50">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing engine online</span>
               </div>
               <button 
                  onClick={handleSave} 
                  className="bg-amber-500 text-white px-20 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
               >
                  Optimize Revenue Index
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. WHITE-LABEL BUNDLER MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b dark:border-slate-700 flex items-center justify-between bg-rose-50/20 dark:bg-rose-900/10">
              <div>
                <h2 className="text-4xl font-black dark:text-white tracking-tighter flex items-center">
                  <svg className="w-10 h-10 mr-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  SaaS Bundler
                </h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-2">White-label distribution system</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
              {exportStep === 'branding' && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-300">
                   <h3 className="text-2xl font-black dark:text-white flex items-center"><span className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center mr-4">01</span> Distribution Branding</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Name</label>
                        <input type="text" value={exportConfig.siteName} onChange={(e) => setExportConfig({...exportConfig, siteName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Price (PKR)</label>
                        <input type="number" value={exportConfig.licensePricePKR} onChange={(e) => setExportConfig({...exportConfig, licensePricePKR: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Identity Color</label>
                        <input type="color" value={exportConfig.themePrimary} onChange={(e) => setExportConfig({...exportConfig, themePrimary: e.target.value})} className="w-full h-14 rounded-2xl border-2 border-slate-50 dark:border-slate-700 cursor-pointer" />
                      </div>
                   </div>
                   <button onClick={() => setExportStep('business')} className="w-full bg-primary text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-primary/20">Next: Logic Isolation</button>
                </div>
              )}
              {exportStep === 'business' && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-300">
                   <h3 className="text-2xl font-black dark:text-white flex items-center"><span className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center mr-4">02</span> Isolated Logic</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New JazzCash No.</label>
                        <input type="text" value={exportConfig.jazzCashNumber} onChange={(e) => setExportConfig({...exportConfig, jazzCashNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Easypaisa No.</label>
                        <input type="text" value={exportConfig.easypaisaNumber} onChange={(e) => setExportConfig({...exportConfig, easypaisaNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                      </div>
                   </div>
                   <div className="p-8 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl border border-rose-100/50 dark:border-rose-700/30 text-xs font-bold text-rose-600 leading-relaxed">
                     ⚠️ All original Master Keys and Admin Secrets will be stripped and regenerated for the safety of this distribution bundle.
                   </div>
                   <div className="flex space-x-4">
                     <button onClick={() => setExportStep('branding')} className="px-10 py-5 font-black text-slate-400 hover:text-slate-600">Back</button>
                     <button onClick={runExportSystem} className="flex-grow bg-slate-900 text-white py-5 rounded-3xl font-black text-xl shadow-2xl">Deploy Build Pipeline</button>
                   </div>
                </div>
              )}
              {exportStep === 'generating' && (
                <div className="py-24 text-center">
                   <div className="w-24 h-24 border-[10px] border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-10"></div>
                   <h3 className="text-3xl font-black dark:text-white">Isolating RSA Framework...</h3>
                </div>
              )}
              {exportStep === 'success' && (
                <div className="py-12 text-center animate-in zoom-in duration-500">
                   <div className="w-32 h-32 bg-green-500 text-white rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
                     <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <h3 className="text-5xl font-black dark:text-white mb-6 tracking-tighter">Cluster Packed!</h3>
                   <button onClick={() => setIsExportModalOpen(false)} className="bg-slate-900 text-white px-16 py-6 rounded-3xl font-black text-xl hover:scale-105 transition-transform">Command Dashboard</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Card 01: Platform Identity & Theme Setup */}
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-2xl font-black mb-12 flex items-center dark:text-white"><span className="w-12 h-12 rounded-2xl bg-secondary text-white mr-6 flex items-center justify-center text-sm font-black">01</span>Platform Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Platform Name</label>
                <input type="text" value={localConfig.siteName} onChange={(e) => setLocalConfig({...localConfig, siteName: e.target.value})} className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xl outline-none" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">License PKR</label>
                <input type="number" value={localConfig.licensePricePKR} onChange={(e) => setLocalConfig({...localConfig, licensePricePKR: Number(e.target.value)})} className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xl outline-none" />
              </div>
              
              {/* Theme Setup System */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Primary Theme Color</label>
                <div className="flex space-x-4">
                   <input type="color" value={localConfig.themePrimary} onChange={(e) => setLocalConfig({...localConfig, themePrimary: e.target.value})} className="h-14 w-24 rounded-2xl cursor-pointer shadow-sm border border-slate-100" />
                   <input type="text" value={localConfig.themePrimary} onChange={(e) => setLocalConfig({...localConfig, themePrimary: e.target.value})} className="flex-grow px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-slate-700 dark:text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Secondary Theme Color</label>
                <div className="flex space-x-4">
                   <input type="color" value={localConfig.themeSecondary} onChange={(e) => setLocalConfig({...localConfig, themeSecondary: e.target.value})} className="h-14 w-24 rounded-2xl cursor-pointer shadow-sm border border-slate-100" />
                   <input type="text" value={localConfig.themeSecondary} onChange={(e) => setLocalConfig({...localConfig, themeSecondary: e.target.value})} className="flex-grow px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-slate-700 dark:text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 02: Improved Merchant Gateway Configuration */}
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-2xl font-black mb-12 flex items-center dark:text-white"><span className="w-12 h-12 rounded-2xl bg-green-500 text-white mr-6 flex items-center justify-center text-sm font-black">02</span>Merchant Gateway</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">JazzCash Node</label>
                <input type="text" value={localConfig.jazzCashNumber} onChange={(e) => setLocalConfig({...localConfig, jazzCashNumber: e.target.value})} className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Easypaisa Node</label>
                <input type="text" value={localConfig.easypaisaNumber} onChange={(e) => setLocalConfig({...localConfig, easypaisaNumber: e.target.value})} className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold" />
              </div>
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Bank Transfer Node (Full Details)</label>
                <input type="text" value={localConfig.bankAccount} onChange={(e) => setLocalConfig({...localConfig, bankAccount: e.target.value})} className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold" placeholder="Bank Name - Account Title - Account Number" />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Gateway Instructions (Buyer Guidelines)</label>
                <textarea value={localConfig.paymentInstructions} onChange={(e) => setLocalConfig({...localConfig, paymentInstructions: e.target.value})} className="w-full px-8 py-5 rounded-3xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold h-32 resize-none" />
              </div>
            </div>
            <div className="mt-12 flex items-center justify-between">
              {message && <span className="text-primary font-black animate-pulse">{message}</span>}
              <button onClick={handleSave} className="bg-secondary dark:bg-primary text-white px-14 py-5 rounded-3xl font-black shadow-2xl ml-auto hover:scale-105 transition-transform">Synchronize Cluster</button>
            </div>
          </div>

          {/* Card 03: Master Keys */}
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm">
             <div className="flex items-center justify-between mb-12">
               <h2 className="text-2xl font-black text-slate-900 dark:text-white">Active Master Keys</h2>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{localConfig.generatedKeys.length} Circulating</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localConfig.generatedKeys.map((key, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-50 dark:border-slate-700 group hover:border-primary/20 transition-all">
                    <span className="font-mono font-black text-sm tracking-widest">{key}</span>
                    <button onClick={() => deleteKey(key)} className="text-red-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <div className="bg-secondary dark:bg-slate-950 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden transition-all border border-transparent dark:border-slate-800">
             <div className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 mb-4">Total Revenue Ledger</div>
             <div className="text-7xl font-black mb-12 tracking-tighter">PKR {totalRevenue}</div>
             <div className="space-y-6">
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-5">
                  <span className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Total Events</span>
                  <span className="font-black text-primary text-xl">{sales.length}</span>
                </div>
             </div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
             <h3 className="text-xl font-black mb-10 px-2 uppercase text-[10px] tracking-[0.4em] text-slate-400">Transaction Pulse</h3>
             <div className="space-y-8 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">
                {sales.length === 0 && <p className="text-center py-20 opacity-20 italic">No incoming data detected.</p>}
                {sales.slice().reverse().map((sale, i) => (
                  <div key={i} className="flex items-start space-x-6 p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-[2.5rem] transition-all group">
                     <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 shadow-sm ${sale.type === 'license' ? 'bg-blue-100 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                        <span className="text-[10px] font-black uppercase">{sale.type === 'license' ? 'LIC' : 'CRD'}</span>
                     </div>
                     <div className="flex-grow min-w-0">
                        <div className="text-xl font-black dark:text-white tracking-tighter">PKR {sale.amount}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate uppercase mt-1 tracking-widest">{sale.transactionId}</div>
                        <div className="text-[9px] text-slate-300 font-bold mt-2">{new Date(sale.timestamp).toLocaleString()}</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
