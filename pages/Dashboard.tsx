
import React, { useState, useEffect } from 'react';
import { UserState, PlatformConfig, AppView, BusinessLogicParams } from '../types';
import { AiService } from '../services/aiService';

interface DashboardProps {
  userState: UserState;
  config: PlatformConfig;
  onDeductCredits: (amount: number) => boolean;
  onNavigate: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userState, config, onDeductCredits, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'ai'>('calculator');
  const [logicParams, setLogicParams] = useState<BusinessLogicParams>({
    cost: 1000,
    shipping: 200,
    adCost: 150,
    targetMargin: 25
  });
  
  const [aiType, setAiType] = useState<'caption' | 'whatsapp' | 'offer'>('caption');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Custom API Key Logic
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('pb_user_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem('pb_user_api_key', customApiKey);
  }, [customApiKey]);

  const calculatedPrice = Math.round((logicParams.cost + logicParams.shipping + logicParams.adCost) / (1 - (logicParams.targetMargin / 100)));
  const profitPerUnit = calculatedPrice - (logicParams.cost + logicParams.shipping + logicParams.adCost);

  const getPlaceholder = () => {
    switch (aiType) {
      case 'caption':
        return "Maslan: 'Mein Cotton ke Suit bech raha hoon 3000 mein, free delivery ke sath'...";
      case 'whatsapp':
        return "Maslan: 'Customer keh raha hai ke qeemat ziada hai, usay kaisay manao?'...";
      case 'offer':
        return "Maslan: 'Eid sale ke liye koi zabardast 'Buy 1 Get 1' jesi offer bana do'...";
      default:
        return "Apni cheez ke baray mein likhein...";
    }
  };

  const getDynamicCTA = () => {
    if (isGenerating) return "AI Likh Raha Hai...";
    switch (aiType) {
      case 'caption': return "Facebook/Insta Post Likho";
      case 'whatsapp': return "WhatsApp Reply Banao";
      case 'offer': return "Zabardast Offer Banao";
      default: return "AI Magic Shuru Karo";
    }
  };

  const handleGenerateAI = async () => {
    const isUsingCustomKey = customApiKey.trim().length > 10;
    
    // Bypass credits if custom key is used
    if (!isUsingCustomKey && userState.credits < config.aiCostPerAction) {
      setError('Aap ke paas AI Points khatam ho gaye hain. Naye points khareedein.');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      // Pass custom key to service
      const ai = new AiService(config.ai, config.signingSecret, isUsingCustomKey ? customApiKey.trim() : undefined);
      const systemMsg = AiService.getPrompts(aiType);
      const result = await ai.generateContent(`Product Info: ${aiPrompt}`, systemMsg);
      if (result) {
        if (!isUsingCustomKey) {
          onDeductCredits(config.aiCostPerAction);
        }
        setAiResult(result);
      }
    } catch (err: any) {
      setError('Internet ka masla hai ya key sahi nahi hai. Dobara koshish karein.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-20 animate-in fade-in slide-in-from-bottom-6 duration-1000 w-full overflow-hidden">
      
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12 gap-8">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span>Aap ka Karobar Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Apna Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed text-base md:text-lg">
            Nafa calculate karein aur AI se marketing karwayein.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 px-8 py-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl flex items-center group transition-all">
          <div className="mr-10">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {customApiKey.trim().length > 10 ? 'Mode: Free (User Key)' : 'Baqi Points'}
            </div>
            <div className={`text-4xl font-black ${customApiKey.trim().length > 10 ? 'text-emerald-500' : 'text-primary'} tracking-tighter leading-none`}>
              {customApiKey.trim().length > 10 ? '∞' : userState.credits}
            </div>
          </div>
          <button 
            onClick={() => onNavigate(AppView.PRICING)} 
            className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-primary/30"
            title="Points Barhayein"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex p-2 bg-slate-100 dark:bg-slate-800/50 rounded-[2rem] w-full sm:w-fit mb-12 border border-slate-200/50 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('calculator')} 
          className={`flex-1 sm:flex-none flex items-center justify-center px-8 sm:px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'calculator' ? 'bg-white dark:bg-slate-700 text-primary shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Nafa Calculator
        </button>
        <button 
          onClick={() => setActiveTab('ai')} 
          className={`flex-1 sm:flex-none flex items-center justify-center px-8 sm:px-12 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeTab === 'ai' ? 'bg-white dark:bg-slate-700 text-primary shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          AI Marketing Magic
        </button>
      </div>

      {/* Workspace */}
      <div className="relative">
        {activeTab === 'calculator' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12 animate-in fade-in slide-in-from-left-6 duration-700">
            
            {/* Inputs Section */}
            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center mb-10">
                   <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mr-4 shadow-inner">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <h3 className="text-2xl font-black dark:text-white tracking-tight">Apnay Kharachay Likhein</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                  {[
                    { label: "Saman ki Qeemat (Cost)", key: "cost", desc: "Aap ko cheez kitnay ki parri?" },
                    { label: "Delivery ka Kharcha", key: "shipping", desc: "Courier company kitnay legi?" },
                    { label: "Ads ka Kharcha", key: "adCost", desc: "Facebook/Tiktok ads ka kharcha" },
                    { label: "Apna Munafa (%)", key: "targetMargin", desc: "Aap kitnay % kamana chahte hain?" },
                  ].map((item) => (
                    <div key={item.key} className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{item.label}</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={logicParams[item.key as keyof BusinessLogicParams]} 
                          onChange={(e) => setLogicParams({...logicParams, [item.key]: Number(e.target.value)})} 
                          className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 dark:text-white font-black text-xl outline-none focus:border-primary transition-all shadow-inner" 
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">{item.key === 'targetMargin' ? '%' : 'Rs'}</div>
                      </div>
                      <p className="text-[10px] text-slate-400 ml-2 font-bold">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Bechnay ki Qeemat</div>
                        <div className="text-5xl font-black tracking-tighter mb-2">Rs {calculatedPrice}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Is qeemat par customer ko bechein</div>
                      </div>
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
                   </div>
                   
                   <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 shadow-sm group">
                      <div className="relative z-10">
                        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">Aap ka Munafa (Profit)</div>
                        <div className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Rs {profitPerUnit}</div>
                        <div className="text-[9px] text-emerald-600/60 dark:text-emerald-400/60 font-bold uppercase tracking-widest italic">Saaray kharchay nikal kar bachat</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Strategy Section */}
            <div className="space-y-8">
               <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                  <div className="flex items-center space-x-4 mb-8 relative z-10">
                    <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    <h3 className="text-2xl font-black tracking-tight">Zaroori Mashwara</h3>
                  </div>
                  <div className="space-y-8 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Market Tip</p>
                      <p className="text-base font-bold leading-relaxed">Apni qeemat ko <span className="underline decoration-white/40 underline-offset-4">Rs {calculatedPrice - 10} ya {calculatedPrice - 5}</span> par rakhein, is se psychological impact parta hai.</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Growth Tip</p>
                      <p className="text-base font-bold leading-relaxed">Agar aap ka munafa Rs {profitPerUnit} hai, to aap Ads par ziada budget laga sakte hain.</p>
                    </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">System Status</h4>
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    <span>Calculator Engine</span>
                    <span className="text-primary">Online</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: '100%' }}></div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 animate-in fade-in slide-in-from-right-6 duration-700">
            
            {/* AI Generator Card */}
            <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 dark:border-slate-700 shadow-xl flex flex-col relative overflow-hidden">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h3 className="text-3xl md:text-4xl font-black dark:text-white tracking-tighter">AI Likhaari</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Marketing mein madad karein</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${showSettings ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-primary'}`}
                    title="Neural Settings"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /></svg>
                  </button>
                  <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                </div>
              </div>

              {/* Advanced Settings Panel */}
              {showSettings && (
                <div className="mb-10 p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-primary/20 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Settings (Advanced)</h4>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Apni API Key Lagayein (Optional)</label>
                    <input 
                      type="password" 
                      value={customApiKey} 
                      onChange={(e) => setCustomApiKey(e.target.value)} 
                      placeholder="Sk-proj-..." 
                      className="w-full px-6 py-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 dark:text-white font-mono text-sm focus:border-primary outline-none transition-all"
                    />
                    <p className="text-[9px] text-slate-400 font-bold ml-4">Agar aap apni key lagayein ge to AI Points kharch nahi honge.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap p-1.5 bg-slate-100 dark:bg-slate-900 rounded-[1.8rem] mb-10 border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'caption', label: 'Post Caption', icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417" },
                  { id: 'whatsapp', label: 'WhatsApp Script', icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0" },
                  { id: 'offer', label: 'Viral Offer', icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286" }
                ].map((btn) => (
                  <button 
                    key={btn.id} 
                    onClick={() => { setAiType(btn.id as any); setAiPrompt(''); }} 
                    className={`flex-1 flex flex-col items-center py-4 rounded-[1.4rem] transition-all duration-300 ${aiType === btn.id ? 'bg-white dark:bg-slate-800 text-primary shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <svg className="w-5 h-5 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={btn.icon} /></svg>
                    <span className="text-[9px] font-black uppercase tracking-widest text-center">{btn.label}</span>
                  </button>
                ))}
              </div>

              <div className="mb-8 space-y-4 flex-grow">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Yahan Likhein (Apni cheez ke baray mein)</label>
                <textarea 
                  value={aiPrompt} 
                  onChange={(e) => setAiPrompt(e.target.value)} 
                  placeholder={getPlaceholder()} 
                  className="w-full px-8 py-8 rounded-[2rem] border-2 border-slate-50 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-white outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-900 h-64 resize-none transition-all shadow-inner font-medium text-lg placeholder:opacity-40 leading-relaxed custom-scrollbar" 
                />
              </div>

              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || !aiPrompt} 
                className={`w-full py-6 md:py-8 rounded-[2rem] font-black text-xl uppercase tracking-widest flex items-center justify-center transition-all shadow-2xl relative overflow-hidden group/btn ${isGenerating ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:scale-[1.01] active:scale-95 shadow-primary/30'}`}
              >
                <div className="flex items-center relative z-10">
                  {getDynamicCTA()}
                  <span className="ml-3 opacity-50 text-xs">
                    ({customApiKey.trim().length > 10 ? 'FREE MODE' : `-${config.aiCostPerAction} Point`})
                  </span>
                  <svg className="w-6 h-6 ml-3 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              </button>
              {error && <div className="mt-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold text-center border border-red-100">{error}</div>}
            </div>

            {/* AI Result Card */}
            <div className="bg-slate-950 text-white p-10 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-900 min-h-[500px] flex flex-col relative overflow-hidden group transition-all">
               <div className="flex items-center justify-between mb-10 relative z-10">
                 <div className="flex items-center space-x-3">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aap ka Content</h3>
                 </div>
                 {aiResult && (
                   <button 
                     onClick={() => { navigator.clipboard.writeText(aiResult); alert('Copy ho gaya!'); }} 
                     className="bg-slate-900 hover:bg-primary hover:text-white text-slate-400 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-800"
                   >
                     Copy Karein
                   </button>
                 )}
               </div>

               <div className="flex-grow relative z-10 custom-scrollbar overflow-y-auto pr-4 max-h-[600px]">
                 {aiResult ? (
                   <div className="whitespace-pre-wrap text-emerald-50 leading-[1.8] font-medium text-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                     {aiResult}
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-10 select-none py-20">
                     <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1" /></svg></div>
                     <p className="text-2xl font-black uppercase tracking-[0.3em] italic">AI Waiting...</p>
                   </div>
                 )}
               </div>
               
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full -mr-[200px] -mt-[200px] blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-all"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
