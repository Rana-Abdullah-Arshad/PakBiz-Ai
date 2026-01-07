
import React, { useState, useRef, useEffect } from 'react';
import { PlatformConfig, SalesRecord, PageSEO, AIProvider, GlobalSEO } from '../types';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { securityService } from '../services/securityService';
import { AiService } from '../services/aiService';

interface AdminProps {
  config: PlatformConfig;
  onUpdateConfig: (config: PlatformConfig) => void;
}

const Admin: React.FC<AdminProps> = ({ config, onUpdateConfig }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'prices' | 'seo' | 'ai' | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localConfig, setLocalConfig] = useState<PlatformConfig>(config);
  const [sales] = useState<SalesRecord[]>(storageService.getSalesHistory());
  const [message, setMessage] = useState('');
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // AI Security Vault State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');

  // SEO Suite State
  const [selectedSeoPage, setSelectedSeoPage] = useState<string>('home');
  const [seoTab, setSeoTab] = useState<'global' | 'pages'>('pages');

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalConfig(config);
    }
  }, [config, hasUnsavedChanges]);

  // Handle AI Key Decryption
  useEffect(() => {
    const decryptKey = async () => {
      if (activeModal === 'ai' && localConfig.ai.apiKey) {
        try {
          const key = await securityService.decrypt(localConfig.ai.apiKey, localConfig.signingSecret);
          setTempApiKey(key);
        } catch (e) {
          setTempApiKey('');
        }
      } else if (activeModal === 'ai') {
        setTempApiKey('');
      }
    };
    decryptKey();
  }, [activeModal]);

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
    setIsSavingToCloud(true);
    
    const finalAiConfig = { ...localConfig.ai };
    if (tempApiKey && finalAiConfig.provider !== 'gemini') {
      finalAiConfig.apiKey = await securityService.encrypt(tempApiKey, localConfig.signingSecret);
    } else if (finalAiConfig.provider === 'gemini') {
      delete finalAiConfig.apiKey;
    }

    const finalConfig = { ...localConfig, ai: finalAiConfig };
    onUpdateConfig(finalConfig);
    const success = await supabaseService.saveConfig(finalConfig);

    if (success) {
      setMessage('Cloud synchronization complete!');
      setHasUnsavedChanges(false);
    } else {
      setMessage('Saved locally, but Cloud sync failed.');
    }

    setActiveModal(null);
    setIsSavingToCloud(false);
    setTestResult(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const testAiConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const testAiConfig = { ...localConfig.ai };
      if (tempApiKey && testAiConfig.provider !== 'gemini') {
        testAiConfig.apiKey = await securityService.encrypt(tempApiKey, localConfig.signingSecret);
      }
      const ai = new AiService(testAiConfig, localConfig.signingSecret);
      const result = await ai.generateContent("Reply with 'ACK'.", "Handshake test.");
      if (result) setTestResult({ success: true, message: `Connected to ${testAiConfig.provider} successfully.` });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Connection failed." });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const updateGlobalSeo = (data: Partial<GlobalSEO>) => {
    setLocalConfig({
      ...localConfig,
      seo: { ...localConfig.seo, global: { ...localConfig.seo.global, ...data } }
    });
    setHasUnsavedChanges(true);
  };

  const updatePageSeo = (page: string, data: Partial<PageSEO>) => {
    setLocalConfig({
      ...localConfig,
      seo: {
        ...localConfig.seo,
        pages: {
          ...localConfig.seo.pages,
          [page]: { ...localConfig.seo.pages[page], ...data } as PageSEO
        }
      }
    });
    setHasUnsavedChanges(true);
  };

  const generateNewKey = () => {
    const newKey = `PK-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setLocalConfig({ ...localConfig, generatedKeys: [...localConfig.generatedKeys, newKey] });
    setHasUnsavedChanges(true);
    setMessage(`Key Generated: ${newKey}`);
    setIsDropdownOpen(false);
  };

  const copyKeyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setMessage('Key Secured to Buffer!');
    setTimeout(() => {
      setCopiedKey(null);
      setMessage('');
    }, 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl text-center">
          <div className="w-20 h-20 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-3xl font-black mb-6 tracking-tighter">Admin Access</h1>
          <form onSubmit={handleAuth} className="space-y-6">
            <input 
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="••••••••"
              className="w-full px-6 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 focus:border-primary outline-none text-center font-black tracking-widest bg-slate-50 dark:bg-slate-900"
            />
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg">Verify Key</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      {message && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white px-6 py-2 rounded-full font-black text-xs shadow-xl">{message}</div>}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-2">Command Center</h1>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {hasUnsavedChanges ? 'Changes Pending Sync' : 'System Secure'}
            </span>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-secondary text-white px-8 py-4 rounded-2xl font-black flex items-center justify-between w-full lg:w-auto shadow-xl"
          >
            Manage Modules
            <svg className={`w-5 h-5 ml-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-4 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border dark:border-slate-700 py-4 z-50 overflow-hidden">
              <button onClick={() => { setActiveModal('ai'); setIsDropdownOpen(false); }} className="w-full px-6 py-4 text-left flex items-center hover:bg-slate-50 dark:hover:bg-slate-700 font-bold border-b dark:border-slate-700">
                <svg className="w-5 h-5 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI Security Vault
              </button>
              <button onClick={() => { setActiveModal('seo'); setIsDropdownOpen(false); }} className="w-full px-6 py-4 text-left flex items-center hover:bg-slate-50 dark:hover:bg-slate-700 font-bold border-b dark:border-slate-700">
                <svg className="w-5 h-5 mr-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                SEO Strategy Suite
              </button>
              <button onClick={() => { setActiveModal('prices'); setIsDropdownOpen(false); }} className="w-full px-6 py-4 text-left flex items-center hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">
                <svg className="w-5 h-5 mr-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Pack Optimization
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Identity Hub */}
          <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[3rem] border dark:border-slate-700 shadow-sm">
            <h2 className="text-2xl font-black mb-10 flex items-center">
              <span className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mr-4">01</span>
              Platform Hub
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Site Name</label>
                <input type="text" value={localConfig.siteName} onChange={(e) => { setLocalConfig({...localConfig, siteName: e.target.value}); setHasUnsavedChanges(true); }} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">License (PKR)</label>
                <input type="number" value={localConfig.licensePricePKR} onChange={(e) => { setLocalConfig({...localConfig, licensePricePKR: Number(e.target.value)}); setHasUnsavedChanges(true); }} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Admin Secret Access Key</label>
                <input 
                  type="text" 
                  value={localConfig.adminSecret} 
                  onChange={(e) => { setLocalConfig({...localConfig, adminSecret: e.target.value}); setHasUnsavedChanges(true); }} 
                  placeholder="The master password for this panel..."
                  className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold text-primary" 
                />
              </div>
            </div>
          </div>

          {/* Merchant Gateway */}
          <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[3rem] border dark:border-slate-700 shadow-sm">
            <h2 className="text-2xl font-black mb-10 flex items-center">
              <span className="w-10 h-10 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mr-4">02</span>
              Merchant Gateway Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">JazzCash Node</label>
                <input type="text" value={localConfig.jazzCashNumber} onChange={(e) => { setLocalConfig({...localConfig, jazzCashNumber: e.target.value}); setHasUnsavedChanges(true); }} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Easypaisa Node</label>
                <input type="text" value={localConfig.easypaisaNumber} onChange={(e) => { setLocalConfig({...localConfig, easypaisaNumber: e.target.value}); setHasUnsavedChanges(true); }} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Bank Account Node (Details)</label>
                <input type="text" value={localConfig.bankAccount} onChange={(e) => { setLocalConfig({...localConfig, bankAccount: e.target.value}); setHasUnsavedChanges(true); }} placeholder="e.g. HBL - 1234567890123" className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Custom Payment Instructions</label>
                <textarea value={localConfig.paymentInstructions} onChange={(e) => { setLocalConfig({...localConfig, paymentInstructions: e.target.value}); setHasUnsavedChanges(true); }} placeholder="Steps for the customer..." className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold h-32 resize-none" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={isSavingToCloud} className="bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
                {isSavingToCloud ? 'Syncing...' : 'Synchronize Hub'}
              </button>
            </div>
          </div>

          {/* Key Management */}
          <div className="bg-white dark:bg-slate-800 p-8 sm:p-12 rounded-[3rem] border dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black flex items-center">
                <span className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mr-4">03</span>
                License Clusters
              </h2>
              <button onClick={generateNewKey} className="text-blue-500 text-[10px] font-black uppercase tracking-widest border-2 border-blue-500/20 px-4 py-2 rounded-xl hover:bg-blue-500 hover:text-white transition-all">+ New Key</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {localConfig.generatedKeys.map((key, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-2xl group transition-all hover:border-blue-500/30">
                  <span className="font-mono text-xs font-bold truncate mr-4">{key}</span>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button 
                      onClick={() => copyKeyToClipboard(key)}
                      className={`p-2 rounded-lg transition-all ${copiedKey === key ? 'text-green-500 bg-green-500/10 scale-110' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      title="Copy Key"
                    >
                      {copiedKey === key ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002-2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      )}
                    </button>
                    <button 
                      onClick={() => setLocalConfig({...localConfig, generatedKeys: localConfig.generatedKeys.filter(k => k !== key)})} 
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Revoke Key"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales Stats */}
        <div className="bg-secondary text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden h-fit">
          <div className="relative z-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Total Revenue Ledger</h3>
            <div className="text-6xl font-black tracking-tighter mb-8">PKR {sales.reduce((acc, s) => acc + s.amount, 0)}</div>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-4"><span>Licenses Sold</span><span>{sales.filter(s => s.type === 'license').length}</span></div>
              <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-4"><span>Credit Packs Sold</span><span>{sales.filter(s => s.type === 'credits').length}</span></div>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* SEO Suite Modal */}
      {activeModal === 'seo' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
          <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-emerald-50/20">
              <h2 className="text-3xl font-black tracking-tighter">SEO Strategy Suite</h2>
              <button onClick={() => setActiveModal(null)} className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
              <div className="flex p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mb-8">
                <button onClick={() => setSeoTab('pages')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${seoTab === 'pages' ? 'bg-white dark:bg-slate-700 shadow-md text-emerald-500' : 'text-slate-400'}`}>PAGE CONTENT</button>
                <button onClick={() => setSeoTab('global')} className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${seoTab === 'global' ? 'bg-white dark:bg-slate-700 shadow-md text-emerald-500' : 'text-slate-400'}`}>GLOBAL STRATEGY</button>
              </div>

              {seoTab === 'pages' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(localConfig.seo.pages).map(p => (
                        <button key={p} onClick={() => setSelectedSeoPage(p)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedSeoPage === p ? 'border-emerald-500 text-emerald-500 bg-emerald-50/50' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>{p}</button>
                      ))}
                    </div>
                    {selectedSeoPage && (
                      <div className="space-y-6">
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Page Title</label><input type="text" value={localConfig.seo.pages[selectedSeoPage].title} onChange={(e) => updatePageSeo(selectedSeoPage, { title: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Meta Description</label><textarea value={localConfig.seo.pages[selectedSeoPage].description} onChange={(e) => updatePageSeo(selectedSeoPage, { description: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold h-24 resize-none" /></div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">OG Title</label><input type="text" value={localConfig.seo.pages[selectedSeoPage].ogTitle} onChange={(e) => updatePageSeo(selectedSeoPage, { ogTitle: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" /></div>
                           <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">OG Image URL</label><input type="text" value={localConfig.seo.pages[selectedSeoPage].ogImage} onChange={(e) => updatePageSeo(selectedSeoPage, { ogImage: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" /></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-8">
                     <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 border-b-2 border-emerald-500 w-fit pb-2">Real-time Preview</h3>
                     <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border dark:border-slate-800 space-y-10 shadow-inner">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase text-slate-400">Google Search Result</p>
                           <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm">
                              <p className="text-blue-600 dark:text-blue-400 text-xl font-medium mb-1 truncate">{localConfig.seo.pages[selectedSeoPage]?.title} {localConfig.seo.global.titleSuffix}</p>
                              <p className="text-green-700 dark:text-green-500 text-sm mb-2">https://pakbiz.ai/{selectedSeoPage}</p>
                              <p className="text-slate-500 text-sm line-clamp-2">{localConfig.seo.pages[selectedSeoPage]?.description}</p>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase text-slate-400">Social Share Card</p>
                           <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 overflow-hidden shadow-sm">
                              <img src={localConfig.seo.pages[selectedSeoPage]?.ogImage} className="w-full h-40 object-cover" alt="OG Preview" />
                              <div className="p-4 bg-slate-100 dark:bg-slate-800">
                                 <p className="text-xs uppercase font-black text-slate-400 mb-1">PAKBIZ.AI</p>
                                 <p className="font-bold text-base truncate">{localConfig.seo.pages[selectedSeoPage]?.ogTitle || localConfig.seo.pages[selectedSeoPage]?.title}</p>
                                 <p className="text-xs text-slate-500 line-clamp-1">{localConfig.seo.pages[selectedSeoPage]?.ogDescription || localConfig.seo.pages[selectedSeoPage]?.description}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Global Title Suffix</label><input type="text" value={localConfig.seo.global.titleSuffix} onChange={(e) => updateGlobalSeo({ titleSuffix: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Default Description</label><textarea value={localConfig.seo.global.defaultDescription} onChange={(e) => updateGlobalSeo({ defaultDescription: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 font-bold h-32 resize-none" /></div>
                   </div>
                   <div className="space-y-6">
                      <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-800 flex items-center justify-between">
                         <span className="font-bold text-sm">Enable JSON-LD Schema</span>
                         <button onClick={() => updateGlobalSeo({ enableSchema: !localConfig.seo.global.enableSchema })} className={`w-14 h-8 rounded-full transition-all relative ${localConfig.seo.global.enableSchema ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                           <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localConfig.seo.global.enableSchema ? 'right-1' : 'left-1'}`}></div>
                         </button>
                      </div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-800 flex items-center justify-between">
                         <span className="font-bold text-sm">Enable Robots.txt</span>
                         <button onClick={() => updateGlobalSeo({ enableRobots: !localConfig.seo.global.enableRobots })} className={`w-14 h-8 rounded-full transition-all relative ${localConfig.seo.global.enableRobots ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                           <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${localConfig.seo.global.enableRobots ? 'right-1' : 'left-1'}`}></div>
                         </button>
                      </div>
                   </div>
                </div>
              )}
            </div>
            <div className="p-8 border-t dark:border-slate-800 flex justify-end">
              <button onClick={handleSave} className="bg-emerald-500 text-white px-12 py-5 rounded-2xl font-black shadow-xl">Deploy SEO Strategy</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Security Vault Modal */}
      {activeModal === 'ai' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 flex flex-col">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-indigo-50/20">
              <h2 className="text-3xl font-black tracking-tighter">AI Security Vault</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-red-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">AI Provider</label><select value={localConfig.ai.provider} onChange={(e) => setLocalConfig({...localConfig, ai: {...localConfig.ai, provider: e.target.value as AIProvider}})} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-950 dark:border-slate-700 font-bold outline-none focus:border-indigo-500"><option value="gemini">Google Gemini (System)</option><option value="openai">OpenAI</option><option value="deepseek">DeepSeek</option><option value="openrouter">OpenRouter</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Model ID</label><input type="text" value={localConfig.ai.model} onChange={(e) => setLocalConfig({...localConfig, ai: {...localConfig.ai, model: e.target.value}})} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-950 dark:border-slate-700 font-bold" /></div>
               </div>
               {localConfig.ai.provider !== 'gemini' && (
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">API Key (Encrypted)</label><input type="password" value={tempApiKey} onChange={(e) => setTempApiKey(e.target.value)} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-950 dark:border-slate-700 font-mono text-sm" /></div>
               )}
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Thinking Budget</label><input type="number" value={localConfig.ai.thinkingBudget || 0} onChange={(e) => setLocalConfig({...localConfig, ai: {...localConfig.ai, thinkingBudget: Number(e.target.value)}})} className="w-full px-6 py-4 rounded-xl border-2 bg-slate-50 dark:bg-slate-950 dark:border-slate-700 font-bold" /></div>
                  <div className="flex flex-col justify-end"><button onClick={testAiConnection} disabled={isTestingConnection} className="py-4 bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">{isTestingConnection ? 'Testing...' : 'Test Neural Link'}</button></div>
               </div>
               {testResult && <p className={`text-center font-black text-xs uppercase tracking-widest ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>{testResult.message}</p>}
            </div>
            <div className="p-8 border-t dark:border-slate-800 flex justify-end">
              <button onClick={handleSave} className="bg-indigo-500 text-white px-12 py-5 rounded-2xl font-black shadow-xl">Seal & Sync Vault</button>
            </div>
          </div>
        </div>
      )}

      {/* Pack Optimization Modal */}
      {activeModal === 'prices' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 flex flex-col">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-amber-50/20">
              <h2 className="text-3xl font-black tracking-tighter">Pack Optimization</h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-red-500"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8 space-y-6">
              {Object.entries(localConfig.packPrices).map(([id, price]) => (
                <div key={id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border dark:border-slate-800">
                  <span className="font-black text-slate-500 uppercase text-xs">{id} Pack</span>
                  <div className="flex items-center bg-white dark:bg-slate-900 border dark:border-slate-700 px-4 py-2 rounded-xl">
                    <span className="text-slate-300 mr-2 text-xs font-black">PKR</span>
                    <input type="number" value={price} onChange={(e) => setLocalConfig({...localConfig, packPrices: {...localConfig.packPrices, [id]: Number(e.target.value)}})} className="w-24 text-right font-black text-lg bg-transparent" />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t dark:border-slate-800 flex justify-end">
              <button onClick={handleSave} className="bg-amber-500 text-white px-12 py-5 rounded-2xl font-black shadow-xl">Deploy Pricing Matrix</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
