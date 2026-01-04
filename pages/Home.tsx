
import React from 'react';
import { AppView, PlatformConfig } from '../types';

interface HomeProps {
  onNavigate: (view: AppView) => void;
  isLicensed: boolean;
  config: PlatformConfig;
}

const Home: React.FC<HomeProps> = ({ onNavigate, isLicensed, config }) => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-32 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold mb-6 tracking-wide uppercase">
              Pakistan's First Stateless AI Platform
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6 tracking-tight">
              Automate Your <span className="text-primary">Local Business</span> with AI.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-xl">
              From profit margins to WhatsApp sales scripts. {config.siteName} helps Pakistani sellers close deals faster without any monthly subscriptions or complex setups.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => onNavigate(isLicensed ? AppView.DASHBOARD : AppView.PRICING)}
                className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/30 flex items-center justify-center"
              >
                {isLicensed ? 'Go to Dashboard' : 'Get Lifetime License'}
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </button>
              <button 
                onClick={() => onNavigate(AppView.PRICING)}
                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center"
              >
                View Credit Packs
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="float-animation bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700">
               <img src="https://picsum.photos/seed/pakbiz/600/400" alt="Dashboard Preview" className="rounded-2xl w-full h-auto opacity-90" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 hidden md:block max-w-[200px]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Live Usage</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">1.2k+ Sellers active in Pakistan today</p>
            </div>
          </div>
        </div>
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-green-100 dark:bg-green-900/20 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 -z-10"></div>
      </section>

      {/* Features Grid */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-24 px-4 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Powerful Tools for Local Sellers</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">Everything you need to run a profitable business in Pakistan, from Facebook ads to delivery logistics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Profit Engine", 
                desc: "Calculate margins, shipping, and ad costs instantly. Stop guessing your profits.",
                icon: (
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              },
              { 
                title: "WhatsApp Sales scripts", 
                desc: "AI-generated Roman Urdu scripts to close high-ticket clients on WhatsApp.",
                icon: (
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )
              },
              { 
                title: "Ad Caption Generator", 
                desc: "High-converting Facebook & Instagram captions optimized for the Pakistani market.",
                icon: (
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                )
              }
            ].map((f, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-green-50 dark:bg-green-900/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Stats Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center items-center gap-12 opacity-60">
           <div className="text-center px-4">
             <div className="text-4xl font-bold text-slate-800 dark:text-slate-200">5,000+</div>
             <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Sellers</div>
           </div>
           <div className="text-center px-4">
             <div className="text-4xl font-bold text-slate-800 dark:text-slate-200">100k+</div>
             <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Actions</div>
           </div>
           <div className="text-center px-4">
             <div className="text-4xl font-bold text-slate-800 dark:text-slate-200">24/7</div>
             <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Automation</div>
           </div>
           <div className="text-center px-4">
             <div className="text-4xl font-bold text-slate-800 dark:text-slate-200">Zero</div>
             <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Database</div>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="bg-slate-900 dark:bg-slate-800/80 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="z-10 relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to Scale Your PakBiz?</h2>
            <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">Join thousands of Pakistani entrepreneurs using AI to work smarter. One-time payment, lifetime freedom.</p>
            <button 
              onClick={() => onNavigate(AppView.PRICING)}
              className="bg-primary hover:opacity-90 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all shadow-xl shadow-primary/30"
            >
              Get Started Now
            </button>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="w-96 h-96 bg-primary rounded-full filter blur-[100px] absolute -top-48 -left-48"></div>
            <div className="w-96 h-96 bg-blue-500 rounded-full filter blur-[100px] absolute -bottom-48 -right-48"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
