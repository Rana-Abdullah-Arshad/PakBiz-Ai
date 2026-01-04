
import { STORAGE_KEYS, DEFAULT_CONFIG } from '../constants';
import { UserState, PlatformConfig, SalesRecord } from '../types';

export const storageService = {
  getUserState: (): UserState => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_STATE);
    return saved ? JSON.parse(saved) : {
      isLicensed: false,
      licenseKey: null,
      credits: 0,
      darkMode: false
    };
  },

  setUserState: (state: UserState) => {
    localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(state));
  },

  getAdminConfig: (): PlatformConfig => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  },

  setAdminConfig: (config: PlatformConfig) => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_CONFIG, JSON.stringify(config));
  },

  getSalesHistory: (): SalesRecord[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES_HISTORY);
    return saved ? JSON.parse(saved) : [];
  },

  addSalesRecord: (record: SalesRecord) => {
    const history = storageService.getSalesHistory();
    history.push(record);
    localStorage.setItem(STORAGE_KEYS.SALES_HISTORY, JSON.stringify(history));
  }
};
