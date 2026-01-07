
import React from 'react';
import { AppView, PlatformConfig } from '../types';

interface HomeProps {
  onNavigate: (view: AppView) => void;
  isLicensed: boolean;
  config: PlatformConfig;
}

const Home: React.FC<HomeProps> = ({ onNavigate, isLicensed, config }) => {
  return (
    <div className="overflow-hidden flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-32 lg:pb-36 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="z-10 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center py-1.5 px-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] sm:text-xs font-black mb-8 tracking-[0.2em] uppercase border border-green-200/50 dark:border-green-800/30">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
              Pakistan's #1 Stateless AI Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tighter">
              Automate Your <br className="hidden sm:block" />
              <span className="text-primary">Local Business</span> <br className="hidden lg:block" />
              with Neural Logic.
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              From profit margins to WhatsApp sales scripts. {config.siteName} helps Pakistani sellers close deals faster without subscriptions or data collection.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
              <button 
                onClick={() => onNavigate(isLicensed ? AppView.DASHBOARD : AppView.PRICING)}
                className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl text-lg font-black hover:opacity-90 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center active:scale-95"
              >
                {isLicensed ? 'Go to Dashboard' : 'Get Lifetime License'}
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
              <button 
                onClick={() => onNavigate(AppView.PRICING)}
                className="w-full sm:w-auto bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-10 py-5 rounded-2xl text-lg font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center active:scale-95"
              >
                View Credit Packs
              </button>
            </div>
          </div>
          
          <div className="relative order-1 lg:order-2 px-4 sm:px-10 lg:px-0">
            <div className="float-animation relative z-10 bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-[2rem] sm:rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-700/50 overflow-hidden">
               <img src="https://picsum.photos/seed/pakbiz-hero/800/600" alt="Platform Intelligence" className="rounded-[1.5rem] sm:rounded-[2.5rem] w-full h-auto object-cover aspect-[4/3] lg:aspect-auto" />
            </div>
            {/* Context Badge */}
            <div className="absolute -bottom-4 sm:-bottom-8 -left-2 sm:-left-8 z-20 bg-white dark:bg-slate-800 p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 max-w-[180px] sm:max-w-[240px] hidden sm:block">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Growth Pulse</span>
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">5,000+ Pakistani Sellers Scaling Today</p>
            </div>
            {/* Neural Blob Decorations */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] -z-10"></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white dark:bg-slate-900/30 py-16 sm:py-24 lg:py-32 px-4 sm:px-6 border-y border-slate-100 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 lg:mb-24">
            <div className="text-primary font-black text-[10px] sm:text-xs uppercase tracking-[0.4em] mb-4">Functional Modules</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">Tools Built for the Local Market</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base sm:text-lg font-medium leading-relaxed">
              Proprietary AI engines designed specifically for the unique nuances of doing business in Pakistan.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {[
              { 
                title: "Profit Engine", 
                desc: "Calculate margins, shipping, and ad costs instantly. Optimized for PKR volatility and logistics overheads.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              },
              { 
                title: "WhatsApp Closer", 
                desc: "AI-generated Roman Urdu scripts that feel natural. Close deal after deal without typing a single word from scratch.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )
              },
              { 
                title: "Social Caption Gen", 
                desc: "High-converting Facebook & Instagram captions. We know exactly what hooks the local buyer profile.",
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                )
              }
            ].map((f, i) => (
              <div key={i} className="group bg-slate-50 dark:bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 flex flex-col items-start text-left h-full">
                <div className="bg-white dark:bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-primary shadow-sm group-hover:scale-110 transition-transform duration-500">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center justify-items-center">
            {[
              { val: "5,000+", label: "Power Sellers" },
              { val: "100k+", label: "Neural Actions" },
              { val: "24/7", label: "Biz-Master Active" },
              { val: "Zero", label: "Data Leakage" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:text-primary transition-colors duration-300">{stat.val}</div>
                <div className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-3">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 dark:bg-slate-800/80 rounded-[3rem] sm:rounded-[4rem] p-8 sm:p-16 lg:p-24 text-center text-white relative overflow-hidden border border-slate-800 shadow-2xl">
            <div className="z-10 relative">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-8 tracking-tighter leading-none">Ready to Scale Your PakBiz?</h2>
              <p className="text-slate-400 text-base sm:text-lg lg:text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                Join thousands of Pakistani entrepreneurs using AI to work smarter. <br className="hidden sm:block" />
                One-time activation, lifetime business freedom.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <button 
                  onClick={() => onNavigate(AppView.PRICING)}
                  className="w-full sm:w-auto bg-primary hover:opacity-95 text-white px-12 py-5 rounded-2xl text-xl font-black transition-all shadow-xl shadow-primary/20 active:scale-95"
                >
                  Activate License Now
                </button>
                <div className="flex items-center space-x-2 text-slate-500 text-xs font-black uppercase tracking-widest">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span>Lifetime Guaranteed</span>
                </div>
              </div>
            </div>
            {/* Background Aesthetics */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
              <div className="w-64 sm:w-96 h-64 sm:h-96 bg-primary rounded-full filter blur-[100px] absolute -top-32 -left-32"></div>
              <div className="w-64 sm:w-96 h-64 sm:h-96 bg-blue-500 rounded-full filter blur-[100px] absolute -bottom-32 -right-32"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
