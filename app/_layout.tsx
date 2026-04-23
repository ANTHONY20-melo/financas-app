import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!supabase?.auth) {
      setIsReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsReady(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'auth';
    const isLandingPage = (segments as string[]).length === 0;

    if (!session) {
      // Caso Mobile: Se não estiver logado, obriga ir para o Login (ignora Landing Page)
      if (Platform.OS !== 'web') {
        if (!inAuthGroup) {
          router.replace('/auth/login' as any);
        }
      } 
      // Caso Web: Permite Landing Page, mas protege outras rotas
      else {
        if (!inAuthGroup && !isLandingPage) {
          router.replace('/auth/login' as any);
        }
      }
    } else if (session && inAuthGroup) {
      // Se já estiver logado e tentar entrar em Login/Register, vai para o Dashboard
      router.replace('/dashboard' as any);
    }
  }, [session, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />          {/* Landing Page Pública */}
      <Stack.Screen name="dashboard" />      {/* Seu App Real */}
      <Stack.Screen name="admin" />          {/* Painel Admin */}
      <Stack.Screen name="auth/login" />     {/* Login */}
      <Stack.Screen name="auth/register" />  {/* Registro */}
    </Stack>
  );
}