
import React, { useState, useRef, useEffect } from 'react';
import { PlatformConfig, SalesRecord, PageSEO, AIProvider, GlobalSEO } from '../types';
import { storageService } from '../services/storageService';
import { supabaseService } from '../services/supabaseService';
import { GoogleGenAI } from "@google/genai";
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
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [localConfig, setLocalConfig] = useState<PlatformConfig>(config);
  const [sales] = useState<SalesRecord[]>(storageService.getSalesHistory());
  const [message, setMessage] = useState('');
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // AI Security Vault Extension State
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');

  // SEO Suite State
  const [selectedSeoPage, setSelectedSeoPage] = useState<string>('home');

  // Keep local config in sync with prop config if no local edits are pending
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalConfig(config);
    }
  }, [config, hasUnsavedChanges]);

  // Decrypt AI Key for editing when modal opens
  useEffect(() => {
    const decryptKey = async () => {
      if (isAiModalOpen && localConfig.ai.apiKey) {
        try {
          const key = await securityService.decrypt(localConfig.ai.apiKey, localConfig.signingSecret);
          setTempApiKey(key);
        } catch (e) {
          setTempApiKey('');
        }
      } else if (isAiModalOpen) {
        setTempApiKey('');
      }
    };
    decryptKey();
  }, [isAiModalOpen]);

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
    
    // Encrypt temporary API key before final save
    const finalAiConfig = { ...localConfig.ai };
    if (tempApiKey && finalAiConfig.provider !== 'gemini') {
      finalAiConfig.apiKey = await securityService.encrypt(tempApiKey, localConfig.signingSecret);
    } else if (finalAiConfig.provider === 'gemini') {
      delete finalAiConfig.apiKey;
    }

    const finalConfig = { ...localConfig, ai: finalAiConfig };

    // 1. Update Parent/Local State (LocalStorage persistence)
    onUpdateConfig(finalConfig);
    
    // 2. Sync to Supabase Cloud (Database persistence)
    const success = await supabaseService.saveConfig(finalConfig);

    if (success) {
      setMessage('Cloud synchronization complete!');
      setHasUnsavedChanges(false);
    } else {
      setMessage('Saved locally, but Cloud sync failed.');
    }

    setIsPriceModalOpen(false);
    setIsSeoModalOpen(false);
    setIsAiModalOpen(false);
    setIsSavingToCloud(false);
    setTestResult(null);
    
    setTimeout(() => setMessage(''), 3000);
  };

  const testAiConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const testAiConfig = { ...localConfig.ai };
      if (tempApiKey) {
        testAiConfig.apiKey = await securityService.encrypt(tempApiKey, localConfig.signingSecret);
      }
      
      const ai = new AiService(testAiConfig, localConfig.signingSecret);
      const result = await ai.generateContent("Reply with 'ACK'.", "Handshake test.");

      if (result) {
        setTestResult({ success: true, message: `Connected to ${testAiConfig.provider} (${testAiConfig.model}) successfully.` });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Connection failed. Check provider settings." });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const generateNewKey = () => {
    const prefix = 'PK';
    const segment = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const newKey = `${prefix}-${segment()}-${segment()}-${segment()}`;
    const updatedKeys = [...localConfig.generatedKeys, newKey];
    
    const newConfig = { ...localConfig, generatedKeys: updatedKeys };
    
    setLocalConfig(newConfig);
    onUpdateConfig(newConfig);
    setHasUnsavedChanges(true);
    setMessage(`Generated: ${newKey}`);
    setIsDropdownOpen(false);
    setTimeout(() => setMessage('Note: Click "Push to Cloud" to save permanently!'), 3000);
  };

  const deleteKey = (keyToDelete: string) => {
    if (!confirm('Permanently revoke this Master Key?')) return;
    const updatedKeys = localConfig.generatedKeys.filter(k => k !== keyToDelete);
    const newConfig = { ...localConfig, generatedKeys: updatedKeys };
    setLocalConfig(newConfig);
    onUpdateConfig(newConfig);
    setHasUnsavedChanges(true);
    setMessage('Key removed from local cluster.');
    setTimeout(() => setMessage(''), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage('Key copied to buffer!');
    setTimeout(() => setMessage(''), 2000);
  };

  const updatePageSeo = (page: string, data: Partial<PageSEO>) => {
    const newConfig = {
      ...localConfig,
      seo: {
        ...localConfig.seo,
        pages: {
          ...localConfig.seo.pages,
          [page]: { ...localConfig.seo.pages[page], ...data } as PageSEO
        }
      }
    };
    setLocalConfig(newConfig);
    setHasUnsavedChanges(true);
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);

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
      {message && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl animate-in slide-in-from-top-4">
          {message}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
        <div>
          <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">Command Center</h1>
          <div className="flex items-center space-x-3">
            <span className={`w-2.5 h-2.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-500 animate-bounce' : 'bg-green-500 animate-pulse'}`}></span>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">
              {hasUnsavedChanges ? 'Node Cluster: Local Changes Pending Sync' : 'Node Cluster: Secure & Synchronized'}
            </p>
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
                 Generate License Key
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
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Identity Section */}
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
            <h2 className="text-2xl font-black mb-12 flex items-center dark:text-white"><span className="w-12 h-12 rounded-2xl bg-secondary text-white mr-6 flex items-center justify-center text-sm font-black">01</span>Platform Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Platform Name</label>
                <input 
                  type="text" 
                  value={localConfig.siteName} 
                  onChange={(e) => { setLocalConfig({...localConfig, siteName: e.target.value}); setHasUnsavedChanges(true); }} 
                  className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xl outline-none" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">License PKR</label>
                <input 
                  type="number" 
                  value={localConfig.licensePricePKR} 
                  onChange={(e) => { setLocalConfig({...localConfig, licensePricePKR: Number(e.target.value)}); setHasUnsavedChanges(true); }} 
                  className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xl outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Master Key Section */}
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all relative overflow-hidden">
            {hasUnsavedChanges && (
               <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black px-4 py-1 uppercase tracking-widest z-10 shadow-sm">
                 Local Changes Pending Cloud Sync
               </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
              <h2 className="text-2xl font-black flex items-center dark:text-white">
                <span className="w-12 h-12 rounded-2xl bg-blue-500 text-white mr-6 flex items-center justify-center text-sm font-black text-shadow-sm">02</span>
                License Authority
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{localConfig.generatedKeys.length} ACTIVE CLUSTERS</span>
                <button 
                  onClick={generateNewKey}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Generate Key
                </button>
              </div>
            </div>

            {localConfig.generatedKeys.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {localConfig.generatedKeys.map((key, index) => (
                  <div key={index} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all shadow-sm">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">AUTHORIZATION KEY</span>
                      <span className="font-mono text-sm font-bold tracking-widest text-slate-800 dark:text-white truncate">{key}</span>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={() => copyToClipboard(key)}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </button>
                      <button 
                        onClick={() => deleteKey(key)}
                        className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <p className="text-slate-400 font-bold text-sm">No master keys currently authorized.</p>
              </div>
            )}
          </div>

          {/* Gateway Section */}
          <div className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-all">
            <h2 className="text-2xl font-black mb-12 flex items-center dark:text-white"><span className="w-12 h-12 rounded-2xl bg-green-500 text-white mr-6 flex items-center justify-center text-sm font-black">03</span>Merchant Gateway</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">JazzCash Node</label>
                <input 
                  type="text" 
                  value={localConfig.jazzCashNumber} 
                  onChange={(e) => { setLocalConfig({...localConfig, jazzCashNumber: e.target.value}); setHasUnsavedChanges(true); }} 
                  className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Easypaisa Node</label>
                <input 
                  type="text" 
                  value={localConfig.easypaisaNumber} 
                  onChange={(e) => { setLocalConfig({...localConfig, easypaisaNumber: e.target.value}); setHasUnsavedChanges(true); }} 
                  className="w-full px-8 py-5 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold" 
                />
              </div>
            </div>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-end gap-4">
              {hasUnsavedChanges && (
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                  Unsaved changes detected in your cluster!
                </p>
              )}
              <button 
                onClick={handleSave} 
                disabled={isSavingToCloud}
                className={`${hasUnsavedChanges ? 'bg-amber-500' : 'bg-secondary dark:bg-primary'} text-white px-14 py-5 rounded-3xl font-black shadow-2xl hover:scale-105 transition-all flex items-center justify-center min-w-[200px]`}
              >
                {isSavingToCloud ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    Syncing Cloud...
                  </>
                ) : hasUnsavedChanges ? 'Push to Cloud Cluster' : 'Synchronize Cluster'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-secondary dark:bg-slate-950 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden transition-all">
             <div className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30 mb-4">Total Revenue Ledger</div>
             <div className="text-7xl font-black mb-12 tracking-tighter">PKR {totalRevenue}</div>
             <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* AI Security Vault Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-[95vw] sm:max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative max-h-[95vh] transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
            
            <div className="p-5 sm:p-10 border-b dark:border-slate-800 flex items-center justify-between bg-indigo-50/20 dark:bg-indigo-900/10 shrink-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-indigo-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl sm:text-3xl font-black dark:text-white tracking-tighter">AI Security Vault</h2>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Encrypted Storage Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { setIsAiModalOpen(false); setTestResult(null); }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 sm:p-10 space-y-6 sm:space-y-10 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Provider Selection</label>
                    <select 
                      value={localConfig.ai.provider} 
                      onChange={(e) => { setLocalConfig({...localConfig, ai: {...localConfig.ai, provider: e.target.value as AIProvider}}); setHasUnsavedChanges(true); }}
                      className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all shadow-sm"
                    >
                      <option value="gemini">Google Gemini (System Key)</option>
                      <option value="openai">OpenAI (Custom Key)</option>
                      <option value="deepseek">DeepSeek (Custom Key)</option>
                      <option value="openrouter">OpenRouter (Custom Key)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Model ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. gpt-4o, gemini-3-pro-preview" 
                      value={localConfig.ai.model} 
                      onChange={(e) => { setLocalConfig({...localConfig, ai: {...localConfig.ai, model: e.target.value}}); setHasUnsavedChanges(true); }} 
                      className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold text-sm outline-none focus:border-indigo-500 transition-all shadow-sm" 
                    />
                  </div>
                </div>

                {localConfig.ai.provider !== 'gemini' && (
                  <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{localConfig.ai.provider.toUpperCase()} API Key (Encrypted)</label>
                    <input 
                      type="password" 
                      placeholder="Enter Provider Key..." 
                      value={tempApiKey} 
                      onChange={(e) => { setTempApiKey(e.target.value); setHasUnsavedChanges(true); }} 
                      className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-mono text-sm outline-none focus:border-indigo-500 transition-all shadow-sm" 
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Global System Instruction</label>
                  <textarea 
                    placeholder="Personality instruction for the AI..." 
                    value={localConfig.ai.systemInstruction} 
                    onChange={(e) => { setLocalConfig({...localConfig, ai: {...localConfig.ai, systemInstruction: e.target.value}}); setHasUnsavedChanges(true); }} 
                    className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold text-sm h-32 resize-none outline-none focus:border-indigo-500 transition-all shadow-sm" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reasoning Flux</div>
                      <div className="text-xs font-bold dark:text-white">Thinking Budget</div>
                    </div>
                    <input 
                      type="number"
                      value={localConfig.ai.thinkingBudget || 0}
                      onChange={(e) => { setLocalConfig({...localConfig, ai: {...localConfig.ai, thinkingBudget: Number(e.target.value)}}); setHasUnsavedChanges(true); }}
                      className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-black text-indigo-500"
                    />
                  </div>
                  
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-center space-y-3">
                    <button 
                      onClick={testAiConnection}
                      disabled={isTestingConnection}
                      className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center"
                    >
                      {isTestingConnection ? "Testing..." : "Test Neural Link"}
                    </button>
                    {testResult && (
                      <div className={`text-[9px] font-black text-center uppercase tracking-widest ${testResult.success ? 'text-green-500' : 'text-red-500'}`}>
                        {testResult.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-10 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-800 flex justify-end shrink-0">
              <button 
                onClick={handleSave} 
                className="w-full sm:w-auto bg-indigo-500 text-white px-10 sm:px-14 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Seal & Sync Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEO Strategy Suite Modal */}
      {isSeoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-[95vw] sm:max-w-4xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative max-h-[95vh]">
            <div className="p-5 sm:p-10 border-b dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl sm:text-3xl font-black dark:text-white tracking-tighter">SEO Strategy Suite</h2>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Metadata Control</p>
              </div>
              <button onClick={() => setIsSeoModalOpen(false)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-5 sm:p-10 overflow-y-auto space-y-8 flex-grow custom-scrollbar">
              <div className="flex flex-wrap gap-2 sm:gap-3 p-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                {Object.keys(localConfig.seo.pages).map(page => (
                  <button 
                    key={page}
                    onClick={() => setSelectedSeoPage(page)}
                    className={`px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${selectedSeoPage === page ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {selectedSeoPage && localConfig.seo.pages[selectedSeoPage] && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 animate-in fade-in duration-300">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display Title</label>
                      <input 
                        type="text" 
                        value={localConfig.seo.pages[selectedSeoPage].title}
                        onChange={(e) => updatePageSeo(selectedSeoPage, { title: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold text-sm outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Page Keywords (Comma Separated)</label>
                      <input 
                        type="text" 
                        value={localConfig.seo.pages[selectedSeoPage].keywords}
                        onChange={(e) => updatePageSeo(selectedSeoPage, { keywords: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold text-sm outline-none focus:border-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Meta Description</label>
                      <textarea 
                        value={localConfig.seo.pages[selectedSeoPage].description}
                        onChange={(e) => updatePageSeo(selectedSeoPage, { description: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white h-32 resize-none font-bold text-sm outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Social Sharing (OG) Title</label>
                      <input 
                        type="text" 
                        value={localConfig.seo.pages[selectedSeoPage].ogTitle}
                        onChange={(e) => updatePageSeo(selectedSeoPage, { ogTitle: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">OG Image URL</label>
                      <input 
                        type="text" 
                        value={localConfig.seo.pages[selectedSeoPage].ogImage}
                        onChange={(e) => updatePageSeo(selectedSeoPage, { ogImage: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white font-bold text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Social Description</label>
                      <textarea 
                        value={localConfig.seo.pages[selectedSeoPage].ogDescription}
                        onChange={(e) => updatePageSeo(selectedSeoPage, { ogDescription: e.target.value })}
                        className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:text-white h-32 resize-none font-bold text-sm outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-10 border-t dark:border-slate-800 flex justify-end shrink-0">
              <button onClick={handleSave} className="w-full sm:w-auto bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all text-lg">Synchronize SEO Strategy</button>
            </div>
          </div>
        </div>
      )}

      {/* Pack Optimization Modal */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col relative max-h-[90vh]">
            <div className="p-8 sm:p-12 border-b dark:border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-3xl font-black dark:text-white tracking-tighter">Pack Optimization</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit Pricing Matrix</p>
              </div>
              <button onClick={() => setIsPriceModalOpen(false)} className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 sm:p-12 space-y-6 overflow-y-auto custom-scrollbar">
              {Object.entries(localConfig.packPrices).map(([id, price]) => (
                <div key={id} className="flex flex-col sm:flex-row items-center justify-between p-8 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group hover:border-amber-500/30 transition-all gap-6">
                  <div className="text-center sm:text-left">
                    <span className="font-black uppercase tracking-[0.2em] text-slate-400 text-[10px] mb-2 block">Credit Cluster</span>
                    <span className="text-xl font-black dark:text-white capitalize">{id} Pack Deployment</span>
                  </div>
                  <div className="flex items-center space-x-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                    <span className="text-slate-400 font-black text-xs">PKR</span>
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => { setLocalConfig({...localConfig, packPrices: {...localConfig.packPrices, [id]: Number(e.target.value)}}); setHasUnsavedChanges(true); }}
                      className="w-32 bg-transparent text-slate-900 dark:text-white font-black text-2xl text-right outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 sm:p-12 border-t dark:border-slate-800 flex justify-end shrink-0">
              <button onClick={handleSave} className="w-full sm:w-auto bg-amber-500 text-white px-14 py-5 rounded-3xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-xl">Deploy New Pricing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
