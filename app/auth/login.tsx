import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Linking, Animated } from 'react-native';
import { supabase } from '../../supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Animação de Fundo
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
        ])
      )
    ]).start();
  }, []);

  async function fazerLogin() {
    if (!email || !password) return Alert.alert('Aviso', 'Preenche todos os campos.');
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (data?.user) {
      // Verificar se o utilizador está bloqueado na tabela profiles
      const { data: profile } = await supabase.from('profiles').select('is_blocked').eq('id', data.user.id).single();
      
      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        setLoading(false);
        return Alert.alert(
          'Acesso Restrito ⛔',
          'A tua conta foi suspensa por um administrador. Entra em contacto com o suporte para resolver a situação.',
          [{ text: 'Contactar Suporte', onPress: () => Linking.openURL('https://wa.me/351900000000?text=Olá, minha conta no My Money foi bloqueada.') }, { text: 'Fechar' }]
        );
      }
    }

    setLoading(false);
    if (error) Alert.alert('Erro no Login', error.message);
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={false} />
      
      {/* Partículas de Fundo Inovadoras */}
      <Animated.View style={[styles.particle, { top: '10%', left: '10%', transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]}>
        <Ionicons name="cash-outline" size={40} color="#10B98120" />
      </Animated.View>
      <Animated.View style={[styles.particle, { bottom: '15%', right: '15%', transform: [{ translateY: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }] }]}>
        <Ionicons name="card-outline" size={50} color="#38BDF820" />
      </Animated.View>
      <Animated.View style={[styles.particle, { top: '40%', right: '5%', transform: [{ translateX: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) }] }]}>
        <Ionicons name="trending-up-outline" size={30} color="#8B5CF620" />
      </Animated.View>

      <View style={styles.content}>
        <Ionicons name="wallet" size={80} color="#38BDF8" style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={styles.title}>My Money</Text>
        <Text style={styles.subtitle}>Bem-vindo de volta!</Text>

        <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#64748B" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#64748B" secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={styles.btnPrimary} onPress={fazerLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#020617" /> : <Text style={styles.btnText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')} style={{ marginTop: 20 }}>
          <Text style={styles.linkText}>Não tem conta? <Text style={{ color: '#38BDF8', fontWeight: 'bold' }}>Regista-te</Text></Text>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <TouchableOpacity onPress={() => router.replace('/')} style={{ marginTop: 15, borderTopWidth: 1, borderColor: '#334155', paddingTop: 15 }}>
            <Text style={[styles.linkText, { color: '#38BDF8' }]}>← Voltar para o site</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 20 },
  particle: { position: 'absolute', zIndex: -1 },
  content: { 
    backgroundColor: '#0F172A', 
    padding: 25, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#334155',
    maxWidth: 450,
    width: '100%',
    alignSelf: 'center'
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#1E293B', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  btnPrimary: { backgroundColor: '#38BDF8', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#020617', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#94A3B8', textAlign: 'center', fontSize: 14 }
});