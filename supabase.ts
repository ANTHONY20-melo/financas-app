import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://rqhpzpaadpwjswpfpilv.supabase.co';
const supabaseAnonKey = 'sb_publishable_PTKxp_optBaXyBIXG-Idcg_JU-wUgq6';

// Criamos um adaptador de armazenamento que entende a diferença entre App e Web
const customStorage = {
  // Adicionamos ': string' para avisar o TypeScript que a chave é um texto
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      // Verifica se existe window/localStorage (evita erro no build da Vercel)
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  // Adicionamos ': string' na chave e no valor
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  // Adicionamos ': string' na chave
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
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