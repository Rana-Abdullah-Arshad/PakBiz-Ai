
import React, { useState, useEffect, useRef } from 'react';
import { AppView, CreditPack, PlatformConfig } from '../types';
import { CREDIT_PACKS } from '../constants';
import { storageService } from '../services/storageService';
import { AiService } from '../services/aiService';

interface PricingProps {
  config: PlatformConfig;
  onNavigate: (view: AppView) => void;
  isLicensed: boolean;
  onPurchaseCredits: (amount: number) => void;
  onActivateLicense: (key: string) => void;
}

const Pricing: React.FC<PricingProps> = ({ config, onNavigate, isLicensed, onPurchaseCredits, onActivateLicense }) => {
  const [selectedPack, setSelectedPack] = useState<CreditPack | any | null>(null);
  const [showLicensePurchase, setShowLicensePurchase] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [enteredKey, setEnteredKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLicensePurchase || selectedPack || showKeyInput) {
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showLicensePurchase, selectedPack, showKeyInput]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionId.length < 6) {
      setError('Please enter a valid Transaction ID.');
      return;
    }
    if (!screenshot) {
      setError('Please upload a screenshot of your payment slip.');
      return;
    }

    setIsVerifying(true);
    setError('');
    setSuccess('');

    try {
      const ai = new AiService(config.ai, config.signingSecret);
      const base64Image = await fileToBase64(screenshot);
      const expectedAmount = showLicensePurchase ? config.licensePricePKR : config.packPrices[selectedPack?.id];

      const verification = await ai.verifyPayment(
        base64Image, 
        screenshot.type, 
        transactionId, 
        expectedAmount,
        {
          jazzCash: config.jazzCashNumber,
          easypaisa: config.easypaisaNumber,
          bank: config.bankAccount
        }
      );

      if (verification.isValid) {
        if (showLicensePurchase) {
          const mockKey = `PK-AUTO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          onActivateLicense(mockKey);
          onPurchaseCredits(10);
          
          storageService.addSalesRecord({
            timestamp: Date.now(),
            type: 'license',
            amount: config.licensePricePKR,
            transactionId
          });
          setSuccess(`AI Verified! License activated + 10 Free Credits added.`);
          setTimeout(() => onNavigate(AppView.DASHBOARD), 2500);
        } else if (selectedPack) {
          onPurchaseCredits(selectedPack.credits);
          storageService.addSalesRecord({
            timestamp: Date.now(),
            type: 'credits',
            amount: config.packPrices[selectedPack.id],
            transactionId,
            details: `${selectedPack.name} purchased`
          });
          setSuccess(`AI Verified! Successfully added ${selectedPack.credits} credits.`);
          setTimeout(() => {
            setSuccess('');
            setSelectedPack(null);
            setTransactionId('');
            setScreenshot(null);
            setScreenshotPreview(null);
          }, 2500);
        }
      } else {
        setError(verification.reason || "Verification failed. Ensure TID, Amount, and Date are correct.");
      }
    } catch (err: any) {
      setError(err.message || 'Verification system is currently busy. Try again with a clearer photo.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.generatedKeys.includes(enteredKey.trim())) {
      onActivateLicense(enteredKey.trim());
      setSuccess('License Key accepted! Accessing dashboard...');
      setTimeout(() => onNavigate(AppView.DASHBOARD), 2000);
    } else {
      setError('Invalid or expired License Key.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20 lg:py-24 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="text-center mb-12 sm:mb-20">
        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6 tracking-tighter">
          Simple, Fair Pricing
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-xl leading-relaxed font-medium">
          No subscriptions. No hidden traps. Pay once, use forever. Scaled for your business growth.
        </p>
      </div>

      {/* Main Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-16 sm:mb-24">
        {/* Platform License Card */}
        <div className={`bg-white dark:bg-slate-800 p-6 sm:p-10 lg:p-14 rounded-[2.5rem] sm:rounded-[4rem] border-2 ${isLicensed ? 'border-primary' : 'border-slate-100 dark:border-slate-700'} shadow-sm relative overflow-hidden transition-all hover:shadow-2xl group`}>
          {isLicensed && (
            <div className="absolute top-6 sm:top-10 right-6 sm:right-10 bg-primary/10 text-primary text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 rounded-full flex items-center uppercase tracking-widest border border-primary/20 z-10">
              ACTIVATED
            </div>
          )}
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-black mb-2 dark:text-white tracking-tight">Platform License</h2>
            <div className="flex items-baseline mb-6 sm:mb-10">
              <span className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">PKR {config.licensePricePKR}</span>
              <span className="text-slate-400 ml-3 font-bold text-sm sm:text-lg">/ lifetime</span>
            </div>
            
            <div className="mb-6 sm:mb-8 p-4 bg-primary/10 rounded-2xl border border-primary/20">
              <p className="text-[10px] sm:text-xs font-black text-primary flex items-center uppercase tracking-widest">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                BONUS: 10 AI Credits included
              </p>
            </div>

            <ul className="space-y-4 sm:space-y-6 mb-10 sm:mb-12">
              {[
                "Unlimited Business Logic Engines",
                "Unlimited Profit Calculations",
                "Lifetime Software Updates",
                "Priority Local Support",
                "Full White-label Resell Rights"
              ].map((item, i) => (
                <li key={i} className="flex items-start text-slate-600 dark:text-slate-300 font-bold text-sm sm:text-base leading-snug">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary mr-3 sm:mr-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  {item}
                </li>
              ))}
            </ul>

            {!isLicensed ? (
              <div className="space-y-4 sm:space-y-6">
                <button 
                  onClick={() => { setShowLicensePurchase(true); setSelectedPack(null); setShowKeyInput(false); }}
                  className="w-full text-white py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black text-base sm:text-xl transition-all shadow-xl shadow-primary/20 bg-primary hover:opacity-90 active:scale-95"
                >
                  Buy Lifetime License
                </button>
                <button 
                  onClick={() => { setShowKeyInput(true); setShowLicensePurchase(false); setSelectedPack(null); }}
                  className="w-full text-primary py-2 text-[10px] sm:text-xs font-black hover:opacity-80 transition-all uppercase tracking-[0.2em]"
                >
                  I have an activation key
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate(AppView.DASHBOARD)}
                className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black text-base sm:text-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
              >
                Enter Dashboard
              </button>
            )}
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
        </div>

        {/* AI Boost Packs Card */}
        <div className="bg-secondary dark:bg-slate-950 text-white p-6 sm:p-10 lg:p-14 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col border border-transparent dark:border-slate-800 transition-all">
          <div className="relative z-10 flex flex-col h-full">
            <h2 className="text-2xl sm:text-4xl font-black mb-2 tracking-tight">AI Boost Packs</h2>
            <p className="text-slate-400 font-bold text-xs sm:text-base mb-8 sm:mb-12">Neural credits for text generation. No expiration.</p>
            
            <div className="space-y-4 sm:space-y-6 mb-auto">
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => { setSelectedPack(pack); setShowLicensePurchase(false); setShowKeyInput(false); }}
                  className={`w-full flex items-center justify-between p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] border-2 transition-all group ${selectedPack?.id === pack.id ? 'border-primary bg-slate-800' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}`}
                >
                  <div className="text-left">
                    <div className="font-black text-base sm:text-xl flex items-center tracking-tight">
                      {pack.name}
                      {pack.popular && <span className="ml-3 sm:ml-4 bg-primary text-white text-[8px] sm:text-[9px] px-2 sm:px-3 py-1 rounded-full uppercase tracking-widest font-black shadow-sm">Popular</span>}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-black">{pack.credits} Active Nodes</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-lg sm:text-2xl text-primary tracking-tighter">PKR {config.packPrices[pack.id]}</div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-800 flex items-center text-[8px] sm:text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] shrink-0">
              <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Stateless AI Payment Security
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/10 rounded-full -mr-40 -mb-40 blur-[100px] pointer-events-none"></div>
        </div>
      </div>

      {/* Payment Section */}
      <div id="payment-section" className="scroll-mt-24 sm:scroll-mt-32">
        {(selectedPack || showLicensePurchase || showKeyInput) && (
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 dark:border-slate-700 p-6 sm:p-12 lg:p-20 shadow-[0_40px_100px_rgba(0,0,0,0.2)] relative transition-all animate-in zoom-in-95 duration-500">
            <button 
              onClick={() => { setSelectedPack(null); setShowLicensePurchase(false); setShowKeyInput(false); setError(''); setSuccess(''); setScreenshot(null); setScreenshotPreview(null); }} 
              className="absolute top-6 sm:top-12 right-6 sm:right-12 text-slate-300 hover:text-red-500 transition-all z-20"
            >
              <svg className="w-8 h-8 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {showKeyInput ? (
              <div className="max-w-xl mx-auto text-center py-6 sm:py-10">
                <div className="w-20 h-20 sm:w-28 sm:h-28 bg-slate-50 dark:bg-slate-900 text-primary rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 sm:mb-12 shadow-sm">
                  <svg className="w-10 h-10 sm:w-16 sm:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <h3 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 sm:mb-6 tracking-tight">Activate License</h3>
                <p className="text-slate-500 font-bold text-sm sm:text-lg mb-10 sm:mb-16 leading-relaxed">Enter your private license key precisely to unlock the cluster nodes.</p>
                <form onSubmit={handleVerifyKey} className="space-y-6 sm:space-y-8">
                  <input 
                    type="text" 
                    value={enteredKey}
                    onChange={(e) => { setEnteredKey(e.target.value.toUpperCase()); setError(''); }}
                    placeholder="PK-XXXX-XXXX-XXXX"
                    className="w-full px-4 sm:px-10 py-5 sm:py-7 rounded-2xl sm:rounded-3xl border-2 border-slate-100 dark:border-slate-700 focus:border-primary outline-none text-center font-mono font-black text-lg sm:text-3xl tracking-[0.1em] sm:tracking-[0.2em] transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                    required
                  />
                  {error && <p className="text-red-500 font-black text-sm animate-shake">{error}</p>}
                  {success && <p className="text-primary font-black text-sm">{success}</p>}
                  <button 
                    type="submit"
                    className="w-full text-white py-5 sm:py-8 rounded-2xl sm:rounded-[2.5rem] font-black text-lg sm:text-2xl transition-all shadow-xl shadow-primary/20 bg-primary hover:opacity-95 active:scale-95"
                  >
                    Confirm Activation
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                <div>
                  <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Secured Transaction</div>
                  <h3 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 sm:mb-8 tracking-tighter">Direct Gateway</h3>
                  <p className="text-slate-500 font-bold text-sm sm:text-lg mb-10 sm:mb-16 leading-relaxed">
                    Complete your transfer using JazzCash or Easypaisa. Our AI audit engine will verify your TID instantly.
                  </p>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 space-y-8 sm:space-y-10 border border-slate-100 dark:border-slate-700 shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Authorized Collection Nodes</p>
                    <div className="space-y-6 sm:space-y-8">
                      <div className="flex items-center justify-between group cursor-pointer" onClick={() => copyToClipboard(config.jazzCashNumber)}>
                        <span className="font-black text-slate-600 dark:text-slate-300 text-sm sm:text-xl">JazzCash</span>
                        <div className="flex items-center">
                          <span className="font-mono text-primary font-black bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-xs sm:text-lg shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-primary/5 transition-all">{config.jazzCashNumber}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between group cursor-pointer" onClick={() => copyToClipboard(config.easypaisaNumber)}>
                        <span className="font-black text-slate-600 dark:text-slate-300 text-sm sm:text-xl">Easypaisa</span>
                        <div className="flex items-center">
                          <span className="font-mono text-primary font-black bg-white dark:bg-slate-800 px-4 py-2 rounded-xl text-xs sm:text-lg shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-primary/5 transition-all">{config.easypaisaNumber}</span>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 group cursor-pointer" onClick={() => copyToClipboard(config.bankAccount)}>
                        <span className="font-black text-slate-600 dark:text-slate-300 text-sm sm:text-xl">Bank Transfer</span>
                        <span className="font-mono text-primary font-black bg-white dark:bg-slate-800 px-4 py-3 rounded-xl text-[10px] sm:text-base shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-primary/5 transition-all text-center">{config.bankAccount}</span>
                      </div>
                      <div className="pt-8 sm:pt-10 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Amount Due</p>
                        <p className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">PKR {showLicensePurchase ? config.licensePricePKR : config.packPrices[selectedPack?.id]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="bg-primary/5 dark:bg-primary/10 p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] mb-8 sm:mb-12 border border-primary/10">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-black text-xs mr-4 shadow-lg shadow-primary/20">01</div>
                      <h4 className="font-black text-primary uppercase text-[10px] sm:text-xs tracking-widest">Verification Assets</h4>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 mb-6 font-bold leading-relaxed">Snapshot must clearly show: Receiver Name/No, Transaction Amount, and unique TID.</p>
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center cursor-pointer hover:border-primary transition-all bg-white dark:bg-slate-900 relative overflow-hidden group min-h-[160px] sm:min-h-[220px] flex flex-col items-center justify-center shadow-inner"
                    >
                      {screenshotPreview && (
                        <div className="absolute inset-0 z-0">
                          <img src={screenshotPreview} alt="Payment Preview" className="w-full h-full object-cover opacity-30" />
                        </div>
                      )}
                      <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400 group-hover:text-primary transition-all group-hover:scale-110">
                          <svg className="w-6 h-6 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-primary">
                          {screenshot ? screenshot.name : 'Click to Upload Slip'}
                        </span>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                  </div>

                  <form onSubmit={handleVerifyPayment} className="space-y-6 sm:space-y-10">
                    <div>
                      <div className="flex items-center mb-4 ml-4">
                        <div className="w-6 h-6 rounded-md bg-secondary text-white flex items-center justify-center font-black text-[10px] mr-3 shadow-md">02</div>
                        <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Transaction Signature (TID)</label>
                      </div>
                      <input 
                        type="text" 
                        value={transactionId}
                        onChange={(e) => { setTransactionId(e.target.value); setError(''); }}
                        className="w-full px-6 sm:px-10 py-5 sm:py-7 rounded-2xl sm:rounded-3xl border-2 border-slate-100 dark:border-slate-700 focus:border-primary outline-none font-black text-lg sm:text-2xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-800 shadow-inner"
                        placeholder="ID: 2837..."
                        required
                      />
                    </div>
                    {error && <p className="text-red-500 text-xs sm:text-sm font-black text-center animate-shake">{error}</p>}
                    {success && <p className="text-primary text-xs sm:text-sm font-black text-center animate-pulse">{success}</p>}
                    <button 
                      type="submit"
                      disabled={isVerifying}
                      className={`w-full text-white py-5 sm:py-10 rounded-2xl sm:rounded-[2.5rem] font-black text-lg sm:text-2xl transition-all shadow-2xl flex items-center justify-center relative overflow-hidden active:scale-95 ${isVerifying ? 'bg-slate-400 cursor-not-allowed' : 'bg-secondary dark:bg-slate-700 hover:opacity-95 shadow-secondary/20'}`}
                    >
                      {isVerifying ? (
                        <div className="flex items-center space-x-3">
                           <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                           <span>AI Neural Audit...</span>
                        </div>
                      ) : 'Deploy Payment Verification'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
