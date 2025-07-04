
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CobrancaCard from './CobrancaCard';
import TransferenciaLote from './TransferenciaLote';
import AcoesCobrancaModal from './AcoesCobrancaModal';
import HistoricoAcoes from './HistoricoAcoes';
import { 
  Users, 
  UserCheck, 
  Shuffle, 
  Search,
  Loader2,
  ArrowRight,
  Grid3X3,
  List
} from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  role: string;
  total_cobrancas: number;
}

interface Cobranca {
  id: string;
  cliente_nome: string;
  cpf_cnpj: string;
  empreendimento: string | null;
  valor: number;
  vencimento: string;
  data_cobranca: string | null;
  status_pagamento: string;
  status_cliente: string | null;
  tipo_cobranca: string | null;
  assistente_responsavel: string | null;
  assistente_email?: string;
  ultima_acao?: string | null;
  proxima_acao?: string | null;
  resultado_ultima_acao?: string | null;
}

const DistribuicaoCobrancas = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);
  const [redistribuindo, setRedistribuindo] = useState(false);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [cobrancasSelecionadas, setCobrancasSelecionadas] = useState<string[]>([]);
  const [modalAcoesAberto, setModalAcoesAberto] = useState(false);
  const [cobrancaSelecionadaAcao, setCobrancaSelecionadaAcao] = useState<Cobranca | null>(null);
  const [visualizacao, setVisualizacao] = useState<'cards' | 'tabela'>('cards');
  const { toast } = useToast();

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários com contagem de cobranças
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role
        `)
        .in('role', ['admin', 'user']);

      if (usuariosError) throw usuariosError;

      // Carregar contagem de cobranças por usuário
      const usuariosComContagem = await Promise.all(
        usuariosData.map(async (usuario) => {
          const { count } = await supabase
            .from('cobrancas')
            .select('*', { count: 'exact', head: true })
            .eq('assistente_responsavel', usuario.id);

          return {
            ...usuario,
            total_cobrancas: count || 0
          };
        })
      );

      setUsuarios(usuariosComContagem);

      // Carregar cobranças com informações do assistente
      const { data: cobrancasData, error: cobrancasError } = await supabase
        .from('cobrancas')
        .select(`
          id,
          cliente_nome,
          cpf_cnpj,
          empreendimento,
          valor,
          vencimento,
          data_cobranca,
          status_pagamento,
          status_cliente,
          tipo_cobranca,
          assistente_responsavel,
          ultima_acao,
          proxima_acao,
          resultado_ultima_acao
        `)
        .order('created_at', { ascending: false });

      if (cobrancasError) throw cobrancasError;

      // Adicionar email do assistente às cobranças
      const cobrancasComAssistente = cobrancasData.map(cobranca => {
        const assistente = usuariosData.find(u => u.id === cobranca.assistente_responsavel);
        return {
          ...cobranca,
          assistente_email: assistente?.email || 'Não atribuído'
        };
      });

      setCobrancas(cobrancasComAssistente);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de distribuição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const redistribuirCobrancas = async () => {
    try {
      setRedistribuindo(true);
      
      // Usar any para contornar o problema de tipagem
      const { error } = await (supabase as any).rpc('redistribuir_cobrancas_igualmente');
      
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cobranças redistribuídas igualmente entre os assistentes",
      });

      await carregarDados();
    } catch (error) {
      console.error('Erro ao redistribuir cobranças:', error);
      toast({
        title: "Erro",
        description: "Erro ao redistribuir cobranças",
        variant: "destructive",
      });
    } finally {
      setRedistribuindo(false);
    }
  };

  const calcularDiasAtraso = (vencimento: string): number => {
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    const diffTime = hoje.getTime() - dataVencimento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSelecionarCobranca = (id: string, selecionado: boolean) => {
    if (selecionado) {
      setCobrancasSelecionadas(prev => [...prev, id]);
    } else {
      setCobrancasSelecionadas(prev => prev.filter(item => item !== id));
    }
  };

  const handleSelecionarTodas = () => {
    if (cobrancasSelecionadas.length === cobrancasFiltradas.length) {
      setCobrancasSelecionadas([]);
    } else {
      setCobrancasSelecionadas(cobrancasFiltradas.map(c => c.id));
    }
  };

  const handleAbrirAcoes = (cobranca: Cobranca) => {
    setCobrancaSelecionadaAcao(cobranca);
    setModalAcoesAberto(true);
  };

  const handleFecharModal = () => {
    setModalAcoesAberto(false);
    setCobrancaSelecionadaAcao(null);
  };

  const handleAcaoSalva = () => {
    carregarDados();
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const cobrancasFiltradas = cobrancas.filter(cobranca => {
    const matchPesquisa = cobranca.cliente_nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
                          cobranca.cpf_cnpj.includes(pesquisa);
    const matchUsuario = !filtroUsuario || filtroUsuario === 'todos' || cobranca.assistente_responsavel === filtroUsuario;
    return matchPesquisa && matchUsuario;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas dos Assistentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Distribuição por Assistente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuarios.map((usuario) => (
              <div key={usuario.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-slate-900">{usuario.email}</div>
                  <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'}>
                    {usuario.role}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {usuario.total_cobrancas} cobranças
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={redistribuirCobrancas}
              disabled={redistribuindo}
              className="w-full"
            >
              {redistribuindo ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Shuffle className="w-4 h-4 mr-2" />
              )}
              Redistribuir Cobranças Igualmente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transferência em Lote */}
      <TransferenciaLote
        usuarios={usuarios}
        cobrancasSelecionadas={cobrancasSelecionadas}
        cobrancas={cobrancas}
        onTransferenciaCompleta={carregarDados}
        onLimparSelecao={() => setCobrancasSelecionadas([])}
      />

      {/* Lista de Cobranças */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Cobranças ({cobrancasFiltradas.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelecionarTodas}
              >
                {cobrancasSelecionadas.length === cobrancasFiltradas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>
              
              <Select value={filtroUsuario} onValueChange={setFiltroUsuario}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por assistente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      {usuario.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-lg">
                <Button
                  variant={visualizacao === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setVisualizacao('cards')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={visualizacao === 'tabela' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setVisualizacao('tabela')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visualizacao === 'cards' ? (
            <div className="space-y-4">
              {cobrancasFiltradas.map((cobranca) => (
                <CobrancaCard
                  key={cobranca.id}
                  cobranca={cobranca}
                  isSelected={cobrancasSelecionadas.includes(cobranca.id)}
                  onSelect={handleSelecionarCobranca}
                  onAbrirAcoes={handleAbrirAcoes}
                  calcularDiasAtraso={calcularDiasAtraso}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Cliente</th>
                    <th className="text-left p-4">CPF/CNPJ</th>
                    <th className="text-left p-4">Valor</th>
                    <th className="text-left p-4">Assistente Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrancasFiltradas.slice(0, 100).map((cobranca) => (
                    <tr key={cobranca.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 font-semibold">{cobranca.cliente_nome}</td>
                      <td className="p-4">{cobranca.cpf_cnpj}</td>
                      <td className="p-4">R$ {Number(cobranca.valor).toLocaleString()}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {cobranca.assistente_email}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Ações */}
      <AcoesCobrancaModal
        isOpen={modalAcoesAberto}
        onClose={handleFecharModal}
        cobranca={cobrancaSelecionadaAcao}
        onAcaoSalva={handleAcaoSalva}
      />
    </div>
  );
};

export default DistribuicaoCobrancas;
