import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { supabase } from '../supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

interface UserProfile {
  id: string;
  email: string;
  is_blocked: boolean;
}

export default function AdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    // Assumindo que tens uma tabela 'profiles' sincronizada com auth.users
    const { data, error } = await supabase.from('profiles').select('id, email, is_blocked').order('email');
    
    if (error) {
      Alert.alert("Erro", "Não foi possível carregar os utilizadores.");
    } else if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u));
    } else {
      Alert.alert("Erro", "Falha ao atualizar status do utilizador.");
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Admin Panel 🛡️</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.statsOverview}>
        <Ionicons name="people-circle" size={40} color="#38BDF8" />
        <Text style={styles.statsTitle}>{users.length} Contas Criadas</Text>
      </View>

      <Text style={styles.sectionLabel}>Gestão de Acessos</Text>
      
      {users.map(user => (
        <View key={user.id} style={[styles.userCard, { borderColor: user.is_blocked ? '#EF4444' : '#334155' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={[styles.userStatus, { color: user.is_blocked ? '#EF4444' : '#10B981' }]}>
              {user.is_blocked ? 'Acesso Bloqueado' : 'Acesso Ativo'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.blockBtn, { backgroundColor: user.is_blocked ? '#10B98120' : '#EF444420' }]} 
            onPress={() => toggleBlockUser(user.id, user.is_blocked)}
          >
            <Ionicons 
              name={user.is_blocked ? "lock-open-outline" : "lock-closed-outline"} 
              size={20} 
              color={user.is_blocked ? '#10B981' : '#EF4444'} 
            />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchAdminData}>
        <Text style={styles.refreshText}>Atualizar Dados</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: Constants.statusBarHeight + 20, 
    marginBottom: 30 
  },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  statsOverview: { backgroundColor: '#0F172A', padding: 30, borderRadius: 25, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#334155' },
  statsTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  sectionLabel: { color: '#94A3B8', fontSize: 14, fontWeight: 'bold', marginBottom: 15, textTransform: 'uppercase' },
  userCard: { backgroundColor: '#0F172A', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1 },
  userEmail: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  userStatus: { fontSize: 12, marginTop: 4, fontWeight: 'bold' },
  blockBtn: { padding: 10, borderRadius: 10 },
  refreshBtn: { 
    backgroundColor: '#38BDF8', 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginVertical: 40 
  },
  refreshText: { color: '#020617', fontWeight: 'bold', fontSize: 16 }
});