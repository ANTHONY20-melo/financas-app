import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://rqhpzpaadpwjswpfpilv.supabase.co';
const supabaseAnonKey = 'sb_publishable_PTKxp_optBaXyBIXG-Idcg_JU-wUgq6';

// Criamos um adaptador de armazenamento que entende a diferença entre App e Web
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // 1. Se for Web (inclui o navegador e a Vercel)
    if (Platform.OS === 'web') {
      // Confirma que estamos no navegador e não no SSR da Vercel
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null; 
    }
    // 2. Se for App (iOS/Android), usa SEMPRE o SecureStore
    return await SecureStore.getItemAsync(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
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