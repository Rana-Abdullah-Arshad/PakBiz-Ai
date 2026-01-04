
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
      // Pass the config.adminSecret to decrypt potential custom AI keys
      const ai = new AiService(config.ai, config.adminSecret);
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
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">Simple, Fair Pricing</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-xl leading-relaxed">No subscriptions. No hidden traps. Pay once, use forever.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className={`bg-white dark:bg-slate-800 p-10 md:p-14 rounded-[3rem] border-2 ${isLicensed ? 'border-primary' : 'border-slate-100 dark:border-slate-700'} shadow-sm relative overflow-hidden transition-all hover:shadow-xl`}>
          {isLicensed && (
            <div className="absolute top-8 right-8 bg-primary/10 text-primary text-[10px] font-black px-4 py-1.5 rounded-full flex items-center uppercase tracking-widest border border-primary/20">
              ACTIVATED
            </div>
          )}
          <h2 className="text-3xl font-black mb-2 dark:text-white">Platform License</h2>
          <div className="flex items-baseline mb-8">
            <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">PKR {config.licensePricePKR}</span>
            <span className="text-slate-400 ml-3 font-bold text-lg">/ lifetime</span>
          </div>
          <div className="mb-6 p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <p className="text-xs font-bold text-primary flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h1.17C4.162 5.378 4.298 4.7 5 5z" clipRule="evenodd" /></svg>
              BONUS: Get 10 AI Credits free on purchase!
            </p>
          </div>
          <ul className="space-y-5 mb-10">
            {[
              "Unlimited Business Logic Engines",
              "Unlimited Profit Calculations",
              "Lifetime Software Updates",
              "Priority Local Support",
              "Full White-label Resell Rights"
            ].map((item, i) => (
              <li key={i} className="flex items-start text-slate-600 dark:text-slate-300 font-medium">
                <svg className="w-6 h-6 text-primary mr-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                {item}
              </li>
            ))}
          </ul>
          {!isLicensed ? (
            <div className="space-y-4">
              <button 
                onClick={() => { setShowLicensePurchase(true); setSelectedPack(null); setShowKeyInput(false); }}
                className="w-full text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-primary/20 bg-primary hover:opacity-90"
              >
                Buy Lifetime License
              </button>
              <button 
                onClick={() => { setShowKeyInput(true); setShowLicensePurchase(false); setSelectedPack(null); }}
                className="w-full text-primary py-3 text-sm font-black hover:opacity-80 transition-all uppercase tracking-widest"
              >
                I have a license key
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate(AppView.DASHBOARD)}
              className="w-full bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all"
            >
              Access Dashboard
            </button>
          )}
        </div>

        <div className="bg-secondary dark:bg-slate-950 text-white p-10 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col border border-transparent dark:border-slate-800 transition-colors">
          <h2 className="text-3xl font-black mb-2">AI Boost Packs</h2>
          <p className="text-slate-400 font-medium mb-10">Purchase credits for AI text generation. No expiration date.</p>
          
          <div className="space-y-5 mb-auto">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.id}
                onClick={() => { setSelectedPack(pack); setShowLicensePurchase(false); setShowKeyInput(false); }}
                className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all group ${selectedPack?.id === pack.id ? 'border-primary bg-slate-800' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}`}
              >
                <div className="text-left">
                  <div className="font-black text-lg flex items-center">
                    {pack.name}
                    {pack.popular && <span className="ml-4 bg-primary text-white text-[9px] px-3 py-1 rounded-full uppercase tracking-widest font-black shadow-sm">Hot</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">{pack.credits} Credits</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-xl text-primary">PKR {config.packPrices[pack.id]}</div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 flex items-center text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
            <svg className="w-5 h-5 mr-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Secure AI Payment Audit
          </div>
        </div>
      </div>

      <div id="payment-section" className="scroll-mt-24">
        {(selectedPack || showLicensePurchase || showKeyInput) && (
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-[4rem] border border-slate-100 dark:border-slate-700 p-8 md:p-20 shadow-2xl relative transition-colors">
            <button 
              onClick={() => { setSelectedPack(null); setShowLicensePurchase(false); setShowKeyInput(false); setError(''); setSuccess(''); setScreenshot(null); setScreenshotPreview(null); }} 
              className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {showKeyInput ? (
              <div className="max-w-md mx-auto text-center">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-sm">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-6">Activate License</h3>
                <p className="text-slate-500 font-medium mb-10 leading-relaxed">Please enter your 16-character license key precisely to unlock all platform features.</p>
                <form onSubmit={handleVerifyKey} className="space-y-6">
                  <input 
                    type="text" 
                    value={enteredKey}
                    onChange={(e) => { setEnteredKey(e.target.value.toUpperCase()); setError(''); }}
                    placeholder="PK-XXXX-XXXX-XXXX"
                    className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-primary outline-none text-center font-mono font-black text-2xl tracking-[0.2em] transition-all bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:bg-white"
                    required
                  />
                  {error && <p className="text-red-500 font-bold animate-shake">{error}</p>}
                  {success && <p className="text-primary font-bold">{success}</p>}
                  <button 
                    type="submit"
                    className="w-full text-white py-6 rounded-2xl font-black text-xl transition-all shadow-xl shadow-primary/20 bg-primary hover:opacity-95"
                  >
                    Confirm Activation
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white mb-8">Secure Checkout</h3>
                  <p className="text-slate-500 font-medium mb-12">
                    Complete your purchase using local payment. AI will verify your receipt instantly.
                  </p>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-10 space-y-8 border border-slate-100 dark:border-slate-700 transition-colors">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Payment Accounts</p>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between group cursor-pointer" onClick={() => copyToClipboard(config.jazzCashNumber)}>
                        <span className="font-bold text-slate-600 dark:text-slate-300 text-lg">JazzCash</span>
                        <span className="font-mono text-primary font-black bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-primary/5 transition-colors">{config.jazzCashNumber}</span>
                      </div>
                      <div className="flex items-center justify-between group cursor-pointer" onClick={() => copyToClipboard(config.easypaisaNumber)}>
                        <span className="font-bold text-slate-600 dark:text-slate-300 text-lg">Easypaisa</span>
                        <span className="font-mono text-primary font-black bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-primary/5 transition-colors">{config.easypaisaNumber}</span>
                      </div>
                      <div className="flex flex-col space-y-2 group cursor-pointer" onClick={() => copyToClipboard(config.bankAccount)}>
                        <span className="font-bold text-slate-600 dark:text-slate-300 text-lg">Bank Account</span>
                        <span className="font-mono text-primary font-black bg-white dark:bg-slate-900 px-4 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 group-hover:bg-primary/5 transition-colors text-sm">{config.bankAccount}</span>
                      </div>
                      <div className="pt-8 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Total Payable</p>
                        <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">PKR {showLicensePurchase ? config.licensePricePKR : config.packPrices[selectedPack?.id]}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <div className="bg-primary/5 p-6 rounded-[2.5rem] mb-8">
                    <h4 className="font-black text-primary uppercase text-xs tracking-widest mb-4">Step 1: Upload Slip</h4>
                    <p className="text-xs text-slate-600 mb-4 font-bold">Screenshot must show: Receiver Account, Amount, and TID.</p>
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-primary transition-colors bg-white dark:bg-slate-900 relative overflow-hidden group min-h-[140px] flex flex-col items-center justify-center"
                    >
                      {screenshotPreview && (
                        <div className="absolute inset-0 z-0">
                          <img src={screenshotPreview} alt="Payment Preview" className="w-full h-full object-cover opacity-20" />
                        </div>
                      )}
                      <div className="relative z-10">
                        <svg className="w-8 h-8 mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                          {screenshot ? screenshot.name : 'Click to Upload Slip'}
                        </span>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>
                  </div>

                  <form onSubmit={handleVerifyPayment} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Step 2: Enter TID</label>
                      <input 
                        type="text" 
                        value={transactionId}
                        onChange={(e) => { setTransactionId(e.target.value); setError(''); }}
                        className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-700 focus:border-primary outline-none font-black text-xl bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                    {success && <p className="text-primary text-sm font-bold text-center font-black animate-pulse">{success}</p>}
                    <button 
                      type="submit"
                      disabled={isVerifying}
                      className={`w-full text-white py-6 rounded-2xl font-black text-xl transition-all shadow-xl flex items-center justify-center ${isVerifying ? 'bg-slate-400' : 'bg-secondary dark:bg-slate-700 hover:opacity-90'}`}
                    >
                      {isVerifying ? 'AI Auditing Slip...' : 'Confirm AI Verification'}
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
