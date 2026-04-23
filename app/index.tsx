import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native'; // Adicionado useWindowDimensions
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { width } = useWindowDimensions(); // Agora a largura é detectada aqui dentro, de forma segura

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  const handleCTA = () => {
    if (isLoggedIn) {
      router.push('/dashboard' as any);
    } else {
      router.push('/auth/register' as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={32} color="#38BDF8" />
          <Text style={styles.logoText}>My Money</Text>
        </View>
        <View style={styles.navLinks}>
          {isLoggedIn ? (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/dashboard' as any)}>
              <Text style={styles.btnPrimaryText}>Ir para o Painel</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => router.push('/auth/login' as any)} style={styles.btnLogin}>
                <Text style={styles.btnLoginText}>Entrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/auth/register' as any)}>
                <Text style={styles.btnPrimaryText}>Criar Conta</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🚀 Inteligência Financeira Simples</Text>
        </View>
        <Text style={[styles.heroTitle, { fontSize: width > 600 ? 56 : 40 }]}>
          O controle do seu dinheiro,{'\n'}
          <Text style={{ color: '#38BDF8' }}>na palma da sua mão.</Text>
        </Text>
        <Text style={[styles.heroSubtitle, { fontSize: width > 600 ? 20 : 16 }]}>
          Gerencie despesas, divida contas pelo WhatsApp e receba dicas do nosso Conselheiro IA para alcançar as suas metas financeiras.
        </Text>
        
        <TouchableOpacity style={styles.heroBtn} onPress={handleCTA}>
          <Text style={styles.heroBtnText}>{isLoggedIn ? "Acessar as minhas finanças" : "Começar Agora - É Grátis"}</Text>
          <Ionicons name="arrow-forward" size={20} color="#020617" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      </View>

      {/* Features Section */}
      <View style={[styles.featuresSection, { flexDirection: width > 800 ? 'row' : 'column' }]}>
        <View style={[styles.featureCard, { width: width > 800 ? '30%' : '100%' }]}>
          <Ionicons name="pie-chart" size={40} color="#10B981" />
          <Text style={styles.featureTitle}>Gráficos Visuais</Text>
          <Text style={styles.featureDesc}>Acompanhe receitas e despesas com gráficos fáceis de entender.</Text>
        </View>
        
        <View style={[styles.featureCard, { width: width > 800 ? '30%' : '100%' }]}>
          <Ionicons name="logo-whatsapp" size={40} color="#10B981" />
          <Text style={styles.featureTitle}>Rache a Conta</Text>
          <Text style={styles.featureDesc}>Divida as despesas com amigos enviando a cobrança direto no WhatsApp.</Text>
        </View>

        <View style={[styles.featureCard, { width: width > 800 ? '30%' : '100%' }]}>
          <Ionicons name="sparkles" size={40} color="#8B5CF6" />
          <Text style={styles.featureTitle}>Conselheiro IA</Text>
          <Text style={styles.featureDesc}>Receba alertas automáticos e dicas baseadas nos seus hábitos de consumo.</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 My Money App. Todos os direitos reservados.</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, alignItems: 'center' },
  header: { width: '100%', maxWidth: 1200, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginTop: Platform.OS === 'web' ? 0 : 40 },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  btnLogin: { padding: 10 },
  btnLoginText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 16 },
  btnPrimary: { backgroundColor: '#38BDF8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPrimaryText: { color: '#020617', fontWeight: 'bold', fontSize: 16 },
  heroSection: { width: '100%', maxWidth: 800, alignItems: 'center', paddingHorizontal: 20, marginTop: 60, marginBottom: 80 },
  badge: { backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  badgeText: { color: '#38BDF8', fontWeight: 'bold', fontSize: 14 },
  heroTitle: { color: '#FFF', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  heroSubtitle: { color: '#94A3B8', textAlign: 'center', lineHeight: 28, marginBottom: 40, paddingHorizontal: 20 },
  heroBtn: { backgroundColor: '#38BDF8', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  heroBtnText: { color: '#020617', fontWeight: 'bold', fontSize: 18 },
  featuresSection: { width: '100%', maxWidth: 1200, justifyContent: 'center', alignItems: 'center', gap: 20, paddingHorizontal: 20, marginBottom: 80 },
  featureCard: { backgroundColor: '#0F172A', padding: 30, borderRadius: 20, maxWidth: 350, borderWidth: 1, borderColor: '#1E293B', alignItems: 'center' },
  featureTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginTop: 15, marginBottom: 10, textAlign: 'center' },
  featureDesc: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  footer: { width: '100%', borderTopWidth: 1, borderColor: '#1E293B', padding: 30, alignItems: 'center', marginTop: 'auto' },
  footerText: { color: '#64748B', fontSize: 14 }
});