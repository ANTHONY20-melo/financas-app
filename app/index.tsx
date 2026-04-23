import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, useWindowDimensions, Animated, StatusBar, Linking } from 'react-native'; 
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import Constants from 'expo-constants';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { width } = useWindowDimensions(); // Agora a largura é detectada aqui dentro, de forma segura
  
  // Lógica do Carrossel
  const testimonialScrollRef = useRef<ScrollView>(null);
  const [scrollPos, setScrollRef] = useState(0);
  const testimonialWidth = 320; // largura do card + gap

  const entryAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Animação de flutuação para elementos decorativos
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && width > 800) {
      const interval = setInterval(() => {
        setScrollRef((prev) => {
          const next = prev + testimonialWidth;
          // Se chegar ao fim (3 cards), volta ao início
          const maxScroll = testimonialWidth * 2; 
          const finalPos = next > maxScroll ? 0 : next;
          testimonialScrollRef.current?.scrollTo({ x: finalPos, animated: true });
          return finalPos;
        });
      }, 3000); // Muda a cada 3 segundos
      return () => clearInterval(interval);
    }
  }, [width]);

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
    <Animated.View style={[styles.container, { opacity: entryAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={false} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={32} color="#38BDF8" />
          <Text style={styles.logoText}>My Money</Text>
        </View>
        <View style={styles.navLinks}>
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://wa.me/5571982998595?text=Olá! Estou no site e preciso de suporte técnico.')}
            style={styles.btnSupportHeader}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#10B981" />
            {width > 600 && <Text style={styles.btnSupportText}>Suporte</Text>}
          </TouchableOpacity>

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
        {/* Elementos Inovadores Flutuantes */}
        {Platform.OS === 'web' && (
          <>
            <Animated.View style={[styles.floatingIcon, { top: 0, left: -50, transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }] }]}>
              <Ionicons name="cash-outline" size={40} color="#10B981" />
            </Animated.View>
            <Animated.View style={[styles.floatingIcon, { bottom: 100, right: -50, transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]}>
              <Ionicons name="stats-chart-outline" size={40} color="#38BDF8" />
            </Animated.View>
          </>
        )}

        <View style={styles.badge}>
          <Animated.View style={{ opacity: floatAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.5, 1] }) }}>
            <Text style={styles.badgeText}>🚀 Inteligência Financeira Simples</Text>
          </Animated.View>
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

      {/* How it Works Section */}
      <View style={[styles.howItWorksSection, { width: width > 800 ? '80%' : '100%' }]}>
        <Text style={styles.sectionTitle}>O caminho para a sua saúde financeira</Text>
        <View style={[styles.stepsContainer, { flexDirection: width > 800 ? 'row' : 'column' }]}>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepTitle}>Registo Rápido</Text>
            <Text style={styles.stepDesc}>Crie a sua conta em segundos e comece a organizar-se hoje mesmo.</Text>
          </View>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepTitle}>Lance Gastos</Text>
            <Text style={styles.stepDesc}>Registe cada despesa no momento em que ela acontece, de forma simples.</Text>
          </View>
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepTitle}>Evolua com IA</Text>
            <Text style={styles.stepDesc}>Receba insights poderosos da nossa inteligência para economizar mais.</Text>
          </View>
        </View>
      </View>

      {/* Testimonials Section */}
      <View style={styles.testimonialsSection}>
        <Text style={styles.sectionTitle}>O que dizem os nossos utilizadores</Text>
        <ScrollView 
          ref={testimonialScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={[styles.testimonialScroll, width > 800 && { justifyContent: 'center', flexGrow: 1 }]}
          scrollEnabled={width <= 800} // Desativa manual no PC para o auto-carrossel brilhar
        >
          <View style={styles.testimonialCard}>
            <View style={styles.stars}><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /></View>
            <Text style={styles.testimonialText}>"Finalmente consegui entender para onde ia o meu dinheiro no final do mês. App nota 10!"</Text>
            <Text style={styles.testimonialAuthor}>— Ricardo M., Designer</Text>
          </View>
          <View style={styles.testimonialCard}>
            <View style={styles.stars}><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /></View>
            <Text style={styles.testimonialText}>"O Conselheiro IA me ajudou a cortar 150€ em assinaturas que eu nem usava mais."</Text>
            <Text style={styles.testimonialAuthor}>— Sofia G., Médica</Text>
          </View>
          <View style={styles.testimonialCard}>
            <View style={styles.stars}><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /><Ionicons name="star" size={16} color="#F59E0B" /></View>
            <Text style={styles.testimonialText}>"Rachar as contas do jantar pelo WhatsApp poupa-me imenso tempo de conversa."</Text>
            <Text style={styles.testimonialAuthor}>— André L., Estudante</Text>
          </View>
        </ScrollView>
      </View>

      {/* FAQ Section */}
      <View style={[styles.faqSection, { width: width > 800 ? 800 : '100%' }]}>
        <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
        <View style={styles.faqList}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Os meus dados bancários estão seguros?</Text>
            <Text style={styles.faqAnswer}>Nós não pedimos senhas de banco. Você apenas regista o que gasta manualmente, mantendo total privacidade.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>O My Money App é gratuito?</Text>
            <Text style={styles.faqAnswer}>Sim! A versão atual com todas as funcionalidades de IA e WhatsApp é 100% gratuita.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Posso exportar os meus relatórios?</Text>
            <Text style={styles.faqAnswer}>Com certeza. Dentro do painel, você pode gerar PDFs detalhados para o seu controle pessoal.</Text>
          </View>
        </View>
      </View>

      {/* Innovation: Tech Stack Section */}
      <View style={styles.techSection}>
        <Text style={styles.techLabel}>CONSTRUÍDO COM TECNOLOGIA DE PONTA</Text>
        <View style={styles.techIcons}>
          <View style={styles.techItem}><Ionicons name="shield-checkmark" size={24} color="#10B981" /><Text style={styles.techText}>Supabase RLS</Text></View>
          <View style={styles.techItem}><Ionicons name="flash" size={24} color="#F59E0B" /><Text style={styles.techText}>Real-time Sync</Text></View>
          <View style={styles.techItem}><Ionicons name="logo-react" size={24} color="#38BDF8" /><Text style={styles.techText}>Native UI</Text></View>
        </View>
      </View>

      {/* Innovation: Final CTA Banner */}
      <View style={[styles.finalCTA, { width: width > 800 ? '80%' : '90%' }]}>
        <Text style={styles.finalCTATitle}>Pronto para mudar a sua vida?</Text>
        <Text style={styles.finalCTASubtitle}>Junte-se a centenas de pessoas que já simplificaram as suas finanças.</Text>
        <TouchableOpacity style={styles.btnPrimaryLarge} onPress={handleCTA}>
          <Text style={styles.btnPrimaryTextLarge}>Criar minha conta agora</Text>
          <Ionicons name="rocket" size={20} color="#020617" style={{ marginLeft: 10 }} />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 My Money App. Todos os direitos reservados.</Text>
      </View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingBottom: 60 },
  header: { width: '100%', maxWidth: 1200, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'web' ? 20 : (Constants?.statusBarHeight || 0) + 10, backgroundColor: '#020617' },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnLogin: { padding: 10 },
  btnLoginText: { color: '#94A3B8', fontWeight: 'bold', fontSize: 16 },
  btnPrimary: { backgroundColor: '#38BDF8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPrimaryText: { color: '#020617', fontWeight: 'bold', fontSize: 16 },
  btnSupportHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 8, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  btnSupportText: { color: '#10B981', fontWeight: 'bold', fontSize: 14 },
  heroSection: { width: '100%', maxWidth: 800, alignItems: 'center', paddingHorizontal: 20, marginTop: 40, marginBottom: 100 },
  floatingIcon: { position: 'absolute', opacity: 0.4, zIndex: -1 },
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
  sectionTitle: { color: '#FFF', fontSize: 32, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
  howItWorksSection: { maxWidth: 1200, paddingHorizontal: 20, marginBottom: 100, alignItems: 'center' },
  stepsContainer: { justifyContent: 'center', gap: 30, width: '100%' },
  stepCard: { flex: 1, alignItems: 'center', padding: 20 },
  stepNumber: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  stepNumberText: { color: '#020617', fontWeight: 'bold', fontSize: 20 },
  stepTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  stepDesc: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  testimonialsSection: { width: '100%', marginBottom: 100 },
  testimonialScroll: { paddingHorizontal: 20, gap: 20 },
  testimonialCard: { backgroundColor: '#0F172A', padding: 25, borderRadius: 20, width: 300, borderWidth: 1, borderColor: '#1E293B' },
  stars: { flexDirection: 'row', gap: 2, marginBottom: 15 },
  testimonialText: { color: '#FFF', fontSize: 15, fontStyle: 'italic', marginBottom: 15, lineHeight: 24 },
  testimonialAuthor: { color: '#38BDF8', fontWeight: 'bold' },
  faqSection: { maxWidth: 800, paddingHorizontal: 20, marginBottom: 100 },
  faqList: { gap: 20 },
  faqItem: { backgroundColor: '#0F172A', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#1E293B' },
  faqQuestion: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  faqAnswer: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },
  footer: { width: '100%', borderTopWidth: 1, borderColor: '#1E293B', padding: 30, alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  techSection: { alignItems: 'center', marginBottom: 100, opacity: 0.8 },
  techLabel: { color: '#64748B', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 25 },
  techIcons: { flexDirection: 'row', gap: 30, flexWrap: 'wrap', justifyContent: 'center' },
  techItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  techText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  finalCTA: { backgroundColor: '#0F172A', padding: 50, borderRadius: 30, alignItems: 'center', marginBottom: 100, borderWidth: 1, borderColor: '#38BDF830', alignSelf: 'center' },
  finalCTATitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  finalCTASubtitle: { color: '#94A3B8', fontSize: 16, textAlign: 'center', marginBottom: 30 },
  btnPrimaryLarge: { backgroundColor: '#38BDF8', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 15 },
  btnPrimaryTextLarge: { color: '#020617', fontWeight: 'bold', fontSize: 18 }
});