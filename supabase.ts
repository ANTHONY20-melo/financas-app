import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://rqhpzpaadpwjswpfpilv.supabase.co';
const supabaseAnonKey = 'sb_publishable_PTKxp_optBaXyBIXG-Idcg_JU-wUgq6';

// Criamos um adaptador de armazenamento que entende a diferença entre App e Web
const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' || typeof window === 'undefined') {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS !== 'web' && typeof window !== 'undefined') {
      return await SecureStore.setItemAsync(key, value);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS !== 'web' && typeof window !== 'undefined') {
      return await SecureStore.deleteItemAsync(key);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
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