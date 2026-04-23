import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Linking } from 'react-native';
import { supabase } from '../../supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={false} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', padding: 20 },
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