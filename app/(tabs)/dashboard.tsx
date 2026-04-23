import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, 
  Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform,
  Dimensions, FlatList, ScrollView, Switch, ActivityIndicator, StatusBar, LayoutAnimation, UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from "react-native-chart-kit";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Linking from 'expo-linking';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase';
import Constants from 'expo-constants';

// Habilitar animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface Transacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  data: string;
  user_id: string;
}

const CATEGORIAS_DESPESA = [
  { label: 'Alimentação', icon: 'restaurant' },
  { label: 'Transporte', icon: 'car' },
  { label: 'Lazer', icon: 'beer' },
  { label: 'Contas', icon: 'receipt' },
  { label: 'Outros', icon: 'ellipsis-horizontal' },
];

const DASHBOARD_MAX_WIDTH = 1200;
const SIDEBAR_WIDTH = 300;
const isPC = Platform.OS === 'web' && width > 1024;

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export default function HomeScreen() {
  const router = useRouter();
  const scrollMesesRef = useRef<ScrollView>(null);

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [descricao, setDescricao] = useState('');
  const [metaPoupanca, setMetaPoupanca] = useState('500'); // Nova meta padrão
  const [valor, setValor] = useState('');
  const [tipoAtual, setTipoAtual] = useState('receita');
  const [categoriaSel, setCategoriaSel] = useState('Geral');
  const [modoExtrato, setModoExtrato] = useState<'mensal' | 'geral'>('mensal');
  const [dataRegistro, setDataRegistro] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [isDark, setIsDark] = useState(true);
  
  const [recorrente, setRecorrente] = useState(false);
  const [parcelas, setParcelas] = useState('2');

  const [filtroLista, setFiltroLista] = useState('tudo'); 
  const [busca, setBusca] = useState('');

  const [modalIAVisivel, setModalIAVisivel] = useState(false);
  const [settingsModalVisivel, setSettingsModalVisivel] = useState(false);
  const [dicaIA, setDicaIA] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [splitModalVisivel, setSplitModalVisivel] = useState(false);
  const [splitTransacao, setSplitTransacao] = useState<Transacao | null>(null);
  const [qtdPessoas, setQtdPessoas] = useState('2');

  const cores = {
    fundo: isDark ? '#020617' : '#F8FAFC',
    texto: isDark ? '#FFF' : '#0F172A',
    card: isDark ? '#1E293B' : '#FFF',
    cardSecundario: isDark ? '#0F172A' : '#F1F5F9',
    subtexto: isDark ? '#94A3B8' : '#64748B',
    borda: isDark ? '#334155' : '#E2E8F0'
  };

  useEffect(() => { 
    const init = async () => {
      await fetchTransacoes();
      setTimeout(() => centrarMes(mesSelecionado), 500);
    };
    init();
  }, []);

  const fetchTransacoes = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserEmail(session.user.email || '');
      
      // Busca perfil do usuário
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      setUserName(profile?.full_name || session.user.email?.split('@')[0] || '');

      const { data } = await supabase.from('transacoes').select('*').eq('user_id', session.user.id).order('id', { ascending: false });
      if (data) setTransacoes(data);
    }
    setLoading(false);
  };

  const confirmarLogout = () => {
    const logout = async () => {
      await supabase.auth.signOut();
      if (Platform.OS === 'web') {
        router.replace('/');
      } else {
        router.replace('/auth/login');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm("Tens a certeza que desejas encerrar a sessão?")) {
        logout();
      }
    } else {
      Alert.alert(
        "Sair da Conta",
        "Tens a certeza que desejas encerrar a sessão?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Sair", style: "destructive", onPress: logout }
        ]
      );
    }
  };

  const atualizarPerfil = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        full_name: userName,
        email: userEmail // Incluído para garantir que o perfil seja criado/atualizado corretamente
      });

      if (error) throw error;
      setIsEditingProfile(false);
      
      if (Platform.OS === 'web') window.alert("Perfil atualizado com sucesso!");
      else Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (err: any) { 
      if (Platform.OS === 'web') window.alert("Erro ao atualizar perfil.");
      else Alert.alert("Erro", "Não foi possível atualizar o perfil."); 
    }
  };

  const salvar = async () => {
    if (!descricao || !valor) return Alert.alert("Aviso", "Preencha a descrição e o valor.");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      
      const transacoesParaInserir = [];
      const quantidadeMeses = recorrente ? (parseInt(parcelas) || 1) : 1;
      
      for (let i = 0; i < quantidadeMeses; i++) {
        const mesCalculado = dataRegistro.getMonth() + (recorrente ? i + 1 : i);
        const dataFutura = new Date(dataRegistro.getFullYear(), mesCalculado, dataRegistro.getDate());
        const dataFormatada = `${String(dataFutura.getDate()).padStart(2, '0')}/${String(dataFutura.getMonth() + 1).padStart(2, '0')}/${dataFutura.getFullYear()}`;

        transacoesParaInserir.push({
          descricao: recorrente ? `${descricao} (${i + 1}/${quantidadeMeses})` : descricao,
          valor: parseFloat(valor.replace(',', '.')),
          tipo: tipoAtual,
          categoria: tipoAtual === 'despesa' ? categoriaSel : 'Recebimento',
          data: dataFormatada,
          user_id: session.user.id,
        });
      }

      const { data, error } = await supabase.from('transacoes').insert(transacoesParaInserir).select();
      if (error) throw error;
      if (data) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        fetchTransacoes();
        setModalVisivel(false);
        setDescricao(''); setValor(''); setRecorrente(false);
        setParcelas('2'); setDataRegistro(new Date());
        Keyboard.dismiss();
      }
    } catch (err: any) { Alert.alert("Erro", err.message || "Erro ao gravar."); }
  };

  const apagarTransacao = async (id: number) => {
    Alert.alert("Apagar", "Remover este registo?", [
      { text: "Não", style: "cancel" },
      { text: "Sim", style: "destructive", onPress: async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const { error } = await supabase.from('transacoes').delete().eq('id', id);
        if (!error) setTransacoes(transacoes.filter(t => t.id !== id));
      }}
    ]);
    const deletar = async () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      const { error } = await supabase.from('transacoes').delete().eq('id', id);
      if (!error) setTransacoes(transacoes.filter(t => t.id !== id));
    };

    if (Platform.OS === 'web') {
      if (confirm("Remover este registo?")) {
        deletar();
      }
    } else {
      Alert.alert("Apagar", "Remover este registo?", [
        { text: "Não", style: "cancel" },
        { text: "Sim", style: "destructive", onPress: deletar }
      ]);
    }
  };

  const centrarMes = (index: number) => {
    setMesSelecionado(index);
    scrollMesesRef.current?.scrollTo({ x: index * 90 - (width / 2) + 45, animated: true });
  };

  const { transacoesFiltradas, receitas, despesas, saldo, percentualGasto, corSaude } = useMemo(() => {
    const filtradas = transacoes.filter(t => {
      if (modoExtrato === 'geral') return true;
      if (!t.data) return false;
      const p = t.data.split('/');
      return (parseInt(p[1], 10) - 1) === mesSelecionado && parseInt(p[2], 10) === anoSelecionado;
    });

    const rec = filtradas.filter(t => t.tipo === 'receita').reduce((acc, curr) => acc + curr.valor, 0);
    const des = filtradas.filter(t => t.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
    const sal = rec - des;
    const perc = rec > 0 ? Math.min((des / rec) * 100, 100) : (des > 0 ? 100 : 0);
    
    let cor = '#10B981'; 
    if (perc > 50) cor = '#F59E0B'; 
    if (perc > 85) cor = '#EF4444';

    return { transacoesFiltradas: filtradas, receitas: rec, despesas: des, saldo: sal, percentualGasto: perc, corSaude: cor };
  }, [transacoes, mesSelecionado, anoSelecionado, modoExtrato]);

  const listaExibida = useMemo(() => {
    return transacoesFiltradas.filter(t => {
      const bateTipo = filtroLista === 'tudo' || t.tipo === filtroLista;
      const bateBusca = t.descricao.toLowerCase().includes(busca.toLowerCase());
      return bateTipo && bateBusca;
    });
  }, [transacoesFiltradas, filtroLista, busca]);

  const partilharRelatorio = () => {
    const relatorio = `📊 *Resumo de ${MESES[mesSelecionado]} ${anoSelecionado}*\n\n📈 Receitas: ${formatarMoeda(receitas)}\n📉 Despesas: ${formatarMoeda(despesas)}\n💰 Saldo Final: ${formatarMoeda(saldo)}\n\n_Gerado por My Money App_`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(relatorio)}`);
  };

  const exportarParaPDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #334155; }
            h1 { color: #020617; text-align: center; }
            .header { margin-bottom: 30px; border-bottom: 2px solid #38BDF8; padding-bottom: 10px; }
            .summary { display: flex; justify-content: space-between; margin-bottom: 30px; background: #F1F5F9; padding: 15px; borderRadius: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #E2E8F0; padding: 10px; color: #64748B; }
            td { padding: 10px; border-bottom: 1px solid #F1F5F9; }
            .receita { color: #10B981; font-weight: bold; }
            .despesa { color: #EF4444; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94A3B8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório Financeiro</h1>
            <p style="text-align: center;">${MESES[mesSelecionado]} de ${anoSelecionado}</p>
          </div>
          
          <div class="summary">
            <div><strong>Receitas:</strong> ${formatarMoeda(receitas)}</div>
            <div><strong>Despesas:</strong> ${formatarMoeda(despesas)}</div>
            <div><strong>Saldo Final:</strong> ${formatarMoeda(saldo)}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              ${transacoesFiltradas.map(t => `
                <tr>
                  <td>${t.data}</td>
                  <td>${t.descricao}</td>
                  <td>${t.categoria || 'Geral'}</td>
                  <td class="${t.tipo}">${t.tipo === 'receita' ? '+' : '-'} ${formatarMoeda(t.valor)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">Gerado por My Money App - Controlo Financeiro Inteligente</div>
        </body>
      </html>
    `;

    try {
      if (Platform.OS === 'web') {
        // No PC, abre o diálogo de impressão que permite salvar como PDF
        await Print.printAsync({ html: htmlContent });
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível gerar o PDF.");
    }
  };

  const racharNoWhatsApp = () => {
    if (!splitTransacao) return;
    const pessoas = parseInt(qtdPessoas) || 1;
    const valorDividido = (Number(splitTransacao.valor) / pessoas).toFixed(2);
    const mensagem = `Fala pessoal! 👋\nA despesa com *${splitTransacao.descricao}* ficou em R$ ${valorDividido} para cada um. 💸`;
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(mensagem)}`);
    setSplitModalVisivel(false);
  };

  const analisarComIA = () => {
    if (transacoesFiltradas.length === 0) {
      if (Platform.OS === 'web') {
        window.alert("Ops! Sem dados para analisar.");
      } else {
        Alert.alert("Ops", "Sem dados para analisar.");
      }
      return;
    }
    setModalIAVisivel(true);
    setIsAILoading(true);
    setTimeout(() => {
      setDicaIA(percentualGasto > 85 ? "Cuidado! Estás a gastar quase tudo o que ganhas. Recomendo corte os seus gastos não essenciais rapidamente." : "As tuas finanças estão controladas! Continua a poupar para o teu futuro.");
      setIsAILoading(false);
    }, 1500);
  };

  const chartData = useMemo(() => [
    { name: 'Receitas', amount: receitas, color: '#10B981', legendFontColor: cores.subtexto, legendFontSize: 12 },
    { name: 'Despesas', amount: despesas, color: '#EF4444', legendFontColor: cores.subtexto, legendFontSize: 12 }
  ], [receitas, despesas, isDark]);

  const getIconeCategoria = (categoria: string, tipo: string) => {
    if (tipo === 'receita') return 'trending-up';
    switch (categoria) {
      case 'Alimentação': return 'restaurant';
      case 'Transporte': return 'car';
      case 'Lazer': return 'beer';
      case 'Contas': return 'receipt';
      case 'Saúde': return 'medkit';
      case 'Educação': return 'book';
      default: return 'cart';
    }
  };

  const renderHeaderFixo = () => (
    <View style={styles.headerFixoContainer}>
      <View style={styles.headerContainer}>
        <Text style={[styles.titulo, { color: cores.texto }]}>My Money</Text>
        {!isPC && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => setSettingsModalVisivel(true)} style={[styles.btnTop, { backgroundColor: cores.cardSecundario, borderColor: cores.borda }]}>
              <Ionicons name="settings-outline" size={24} color="#38BDF8" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {modoExtrato === 'mensal' && (
        <>
      <View style={styles.anoContainer}>
        <TouchableOpacity onPress={() => setAnoSelecionado(anoSelecionado - 1)} style={styles.btnAno}><Ionicons name="chevron-back" size={20} color={cores.subtexto} /></TouchableOpacity>
        <Text style={[styles.txtAno, { color: cores.texto }]}>{anoSelecionado}</Text>
        <TouchableOpacity onPress={() => setAnoSelecionado(anoSelecionado + 1)} style={styles.btnAno}><Ionicons name="chevron-forward" size={20} color={cores.subtexto} /></TouchableOpacity>
      </View>

      <View style={styles.mesesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} ref={scrollMesesRef}>
          {MESES.map((mes, index) => (
            <TouchableOpacity key={index} style={[styles.btnMes, mesSelecionado === index ? styles.btnMesAtivo : { backgroundColor: cores.cardSecundario }]} onPress={() => centrarMes(index)}>
              <Text style={[styles.txtMes, mesSelecionado === index ? styles.txtMesAtivo : { color: cores.subtexto }]}>{mes}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
        </>
      )}
    </View>
  );

  const renderResumoLista = () => (
    <View>
      <View style={styles.resumoContainer}>
        <View style={styles.extratoSelector}>
          <TouchableOpacity 
            onPress={() => setModoExtrato('mensal')} 
            style={[styles.extratoBtn, modoExtrato === 'mensal' && { borderBottomColor: '#38BDF8', borderBottomWidth: 2 }]}>
            <Text style={[styles.extratoBtnTxt, { color: modoExtrato === 'mensal' ? '#38BDF8' : cores.subtexto }]}>Mês Atual</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setModoExtrato('geral')} 
            style={[styles.extratoBtn, modoExtrato === 'geral' && { borderBottomColor: '#38BDF8', borderBottomWidth: 2 }]}>
            <Text style={[styles.extratoBtnTxt, { color: modoExtrato === 'geral' ? '#38BDF8' : cores.subtexto }]}>Extrato Geral</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.cartaoSaldo, { backgroundColor: cores.cardSecundario }]}>
          <Text style={styles.cartaoTitulo}>
            {modoExtrato === 'mensal' ? `Saldo de ${MESES[mesSelecionado]}` : 'Saldo Total Acumulado'}
          </Text>
          <Text style={[styles.cartaoValor, { color: cores.texto }]}>{formatarMoeda(saldo)}</Text>
          
          <View style={styles.barraSaudeContainer}>
            <View style={[styles.barraSaudePreenchimento, { width: `${percentualGasto}%`, backgroundColor: corSaude }]} />
          </View>
          <Text style={styles.txtSaude}>Gasto de {percentualGasto.toFixed(0)}% das receitas</Text>
          
          <TouchableOpacity style={styles.btnIA} onPress={analisarComIA}>
            <Ionicons name="sparkles" size={16} color="#FFF" />
            <Text style={styles.txtIA}>Conselheiro IA</Text>
          </TouchableOpacity>
        </View>
  
        <View style={styles.linhaResumo}>
          <View style={[styles.cartaoPequeno, { backgroundColor: cores.cardSecundario }]}><Ionicons name="arrow-up-circle" size={24} color="#10B981" /><Text style={styles.textoVerde}>{formatarMoeda(receitas)}</Text></View>
          <View style={[styles.cartaoPequeno, { backgroundColor: cores.cardSecundario }]}><Ionicons name="arrow-down-circle" size={24} color="#EF4444" /><Text style={styles.textoVermelho}>{formatarMoeda(despesas)}</Text></View>
        </View>
      </View>

      {(receitas > 0 || despesas > 0) && (
        <View style={[styles.graficoContainer, { backgroundColor: cores.cardSecundario }]}>
          <PieChart 
            key="dashboard-pie-chart"
            data={chartData}
            width={width - 40} 
            height={120} 
            chartConfig={{ color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }} 
            accessor={"amount"} 
            backgroundColor={"transparent"} 
            paddingLeft={"15"} 
            absolute 
          />
        </View>
      )}

      <View style={[styles.searchBar, { backgroundColor: cores.cardSecundario, borderColor: cores.borda }]}>
        <Ionicons name="search-outline" size={20} color={cores.subtexto} />
        <TextInput 
          style={[styles.searchInput, { color: cores.texto }]} 
          placeholder="Procurar transação..." placeholderTextColor={cores.subtexto} value={busca} onChangeText={setBusca} />
      </View>

      <View style={styles.filtrosContainer}>
        {['tudo', 'receita', 'despesa'].map((tipo) => (
          <TouchableOpacity key={tipo} onPress={() => setFiltroLista(tipo)} style={[styles.chipFiltro, filtroLista === tipo ? {backgroundColor: tipo === 'tudo' ? '#38BDF8' : (tipo === 'receita' ? '#10B981' : '#EF4444')} : {backgroundColor: cores.cardSecundario}]}>
            <Text style={[styles.txtChip, filtroLista === tipo && {color: '#FFF'}]}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSettingsContent = (isInSidebar = false) => (
    <View style={isInSidebar ? styles.sidebarInner : styles.settingsSection}>
      {isInSidebar && (
        <View style={{ backgroundColor: '#1E293B', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#334155' }}>
          <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 12, marginBottom: 10 }}>META DE POUPANÇA</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
             <Text style={{ color: '#FFF', fontSize: 14 }}>{formatarMoeda(saldo > 0 ? saldo : 0)}</Text>
             <Text style={{ color: cores.subtexto, fontSize: 12 }}>Alvo: {formatarMoeda(Number(metaPoupanca))}</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#020617', borderRadius: 3, overflow: 'hidden' }}>
             <View style={{ height: '100%', backgroundColor: '#10B981', width: `${Math.min((Math.max(saldo, 0) / Number(metaPoupanca)) * 100, 100)}%` }} />
          </View>
          <TextInput style={{ color: '#38BDF8', fontSize: 11, marginTop: 10, borderBottomWidth: 1, borderColor: '#334155' }} value={metaPoupanca} onChangeText={setMetaPoupanca} placeholder="Definir nova meta" keyboardType="numeric" />
        </View>
      )}

      <View style={[styles.profileHeader, isInSidebar && { marginBottom: 20 }]}>
        <TouchableOpacity 
          onPress={() => setIsEditingProfile(!isEditingProfile)}
          style={[styles.profileAvatar, { backgroundColor: isDark ? '#38BDF820' : '#38BDF810' }]}
        >
          <Ionicons name="person" size={isInSidebar ? 32 : 40} color="#38BDF8" />
          <View style={styles.editBadge}><Ionicons name="create" size={12} color="#FFF" /></View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          {isEditingProfile ? (
            <View style={{ gap: 5 }}>
              <TextInput 
                style={[styles.inputInline, { color: cores.texto, borderColor: '#38BDF8' }]} 
                value={userName} 
                onChangeText={setUserName} 
                placeholder="Teu nome" 
                placeholderTextColor={cores.subtexto} 
              />
              <TouchableOpacity onPress={atualizarPerfil} style={styles.btnSaveProfile}><Text style={{ color: '#020617', fontWeight: 'bold', fontSize: 12 }}>Guardar Alterações</Text></TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.profileLabel, { color: cores.subtexto, fontSize: isInSidebar ? 12 : 14 }]}>
                {isInSidebar ? 'Utilizador' : 'Bem-vindo,'}
              </Text>
              <Text style={[styles.profileEmail, { color: cores.texto, fontSize: isInSidebar ? 14 : 18 }]} numberOfLines={1}>
                {userName}
              </Text>
            </>
          )}
        </View>
      </View>

      {isInSidebar && (
        <View style={{ backgroundColor: '#38BDF810', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#38BDF820' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <Ionicons name="bulb-outline" size={16} color="#38BDF8" />
            <Text style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: 12 }}>DICA DO DIA</Text>
          </View>
          <Text style={{ color: cores.subtexto, fontSize: 13, lineHeight: 18 }}>Poupe pelo menos 10% do seu rendimento antes de começar a gastar.</Text>
        </View>
      )}

      {isInSidebar && (
        <TouchableOpacity 
          style={[styles.settingsRow, { borderColor: cores.borda }]} 
          onPress={() => Linking.openURL(`https://wa.me/5571982998595?text=${encodeURIComponent(
            `Olá Suporte! 👋\n\nPreciso de ajuda com o My Money App.\nUtilizador: ${userName}\nE-mail: ${userEmail}`
          )}`)}
        >
          <View style={styles.settingsInfo}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#10B981" />
            <Text style={[styles.settingsText, { color: cores.texto }]}>Suporte Técnico</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.miniStatsRow, { backgroundColor: cores.cardSecundario, borderColor: cores.borda, padding: isInSidebar ? 12 : 15, marginBottom: 20 }]}>
        <View style={styles.miniStatItem}>
          <Text style={[styles.miniStatLabel, { fontSize: isInSidebar ? 10 : 11 }]}>Saldo</Text>
          <Text style={[styles.miniStatValue, { color: saldo >= 0 ? '#10B981' : '#EF4444', fontSize: isInSidebar ? 14 : 15 }]}>{formatarMoeda(saldo)}</Text>
        </View>
        <View style={[styles.verticalDivider, { backgroundColor: cores.borda }]} />
        <View style={styles.miniStatItem}>
          <Text style={[styles.miniStatLabel, { fontSize: isInSidebar ? 10 : 11 }]}>Gastos</Text>
          <Text style={[styles.miniStatValue, { color: cores.texto, fontSize: isInSidebar ? 14 : 15 }]}>{formatarMoeda(despesas)}</Text>
        </View>
      </View>

      <View style={[styles.settingsRow, { borderColor: cores.borda }]}>
        <View style={styles.settingsInfo}>
          <Ionicons name={isDark ? "moon" : "sunny"} size={22} color="#38BDF8" />
          <Text style={[styles.settingsText, { color: cores.texto }]}>Modo Escuro</Text>
        </View>
        <Switch value={isDark} onValueChange={setIsDark} trackColor={{ false: "#64748B", true: "#38BDF8" }} />
      </View>

      {userEmail === 'admin@admin.com' && (
        <TouchableOpacity style={[styles.settingsRow, { borderColor: cores.borda }]} onPress={() => router.push('/admin' as any)}>
          <View style={styles.settingsInfo}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#8B5CF6" />
            <Text style={[styles.settingsText, { color: cores.texto }]}>Painel Admin</Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.settingsRow, { borderColor: cores.borda }]} onPress={exportarParaPDF}>
        <View style={styles.settingsInfo}>
          <Ionicons name="document-text-outline" size={22} color="#38BDF8" />
          <Text style={[styles.settingsText, { color: cores.texto }]}>Exportar PDF</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.settingsRow, { borderColor: cores.borda }]} onPress={confirmarLogout}>
        <View style={styles.settingsInfo}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={[styles.settingsText, { color: '#EF4444' }]}>Sair</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: cores.fundo, flexDirection: isPC ? 'row' : 'column' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {isPC && (
        <View style={[styles.sidebarContainer, { backgroundColor: cores.card, borderColor: cores.borda }]}>
          <Text style={[styles.logoTextSidebar, { color: cores.texto }]}>My Money</Text>
          {renderSettingsContent(true)}
        </View>
      )}
      
      <View style={{ flex: 1, backgroundColor: cores.fundo }}>
        {renderHeaderFixo()}

      <FlatList
        data={listaExibida} 
        keyExtractor={(item) => item.id.toString()} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ backgroundColor: cores.fundo }}
        ListHeaderComponent={renderResumoLista}
        ListEmptyComponent={<Text style={{ color: cores.subtexto, textAlign: 'center', marginTop: 40, fontSize: 16 }}>Nenhum registo encontrado.</Text>}
        refreshing={loading}
        onRefresh={fetchTransacoes}
        renderItem={({ item }) => (
          <View style={styles.containerItem}>
            <View style={[styles.itemLista, { backgroundColor: cores.cardSecundario, borderColor: cores.borda }]}>
              <View style={[styles.iconCategory, { backgroundColor: item.tipo === 'receita' ? '#10B98120' : '#EF444420' }]}>
                <Ionicons 
                  name={getIconeCategoria(item.categoria, item.tipo) as any} 
                  size={22} 
                  color={item.tipo === 'receita' ? '#10B981' : '#EF4444'} 
                />
              </View>
              <View style={{ flex: 1, justifyContent: 'center', paddingRight: 15 }}>
                <Text style={[styles.itemDesc, { color: cores.texto }]} numberOfLines={1}>{item.descricao}</Text>
                <Text style={styles.itemData}>{item.data} • {item.categoria || 'Geral'}</Text>
              </View>
              <View style={styles.itemDireita}>
                <Text style={[styles.itemValor, { color: item.tipo === 'receita' ? '#10B981' : '#EF4444' }]}>{item.tipo === 'receita' ? '+' : '-'} {formatarMoeda(item.valor)}</Text>
                <View style={styles.itemAcoes}>
                  {item.tipo === 'despesa' ? (
                    <TouchableOpacity onPress={() => { setSplitTransacao(item); setQtdPessoas('2'); setSplitModalVisivel(true); }} style={styles.btnAcaoLista}>
                      <Ionicons name="people-outline" size={20} color="#38BDF8" />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 28 }} /> 
                  )}
                  <TouchableOpacity onPress={() => apagarTransacao(item.id)} style={styles.btnAcaoLista}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      />
      </View>
      
      <TouchableOpacity style={[styles.fab, isPC && { right: 50, bottom: 50 }]} onPress={() => setModalVisivel(true)}>
        <Ionicons name="add" size={30} color="#020617" />
      </TouchableOpacity>

      <Modal visible={modalVisivel} animationType={isPC ? "fade" : "slide"} transparent>
        <View style={styles.modalOverlay}>
          {/* No PC, removemos o Touchable que captura cliques indevidamente e centralizamos o modal */}
          <TouchableWithoutFeedback onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
              enabled={Platform.OS !== 'web'}
              style={[styles.modalBody, isPC && { borderRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }]}
              contentContainerStyle={{ alignItems: 'center' }}
            >
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                   <View style={{ backgroundColor: '#38BDF820', padding: 8, borderRadius: 10 }}>
                      <Ionicons name="add-circle" size={24} color="#38BDF8" />
                   </View>
                   <Text style={[styles.modalTitle, { color: cores.texto }]}>Novo Registo</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisivel(false)}><Ionicons name="close" size={28} color="#94A3B8" /></TouchableOpacity>
              </View>

              <View style={styles.seletorTipo}>
                <TouchableOpacity style={[styles.btnTipo, tipoAtual === 'receita' && styles.btnTipoAtivoVerde, { borderColor: cores.borda }]} onPress={() => setTipoAtual('receita')}>
                  <Ionicons name="trending-up" size={18} color={tipoAtual === 'receita' ? '#FFF' : '#10B981'} style={{ marginRight: 8 }} />
                  <Text style={[styles.txtTipo, tipoAtual === 'receita' && {color: '#FFF'}]}>Entrada</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnTipo, tipoAtual === 'despesa' && styles.btnTipoAtivoVermelho, { borderColor: cores.borda }]} onPress={() => setTipoAtual('despesa')}>
                  <Ionicons name="trending-down" size={18} color={tipoAtual === 'despesa' ? '#FFF' : '#EF4444'} style={{ marginRight: 8 }} />
                  <Text style={[styles.txtTipo, tipoAtual === 'despesa' && {color: '#FFF'}]}>Saída</Text>
                </TouchableOpacity>
              </View>
             
              <TextInput style={[styles.input, { backgroundColor: cores.fundo, color: cores.texto, borderColor: cores.borda }]} placeholder="Descrição" placeholderTextColor={cores.subtexto} value={descricao} onChangeText={setDescricao} />
              <TextInput style={[styles.input, { backgroundColor: cores.fundo, color: cores.texto, borderColor: cores.borda }]} placeholder="Valor" placeholderTextColor={cores.subtexto} keyboardType="numeric" value={valor} onChangeText={setValor} />

              {tipoAtual === 'despesa' && (
                <View style={{ marginBottom: 15 }}>
                  <Text style={{ color: cores.subtexto, marginBottom: 8, fontSize: 12, fontWeight: 'bold' }}>CATEGORIA</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CATEGORIAS_DESPESA.map((cat) => (
                      <TouchableOpacity 
                        key={cat.label} 
                        onPress={() => setCategoriaSel(cat.label)}
                        style={[
                          styles.chipFiltro, 
                          { marginRight: 8, borderWidth: 1, borderColor: cores.borda },
                          categoriaSel === cat.label ? { backgroundColor: '#38BDF8', borderColor: '#38BDF8' } : { backgroundColor: cores.fundo }
                        ]}
                      >
                        <Text style={[styles.txtChip, categoriaSel === cat.label && { color: '#020617' }]}>{cat.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.btnCalendario, { backgroundColor: cores.fundo, borderColor: cores.borda, marginTop: 5 }]}>
                <Ionicons name="calendar-outline" size={20} color="#38BDF8" style={{ marginRight: 10 }} />
                <Text style={{ color: cores.texto, fontSize: 16 }}>{`${String(dataRegistro.getDate()).padStart(2, '0')}/${String(dataRegistro.getMonth() + 1).padStart(2, '0')}/${dataRegistro.getFullYear()}`}</Text>
              </TouchableOpacity>
              {showDatePicker && <DateTimePicker value={dataRegistro} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setDataRegistro(d); }} />}

              <View style={styles.switchContainer}>
                <Text style={{ color: cores.texto, fontSize: 16 }}>Compra Parcelada? 🔁</Text>
                <Switch value={recorrente} onValueChange={setRecorrente} trackColor={{ false: "#64748B", true: "#38BDF8" }} />
              </View>

              {recorrente && (
                <View style={styles.parcelasContainer}>
                  <Text style={{ color: cores.subtexto, fontSize: 13, fontWeight: 'bold', marginBottom: 12 }}>Em quantas vezes pretendes dividir?</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {['2', '3', '4', '5', '6', '10', '12', '18', '24'].map((num) => (
                      <TouchableOpacity 
                        key={num} 
                        onPress={() => setParcelas(num)}
                        style={[
                          styles.chipParcela, 
                          { borderColor: cores.borda, backgroundColor: parcelas === num ? '#38BDF8' : 'transparent' }
                        ]}
                      >
                        <Text style={{ color: parcelas === num ? '#020617' : cores.texto, fontWeight: 'bold' }}>{num}x</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              <TouchableOpacity style={styles.btnSalvar} onPress={salvar}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* MODAL DO CONSELHEIRO IA */}
      <Modal visible={modalIAVisivel} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBody, { backgroundColor: cores.card, borderColor: cores.borda, paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: cores.texto }]}>Conselheiro IA 🤖</Text>
              <TouchableOpacity onPress={() => setModalIAVisivel(false)}><Ionicons name="close" size={28} color="#94A3B8" /></TouchableOpacity>
            </View>
            
            {isAILoading ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={{ color: cores.subtexto, marginTop: 15 }}>Analisando os teus gastos...</Text>
              </View>
            ) : (
              <View style={{ padding: 10 }}>
                <Text style={{ color: cores.texto, fontSize: 18, lineHeight: 26, textAlign: 'center', marginBottom: 25 }}>
                  {dicaIA}
                </Text>
                <TouchableOpacity style={[styles.btnSalvar, { backgroundColor: '#8B5CF6' }]} onPress={() => setModalIAVisivel(false)}>
                  <Text style={styles.btnText}>Obrigado, IA!</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL DE RACHAR CONTA */}
      <Modal visible={splitModalVisivel} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBody, { backgroundColor: cores.card, borderColor: cores.borda, paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: cores.texto }]}>Rachar Conta 🍕</Text>
              <TouchableOpacity onPress={() => setSplitModalVisivel(false)}><Ionicons name="close" size={28} color="#94A3B8" /></TouchableOpacity>
            </View>
            
            <Text style={{ color: cores.subtexto, marginBottom: 15 }}>Dividir {formatarMoeda(splitTransacao?.valor || 0)} por quantas pessoas?</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: cores.fundo, color: cores.texto, borderColor: cores.borda }]} 
              keyboardType="numeric" value={qtdPessoas} onChangeText={setQtdPessoas} placeholder="Ex: 2" placeholderTextColor={cores.subtexto}
            />
            <TouchableOpacity style={styles.btnSalvar} onPress={racharNoWhatsApp}><Text style={styles.btnText}>Enviar para o WhatsApp</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={settingsModalVisivel} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBody, { backgroundColor: cores.card, borderColor: cores.borda, paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: cores.texto }]}>O Meu Perfil</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisivel(false)}><Ionicons name="close" size={28} color="#94A3B8" /></TouchableOpacity>
            </View>

            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: isDark ? '#38BDF820' : '#38BDF810' }]}>
                <Ionicons name="person" size={40} color="#38BDF8" />
              </View>
              <View>
                <Text style={[styles.profileLabel, { color: cores.subtexto }]}>Bem-vindo,</Text>
                <Text style={[styles.profileEmail, { color: cores.texto }]}>{userEmail.split('@')[0]}</Text>
              </View>
            </View>

            <View style={[styles.miniStatsRow, { backgroundColor: cores.cardSecundario, borderColor: cores.borda }]}>
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatLabel}>Saldo Atual</Text>
                <Text style={[styles.miniStatValue, { color: saldo >= 0 ? '#10B981' : '#EF4444' }]}>{formatarMoeda(saldo)}</Text>
              </View>
              <View style={[styles.verticalDivider, { backgroundColor: cores.borda }]} />
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatLabel}>Gastos do Mês</Text>
                <Text style={[styles.miniStatValue, { color: cores.texto }]}>{formatarMoeda(despesas)}</Text>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <View style={[styles.settingsRow, { borderColor: cores.borda }]}>
                <View style={styles.settingsInfo}>
                  <Ionicons name={isDark ? "moon" : "sunny"} size={22} color="#38BDF8" />
                  <Text style={[styles.settingsText, { color: cores.texto }]}>Modo Escuro</Text>
                </View>
                <Switch value={isDark} onValueChange={setIsDark} trackColor={{ false: "#64748B", true: "#38BDF8" }} />
              </View>

              {/* BOTÃO ADMIN - Visível apenas para e-mail específico (Ex: admin@admin.com) */}
              {userEmail === 'admin@admin.com' && (
                <TouchableOpacity style={[styles.settingsRow, { borderColor: cores.borda }]} onPress={() => { setSettingsModalVisivel(false); router.push('/admin' as any); }}>
                  <View style={styles.settingsInfo}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#8B5CF6" />
                    <Text style={[styles.settingsText, { color: cores.texto }]}>Painel Administrativo</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={cores.subtexto} />
                </TouchableOpacity>
              )}

              {Platform.OS === 'web' && (
                <TouchableOpacity style={[styles.settingsRow, { borderColor: cores.borda }]} onPress={() => router.replace('/')}>
                  <View style={styles.settingsInfo}>
                    <Ionicons name="globe-outline" size={22} color="#38BDF8" />
                    <Text style={[styles.settingsText, { color: cores.texto }]}>Voltar ao Site</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={cores.subtexto} />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.settingsRow, { borderColor: cores.borda }]} onPress={exportarParaPDF}>
                <View style={styles.settingsInfo}>
                  <Ionicons name="document-text-outline" size={22} color="#38BDF8" />
                  <Text style={[styles.settingsText, { color: cores.texto }]}>Exportar Histórico (PDF)</Text>
                </View>
                <Ionicons name="download-outline" size={20} color={cores.subtexto} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.settingsRow, { borderColor: cores.borda }]} onPress={partilharRelatorio}>
                <View style={styles.settingsInfo}>
                  <Ionicons name="logo-whatsapp" size={22} color="#10B981" />
                  <Text style={[styles.settingsText, { color: cores.texto }]}>Partilhar Relatório</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={cores.subtexto} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.settingsRow, { borderBottomWidth: 0 }]} onPress={confirmarLogout}>
                <View style={styles.settingsInfo}>
                  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                  <Text style={[styles.settingsText, { color: '#EF4444', fontWeight: 'bold' }]}>Sair da Conta</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sidebarContainer: { width: SIDEBAR_WIDTH, height: '100%', borderRightWidth: 1, padding: 25, paddingTop: 50 },
  logoTextSidebar: { fontSize: 28, fontWeight: 'bold', marginBottom: 30 },
  sidebarProfile: { marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  sidebarInner: { gap: 5 },
  headerFixoContainer: { zIndex: 10, elevation: 5, backgroundColor: 'transparent', width: '100%', maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Constants.statusBarHeight + 10, marginBottom: 20, paddingHorizontal: 20, width: '100%' },
  titulo: { fontSize: 26, fontWeight: 'bold' },
  btnTop: { padding: 8, borderRadius: 12, borderWidth: 1 },
  anoContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 15 },
  btnAno: { padding: 5 },
  txtAno: { fontSize: 20, fontWeight: 'bold' },
  mesesContainer: { paddingBottom: 15 },
  btnMes: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  btnMesAtivo: { backgroundColor: '#38BDF8' },
  txtMes: { fontWeight: 'bold' },
  txtMesAtivo: { color: '#020617' },
  extratoSelector: { flexDirection: 'row', marginBottom: 20, gap: 20, justifyContent: 'center' },
  extratoBtn: { paddingVertical: 5, paddingHorizontal: 10 },
  extratoBtnTxt: { fontWeight: 'bold', fontSize: 16 },
  resumoContainer: { marginBottom: 10, paddingHorizontal: 20, marginTop: 10, width: '100%', maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },
  cartaoSaldo: { padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  cartaoTitulo: { color: '#94A3B8', fontSize: 16, marginBottom: 5 },
  cartaoValor: { fontSize: 36, fontWeight: 'bold' },
  barraSaudeContainer: { width: '100%', height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 15, overflow: 'hidden' },
  btnIA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginTop: 10, gap: 5 },
  txtIA: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  barraSaudePreenchimento: { height: '100%', borderRadius: 3 },
  txtSaude: { color: '#94A3B8', fontSize: 12, marginTop: 5, marginBottom: 10 },
  linhaResumo: { flexDirection: 'row', justifyContent: 'space-between' },
  cartaoPequeno: { padding: 15, borderRadius: 15, width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  textoVerde: { color: '#10B981', fontWeight: 'bold', fontSize: 16 },
  textoVermelho: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  graficoContainer: { alignItems: 'center', borderRadius: 15, padding: 15, marginBottom: 10, marginHorizontal: 20, maxWidth: DASHBOARD_MAX_WIDTH - 40, alignSelf: 'center' },
  filtrosContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10, maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },
  chipFiltro: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 15 },
  txtChip: { fontWeight: 'bold', color: '#94A3B8' },
  containerItem: { paddingHorizontal: 20, width: '100%', maxWidth: DASHBOARD_MAX_WIDTH, alignSelf: 'center' },
  itemLista: { padding: 18, borderRadius: 15, flexDirection: 'row', marginBottom: 12, borderWidth: 1 },
  iconCategory: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  itemDesc: { fontSize: 15, fontWeight: 'bold', lineHeight: 20 },
  itemData: { fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 16 },
  itemDireita: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  itemValor: { fontSize: 14, fontWeight: 'bold', textAlign: 'right', minWidth: 85 },
  itemAcoes: { flexDirection: 'row', alignItems: 'center', marginLeft: 5, gap: 5 },
  btnAcaoLista: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, paddingHorizontal: 15, height: 45, borderRadius: 12, borderWidth: 1, marginBottom: 15, maxWidth: DASHBOARD_MAX_WIDTH - 40, alignSelf: 'center', width: '100%' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 65, height: 65, borderRadius: 35, backgroundColor: '#38BDF8', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end' },
  modalBody: { padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, width: '100%', maxWidth: 500, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  seletorTipo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  btnTipo: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5, flexDirection: 'row' },
  txtTipo: { color: '#94A3B8', fontWeight: 'bold' }, 
  btnTipoAtivoVerde: { backgroundColor: '#10B981', borderColor: '#10B981' }, 
  btnTipoAtivoVermelho: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  input: { padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, fontSize: 16 },
  btnCalendario: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 5 },
  parcelasContainer: { marginBottom: 20, paddingHorizontal: 5 },
  inputParcela: { padding: 10, borderRadius: 10, borderWidth: 1, width: 60, textAlign: 'center', fontSize: 16 },
  chipParcela: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnSalvar: { backgroundColor: '#38BDF8', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#020617', fontWeight: 'bold', fontSize: 16 },
  settingsSection: { marginTop: 10 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1 },
  settingsInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  settingsText: { fontSize: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 25, marginTop: 10 },
  profileAvatar: { width: 65, height: 65, borderRadius: 35, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#38BDF8', padding: 4, borderRadius: 10, borderWidth: 2, borderColor: '#020617' },
  inputInline: { borderBottomWidth: 2, paddingVertical: 4, fontSize: 16, marginBottom: 8 },
  btnSaveProfile: { backgroundColor: '#38BDF8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  profileLabel: { fontSize: 14, fontWeight: '500' },
  profileEmail: { fontSize: 18, fontWeight: 'bold' },
  miniStatsRow: { flexDirection: 'row', padding: 15, borderRadius: 15, borderWidth: 1, marginBottom: 15 },
  miniStatItem: { flex: 1, alignItems: 'center' },
  miniStatLabel: { fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 5 },
  miniStatValue: { fontSize: 15, fontWeight: 'bold' },
  verticalDivider: { width: 1, height: '80%', alignSelf: 'center' },
});