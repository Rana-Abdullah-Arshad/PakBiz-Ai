
import React, { useState } from 'react';
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

  const calculatedPrice = Math.round((logicParams.cost + logicParams.shipping + logicParams.adCost) / (1 - (logicParams.targetMargin / 100)));
  const profitPerUnit = calculatedPrice - (logicParams.cost + logicParams.shipping + logicParams.adCost);

  const handleGenerateAI = async () => {
    if (userState.credits < config.aiCostPerAction) {
      setError('Not enough credits. Please buy more packs.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      // Pass the config.adminSecret to the AiService for secure decryption
      const ai = new AiService(config.ai, config.adminSecret);
      const systemMsg = AiService.getPrompts(aiType);
      const result = await ai.generateContent(`Product Info: ${aiPrompt}`, systemMsg);
      
      if (result) {
        onDeductCredits(config.aiCostPerAction);
        setAiResult(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate content. Please check your AI settings in Admin.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Business Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back! Grow your PakBiz today.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
           <div className="text-right">
             <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Credits Left</div>
             <div className="text-xl font-bold text-primary">{userState.credits}</div>
           </div>
           <button 
             onClick={() => onNavigate(AppView.PRICING)}
             className="bg-primary text-white p-2 rounded-lg hover:opacity-90 transition-all shadow-sm"
             title="Buy More"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
           </button>
        </div>
      </div>

      <div className="flex space-x-2 mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit transition-colors">
        <button 
          onClick={() => setActiveTab('calculator')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'calculator' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          Profit Calculator
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'ai' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          AI Assistant
        </button>
      </div>

      {activeTab === 'calculator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-xl font-bold mb-6 dark:text-white">Price & Profit Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Cost Price (PKR)</label>
                <input 
                  type="number" 
                  value={logicParams.cost} 
                  onChange={(e) => setLogicParams({...logicParams, cost: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-primary transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Avg. Shipping (PKR)</label>
                <input 
                  type="number" 
                  value={logicParams.shipping} 
                  onChange={(e) => setLogicParams({...logicParams, shipping: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-primary transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Ad Cost Per Sale (PKR)</label>
                <input 
                  type="number" 
                  value={logicParams.adCost} 
                  onChange={(e) => setLogicParams({...logicParams, adCost: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-primary transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Target Margin (%)</label>
                <input 
                  type="number" 
                  value={logicParams.targetMargin} 
                  onChange={(e) => setLogicParams({...logicParams, targetMargin: Number(e.target.value)})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-primary transition-all" 
                />
              </div>
            </div>
            
            <div className="p-6 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-900/20 grid grid-cols-1 md:grid-cols-2 gap-6 transition-colors">
              <div>
                <div className="text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-1">Recommended Selling Price</div>
                <div className="text-3xl font-black text-green-800 dark:text-green-300">PKR {calculatedPrice}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-green-700 dark:text-green-400 uppercase mb-1">Expected Profit / Sale</div>
                <div className="text-3xl font-black text-green-800 dark:text-green-300">PKR {profitPerUnit}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-8 rounded-3xl shadow-xl transition-colors">
             <h3 className="text-xl font-bold mb-4">Quick Insights</h3>
             <ul className="space-y-4">
                <li className="flex items-center space-x-3 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span>Strategy powered by {config.ai.provider.toUpperCase()}</span>
                </li>
             </ul>
             <div className="mt-8 pt-8 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-4 font-bold uppercase tracking-widest">Unlock AI Features</p>
                <button 
                  onClick={() => setActiveTab('ai')}
                  className="w-full py-3 bg-slate-800 dark:bg-slate-900 rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Ask AI Assistant
                </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="text-xl font-bold mb-6 dark:text-white">AI Content Generator</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { id: 'caption', label: 'FB/Insta Caption' },
                { id: 'whatsapp', label: 'WhatsApp Closer' },
                { id: 'offer', label: 'Bhook Offer' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setAiType(btn.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${aiType === btn.id ? 'bg-primary text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Product Description / Hook</label>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Leather wallet for men, premium quality, PKR 1500, Cash on delivery available..."
                className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-primary h-32 resize-none transition-all"
              />
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold mb-4 animate-shake">{error}</p>}
            
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating || !aiPrompt}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${isGenerating ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20'}`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Thinking...
                </>
              ) : (
                <>
                  Generate ({config.aiCostPerAction} Credit)
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">AI Result ({config.ai.provider})</h3>
              {aiResult && (
                <button 
                  onClick={() => { navigator.clipboard.writeText(aiResult); alert('Copied!'); }}
                  className="text-primary hover:opacity-80 text-xs font-bold flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  COPY TEXT
                </button>
              )}
            </div>
            
            {aiResult ? (
              <div className="flex-grow whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed font-medium transition-colors">
                {aiResult}
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30 select-none">
                <svg className="w-16 h-16 mb-4 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <p className="font-bold dark:text-white italic">AI Strategy Secure: {config.ai.provider.toUpperCase()}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
