
import React, { useState } from 'react';
import { UserState } from '../types';

interface SettingsProps {
  userState: UserState;
  onUpdateUserState: (state: UserState) => void;
}

const Settings: React.FC<SettingsProps> = ({ userState, onUpdateUserState }) => {
  const [message, setMessage] = useState('');

  const handleSave = () => {
    // Sync current user state settings
    onUpdateUserState({ ...userState });
    setMessage('Settings updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Settings</h1>
      
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8 transition-colors">
        {/* Account License Info */}
        <section>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded flex items-center justify-center mr-3 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h2 className="text-xl font-bold dark:text-white">Account License</h2>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl flex items-center justify-between transition-colors border border-transparent dark:border-slate-700">
            <div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status</div>
              <div className="text-green-600 dark:text-green-400 font-bold">LIFETIME ACCESS ACTIVE</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">License Key</div>
              <div className="text-slate-900 dark:text-white font-mono text-xs">{userState.licenseKey || 'N/A'}</div>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between pt-4">
          {message && <span className="text-green-600 dark:text-primary font-bold text-sm">{message}</span>}
          <button 
            onClick={handleSave}
            className="bg-slate-900 dark:bg-primary text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:opacity-90 transition-all ml-auto shadow-xl shadow-slate-900/10 dark:shadow-primary/20"
          >
            Update Settings
          </button>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <button 
          onClick={() => {
            if(confirm('Warning: This will clear all local data including your license. Continue?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="text-red-400 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          Factory Reset Data
        </button>
      </div>
    </div>
  );
};

export default Settings;
