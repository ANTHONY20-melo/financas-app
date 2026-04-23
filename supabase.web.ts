import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqhpzpaadpwjswpfpilv.supabase.co';
const supabaseAnonKey = 'sb_publishable_PTKxp_optBaXyBIXG-Idcg_JU-wUgq6';

// Na Web, usamos o armazenamento padrão do navegador
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});