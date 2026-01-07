
import { createClient } from '@supabase/supabase-js';
import { PlatformConfig } from '../types';

const SUPABASE_URL = 'https://gemfzewinfekhfqfcnqs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C3gLQ-y4WOwvXhBwOzuE-g_7NY0tZXa';

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseService = {
  /**
   * Fetches the global platform configuration from Supabase.
   */
  async fetchConfig(): Promise<PlatformConfig | null> {
    try {
      const { data, error } = await supabase
        .from('platform_config')
        .select('config')
        .eq('id', 1)
        .single();

      if (error) {
        console.warn('Supabase fetch error (expected if table empty):', error.message);
        return null;
      }

      // Return null if data exists but config is empty/default
      if (!data?.config || Object.keys(data.config).length === 0) {
        return null;
      }

      return data.config as PlatformConfig;
    } catch (err) {
      console.error('Supabase Service Error:', err);
      return null;
    }
  },

  /**
   * Saves the updated platform configuration to Supabase.
   * This updates the settings for ALL users of the platform globally.
   */
  async saveConfig(config: PlatformConfig): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('platform_config')
        .upsert({ 
          id: 1, 
          config: config,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase Save Error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Supabase Service Save Error:', err);
      return false;
    }
  }
};
