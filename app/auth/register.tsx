import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { supabase } from '../../supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function fazerRegisto() {
    if (!email || !password) return Alert.alert('Aviso', 'Preenche todos os campos.');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    
    if (error) Alert.alert('Erro no Registo', error.message);
    else Alert.alert('Sucesso!', 'Conta criada com sucesso.', [{ text: 'Login', onPress: () => router.push('/auth/login') }]);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.content}>
        <Ionicons name="person-add" size={60} color="#10B981" style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Começa a gerir as tuas finanças</Text>

        <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#64748B" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#64748B" secureTextEntry value={password} onChangeText={setPassword} />

        <TouchableOpacity style={styles.btnPrimary} onPress={fazerRegisto} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Criar Conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/auth/login')} style={{ marginTop: 20 }}>
          <Text style={styles.linkText}>Já tens conta? <Text style={{ color: '#10B981', fontWeight: 'bold' }}>Entrar</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  btnPrimary: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#94A3B8', textAlign: 'center', fontSize: 14 }
});