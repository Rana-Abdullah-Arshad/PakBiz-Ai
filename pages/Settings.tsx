
import React, { useState } from 'react';
import { UserState } from '../types';

interface SettingsProps {
  userState: UserState;
  onUpdateUserState: (state: UserState) => void;
}

const Settings: React.FC<SettingsProps> = ({ userState, onUpdateUserState }) => {
  const [message, setMessage] = useState('');

  const handleSave = () => {
    onUpdateUserState({ ...userState });
    setMessage('Profile configuration synchronized!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-24 animate-in fade-in duration-700">
      <div className="mb-20">
        <div className="flex items-center space-x-3 mb-6">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
           <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em]">Local User Cluster</span>
        </div>
        <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-none">Account Logic</h1>
        <p className="text-slate-500 font-bold text-lg leading-relaxed">Manage your local deployment credentials and cluster state.</p>
      </div>
      
      <div className="space-y-12">
        {/* Access Credentials Matrix */}
        <section className="bg-white dark:bg-slate-800 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden transition-all hover:shadow-xl group">
          <div className="flex items-center mb-12">
            <div className="w-16 h-16 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl flex items-center justify-center mr-8 shadow-2xl group-hover:scale-105 transition-transform duration-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black dark:text-white tracking-tight">Access Credentials</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Platform authorized licensing</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Activation Status</div>
              <div className="flex items-center space-x-4">
                 <div className={`w-3 h-3 rounded-full ${userState.isLicensed ? 'bg-primary' : 'bg-red-500'} animate-pulse`}></div>
                 <div className={`${userState.isLicensed ? 'text-primary' : 'text-red-500'} font-black text-2xl tracking-tighter`}>
                   {userState.isLicensed ? 'LIFETIME SECURED' : 'UNAUTHORIZED'}
                 </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 transition-colors">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Platform Token</div>
              <div className="text-slate-900 dark:text-white font-mono font-bold text-sm tracking-widest break-all bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {userState.licenseKey || '0xNULL_PENDING'}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        </section>

        {/* Global Action Terminal */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-12 gap-8">
          <div className="text-center md:text-left h-8">
            {message && <span className="text-primary font-black animate-pulse uppercase text-xs tracking-[0.4em]">{message}</span>}
          </div>
          <div className="flex items-center space-x-8 w-full md:w-auto">
            <button 
              onClick={() => {
                if(confirm('TERMINAL WIPEOUT: This action will permanently erase your local license and credit ledger. Continue?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-10 py-6 text-[10px] font-black text-red-500 uppercase tracking-[0.3em] hover:text-red-400 hover:bg-red-500/5 rounded-3xl transition-all"
            >
              Destruct Cluster
            </button>
            <button 
              onClick={handleSave}
              className="flex-grow md:flex-grow-0 bg-primary text-white px-20 py-7 rounded-[3rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all"
            >
              Sync Strategy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
