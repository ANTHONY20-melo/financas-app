import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { View, ActivityIndicator } from 'react-native';

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
    // Se NÃO estiver logado e tentar acessar uma página que não seja a Landing Page ou o Login
    if (!session && !inAuthGroup && !isLandingPage) {
      router.replace('/auth/login' as any);
    } 
    // Se ESTIVER logado e tentar acessar a página de Login/Registro, manda para o app
    else if (session && inAuthGroup) {
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
      <Stack.Screen name="auth/login" />     {/* Login */}
      <Stack.Screen name="auth/register" />  {/* Registro */}
    </Stack>
  );
}