
import React from 'react';
import { AppView, PlatformConfig } from '../types';

interface NavbarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  credits: number;
  isLicensed: boolean;
  config: PlatformConfig;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  view, onNavigate, credits, isLicensed, config, darkMode, onToggleDarkMode 
}) => {
  const getLinkStyles = (v: AppView) => {
    const isActive = view === v;
    return `text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all duration-300 ${
      isActive 
        ? 'text-primary bg-primary/10 shadow-sm border border-primary/10' 
        : 'text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800'
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => onNavigate(AppView.HOME)}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary text-white font-black text-xl mr-3 shadow-xl group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-700">
              {config.siteName.charAt(0)}
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              {config.siteName}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <button onClick={() => onNavigate(AppView.HOME)} className={getLinkStyles(AppView.HOME)}>
              Home
            </button>
            <button onClick={() => onNavigate(AppView.PRICING)} className={getLinkStyles(AppView.PRICING)}>
              Pricing
            </button>
            {isLicensed && (
              <button onClick={() => onNavigate(AppView.DASHBOARD)} className={getLinkStyles(AppView.DASHBOARD)}>
                Dashboard
              </button>
            )}
            <button onClick={() => onNavigate(AppView.ADMIN)} className={getLinkStyles(AppView.ADMIN)}>
              Admin
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleDarkMode}
              className="p-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {isLicensed && (
              <div className="hidden sm:flex items-center bg-primary/5 dark:bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20 shadow-sm">
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest mr-2">Nodes</span>
                <span className="text-base font-black text-primary leading-none">{credits}</span>
              </div>
            )}
            
            {isLicensed ? (
              <button 
                onClick={() => onNavigate(AppView.SETTINGS)}
                className={`p-3 rounded-2xl transition-all ${view === AppView.SETTINGS ? 'text-primary bg-primary/10' : 'text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            ) : (
              <button 
                onClick={() => onNavigate(AppView.PRICING)}
                className="bg-primary text-white px-7 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-primary/30 hover:opacity-90 active:scale-95"
              >
                Get License
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
