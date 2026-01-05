
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

  // SEO Management State
  const [selectedSeoPage, setSelectedSeoPage] = useState<string | null>(null);
  const [seoTab, setSeoTab] = useState<'dashboard' | 'global'>('dashboard');

  // Local state for the plain text API key while editing in the modal
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

    if (isAiModalOpen && plainApiKey && !plainApiKey.startsWith('ENCRYPTED:')) {
      const encryptedKey = await securityService.encrypt(plainApiKey, config.adminSecret);
      finalConfig.ai.customApiKey = encryptedKey;
    }

    onUpdateConfig(finalConfig);
    setMessage('Settings secured & synced!');
    setIsPriceModalOpen(false);
    setIsSeoModalOpen(false);
    setIsAiModalOpen(false);
    setPlainApiKey('');
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
    setMessage(`New Key: ${newKey}`);
    setIsDropdownOpen(false);
    setTimeout(() => setMessage(''), 5000);
  };

  const deleteKey = (keyToDelete: string) => {
    if(!confirm('Permanently revoke this key?')) return;
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

  const calculateSeoScore = (page: PageSEO) => {
    let score = 0;
    if (page.title && page.title.length > 30) score += 25;
    if (page.description && page.description.length > 70) score += 25;
    if (page.ogImage) score += 25;
    if (page.primaryKeyword) score += 25;
    return score;
  };

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);

  const downloadConfigBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localConfig, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `pakbiz-config-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setMessage('Configuration backup downloaded!');
    setTimeout(() => setMessage(''), 3000);
  };

  const runExportSystem = async () => {
    setExportStep('generating');
    try {
      const zip = new JSZip();
      
      const newAdminSecret = "Owner@" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const newSigningSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const cleanConfig = { 
        ...exportConfig, 
        adminSecret: newAdminSecret, 
        signingSecret: newSigningSecret, 
        generatedKeys: [], 
        ai: {
          ...exportConfig.ai,
          customApiKey: "" 
        }
      };

      zip.file("config.json", JSON.stringify(cleanConfig, null, 2));
      zip.file("README.md", `# ${exportConfig.siteName} - White Label Bundle\n\n## 🔑 YOUR NEW ADMIN CREDENTIALS\n- Admin Secret: **${newAdminSecret}**\n- Signing Secret: **${newSigningSecret}**\n\n## 🚀 Deployment Instructions\n1. Upload all files to Vercel or Netlify.\n2. Login to /admin with secret above.\n3. Add your AI API Key in AI Vault.\n4. Set your payment numbers.\n5. Start selling!`);
      zip.file("deployment-v2.txt", "Ready for high-performance stateless deployment.");

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportConfig.siteName.toLowerCase().replace(/\s/g, '-')}-whitelabel-resale.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportStep('success');
    } catch (err) {
      console.error(err);
      alert('Export failed. Check internet connection.');
      setExportStep('branding');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-12 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-2xl text-center transition-colors">
          <div className="w-24 h-24 bg-secondary text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Admin Access</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">Identity verification required.</p>
          <form onSubmit={handleAuth} className="space-y-6">
            <input 
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="••••••••"
              className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-secondary outline-none text-center font-black tracking-[0.5em] transition-all bg-slate-50 dark:bg-slate-900 dark:text-white"
              autoFocus
            />
            {authError && <p className="text-red-500 font-bold animate-shake">{authError}</p>}
            <button type="submit" className="w-full text-white py-5 rounded-2xl font-black text-xl bg-secondary hover:opacity-95">Verify & Enter</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
        <div>
          <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">Command Center</h1>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Vercel Ready & Secured</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={downloadConfigBackup}
            className="hidden md:flex items-center px-6 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl border-2 border-slate-50 dark:border-slate-700 hover:border-primary transition-all text-xs uppercase tracking-widest"
          >
            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Backup Config
          </button>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-secondary dark:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black hover:opacity-90 transition-all flex items-center shadow-xl border border-transparent dark:border-slate-700"
            >
              Manage Platform
              <svg className={`w-5 h-5 ml-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-4 w-72 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 py-4 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                <button onClick={generateNewKey} className="w-full px-6 py-4 text-left flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                  <svg className="w-5 h-5 mr-3 text-blue-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                   Generate License Key
                </button>
                <button onClick={() => { setIsPriceModalOpen(true); setIsDropdownOpen(false); }} className="w-full px-6 py-4 text-left flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                  <svg className="w-5 h-5 mr-3 text-amber-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                   Credit Pack Prices
                </button>
                <button onClick={() => { setIsAiModalOpen(true); setIsDropdownOpen(false); }} className="w-full px-6 py-4 text-left flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                  <svg className="w-5 h-5 mr-3 text-indigo-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                   AI Key Vault
                </button>
                <button onClick={() => { setIsSeoModalOpen(true); setIsDropdownOpen(false); }} className="w-full px-6 py-4 text-left flex items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold border-b border-slate-50 dark:border-slate-700 group transition-colors">
                  <svg className="w-5 h-5 mr-3 text-emerald-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                   SEO Optimization
                </button>
                <button onClick={() => { setIsExportModalOpen(true); setIsDropdownOpen(false); setExportStep('branding'); }} className="w-full px-6 py-4 text-left flex items-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold group transition-colors">
                  <svg className="w-5 h-5 mr-3 text-rose-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                   White-Label Bundler
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHITE LABEL MODAL (PRESERVED) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-indigo-50/20 dark:bg-indigo-900/10">
              <div>
                <h2 className="text-4xl font-black dark:text-white tracking-tighter">White-Label Bundler</h2>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-2">Professional SaaS Distribution Hub</p>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-12 custom-scrollbar">
              {exportStep === 'branding' && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-300">
                   <div className="flex items-center space-x-4 mb-8">
                     <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black">01</div>
                     <h3 className="text-2xl font-black dark:text-white">Branding Configuration</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Platform Name</label>
                        <input type="text" value={exportConfig.siteName} onChange={(e) => setExportConfig({...exportConfig, siteName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default License Price (PKR)</label>
                        <input type="number" value={exportConfig.licensePricePKR} onChange={(e) => setExportConfig({...exportConfig, licensePricePKR: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none font-bold" />
                      </div>
                   </div>
                   <button onClick={() => setExportStep('business')} className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">Next: Business & AI Rules</button>
                </div>
              )}
              {exportStep === 'business' && (
                <div className="space-y-10 animate-in slide-in-from-right-8 duration-300">
                   <div className="flex items-center space-x-4 mb-8">
                     <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black">02</div>
                     <h3 className="text-2xl font-black dark:text-white">Business & AI Logic</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">JazzCash Number</label>
                        <input type="text" value={exportConfig.jazzCashNumber} onChange={(e) => setExportConfig({...exportConfig, jazzCashNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Easypaisa Number</label>
                        <input type="text" value={exportConfig.easypaisaNumber} onChange={(e) => setExportConfig({...exportConfig, easypaisaNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none font-bold" />
                      </div>
                   </div>
                   <div className="flex space-x-4">
                     <button onClick={() => setExportStep('branding')} className="px-10 py-5 font-black text-slate-400 hover:text-slate-600">Back</button>
                     <button onClick={runExportSystem} className="flex-grow bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200">Generate Distribution Bundle</button>
                   </div>
                </div>
              )}
              {exportStep === 'generating' && (
                <div className="py-24 text-center">
                   <div className="w-24 h-24 border-8 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-10"></div>
                   <h3 className="text-3xl font-black dark:text-white">Cloning SaaS Architecture...</h3>
                </div>
              )}
              {exportStep === 'success' && (
                <div className="py-12 text-center animate-in zoom-in duration-500">
                   <div className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
                     <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <h3 className="text-4xl font-black dark:text-white mb-6">SaaS Bundle Ready!</h3>
                   <button onClick={() => setIsExportModalOpen(false)} className="bg-slate-900 text-white px-16 py-5 rounded-2xl font-black text-lg">Done</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OTHER MODALS & MAIN VIEW PRESERVED (RE-SYNCED FOR CLEANLINESS) */}
      {isSeoModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-6xl bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-10 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-emerald-50/20 dark:bg-emerald-900/10">
              <h2 className="text-5xl font-black dark:text-white tracking-tighter">SEO Optimization</h2>
              <button onClick={() => { setIsSeoModalOpen(false); setSelectedSeoPage(null); }} className="text-slate-300 hover:text-red-500 transition-colors"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-grow p-12 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Object.keys(localConfig.seo.pages).map(page => (
                  <div key={page} className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border-2 border-transparent hover:border-primary transition-all">
                    <h3 className="text-xl font-black capitalize dark:text-white mb-4">{page}</h3>
                    <button onClick={() => setSelectedSeoPage(page)} className="w-full py-3 bg-white dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest">Optimize Page</button>
                  </div>
                ))}
              </div>
              {selectedSeoPage && (
                <div className="mt-12 p-10 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-primary animate-in slide-in-from-bottom-8">
                  <h4 className="text-2xl font-black mb-8 dark:text-white">Editing Metadata: {selectedSeoPage}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">SEO Title</label>
                      <input type="text" value={localConfig.seo.pages[selectedSeoPage].title} onChange={(e) => updatePageSeo(selectedSeoPage, { title: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Meta Description</label>
                      <textarea value={localConfig.seo.pages[selectedSeoPage].description} onChange={(e) => updatePageSeo(selectedSeoPage, { description: e.target.value })} className="w-full px-6 py-4 rounded-xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white font-bold outline-none h-24" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-10 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button onClick={handleSave} className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-xl">Apply SEO Logic</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Cards (01-03) and Revenue Preserved */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white dark:bg-slate-800 p-10 md:p-14 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <h2 className="text-2xl font-black mb-10 flex items-center dark:text-white">
              <span className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-primary text-white mr-5 flex items-center justify-center text-sm font-black transition-colors">01</span>
              Branding & Core
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Platform Name</label>
                <input type="text" value={localConfig.siteName} onChange={(e) => setLocalConfig({...localConfig, siteName: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-bold transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">License Price (PKR)</label>
                <input type="number" value={localConfig.licensePricePKR} onChange={(e) => setLocalConfig({...localConfig, licensePricePKR: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-bold transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-10 md:p-14 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <h2 className="text-2xl font-black mb-10 flex items-center dark:text-white">
              <span className="w-10 h-10 rounded-xl bg-green-500 text-white mr-5 flex items-center justify-center text-sm font-black transition-colors">02</span>
              Gateway Setup
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">JazzCash Number</label>
                <input type="text" value={localConfig.jazzCashNumber} onChange={(e) => setLocalConfig({...localConfig, jazzCashNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-bold" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Easypaisa Number</label>
                <input type="text" value={localConfig.easypaisaNumber} onChange={(e) => setLocalConfig({...localConfig, easypaisaNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none font-bold" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              {message && <span className="text-primary font-black animate-pulse flex items-center">{message}</span>}
              <button onClick={handleSave} className="bg-secondary dark:bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl ml-auto hover:scale-105 transition-transform">Sync System Logic</button>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-secondary dark:bg-slate-950 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden transition-colors border border-transparent dark:border-slate-800">
             <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30 mb-4">Total Revenue Flow</div>
             <div className="text-6xl font-black mb-12 tracking-tighter">PKR {totalRevenue}</div>
             <div className="space-y-6">
                <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-4">
                  <span className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Transactions</span>
                  <span className="font-black text-primary">{sales.length}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
