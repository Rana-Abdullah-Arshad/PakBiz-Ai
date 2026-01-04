
import React from 'react';
import { AppView, PlatformConfig } from '../types';

interface FooterProps {
  onNavigate: (view: AppView) => void;
  config: PlatformConfig;
}

const Footer: React.FC<FooterProps> = ({ onNavigate, config }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-lg mr-2 bg-primary">
                {config.siteName.charAt(0)}
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{config.siteName}</span>
            </div>
            <p className="max-w-md text-slate-400 mb-8 leading-relaxed">
              The premier AI automation suite for Pakistani entrepreneurs. Stateless by design, powerful by choice. Built to empower the next generation of local business leaders.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-[10px] tracking-[0.2em]">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => onNavigate(AppView.HOME)} className="hover:text-primary transition-colors">Home</button></li>
              <li><button onClick={() => onNavigate(AppView.PRICING)} className="hover:text-primary transition-colors">Pricing</button></li>
              <li><button onClick={() => onNavigate(AppView.DASHBOARD)} className="hover:text-primary transition-colors">Dashboard</button></li>
              <li><button onClick={() => onNavigate(AppView.ADMIN)} className="hover:text-primary transition-colors">Admin Panel</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-[10px] tracking-[0.2em]">Legal & Compliance</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><button onClick={() => onNavigate(AppView.PRIVACY)} className="hover:text-primary transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate(AppView.TERMS)} className="hover:text-primary transition-colors">Terms of Service</button></li>
              <li><button onClick={() => onNavigate(AppView.WHITELABEL)} className="hover:text-primary transition-colors">White-label License</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-widest">
          <p>© 2024 {config.siteName}. All rights reserved.</p>
          <p className="mt-4 md:mt-0">Built with 💚 for Pakistan</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
