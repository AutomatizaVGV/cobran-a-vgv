
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CadenciaMessages from '@/components/CadenciaMessages';
import MetricasDiarias from '@/components/MetricasDiarias';
import { useCobrancas } from '@/hooks/useCobrancas';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Phone, 
  MessageSquare,
  Filter,
  Search,
  Target,
  ClipboardList,
  Loader2
} from 'lucide-react';
import AcoesCobrancaModal from '@/components/AcoesCobrancaModal';
import { supabase } from '@/integrations/supabase/client';
import KanbanCobrancas from '@/components/KanbanCobrancas';

const UserDashboard = () => {
  const { cobrancas, loading, calcularDiasAtraso, calcularMetricas, carregarCobrancas } = useCobrancas({ userRole: 'user' });
  
  // Estados para filtros
  const [filtroDataCobranca, setFiltroDataCobranca] = useState('');
  const [filtroDataRecebimento, setFiltroDataRecebimento] = useState('');
  const [filtroStatusCliente, setFiltroStatusCliente] = useState('');
  const [filtroTipoCobranca, setFiltroTipoCobranca] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [cobrancaSelecionada, setCobrancaSelecionada] = useState(null);

  const abrirModalAcao = (cobranca) => {
    setCobrancaSelecionada(cobranca);
    setModalAberto(true);
  };
  const fecharModalAcao = () => {
    setModalAberto(false);
    setCobrancaSelecionada(null);
  };

  const metricas = calcularMetricas();

  const cobrancasFiltradas = cobrancas.filter(cobranca => {
    if (cobranca.status_kanban === 'reagendado') return false;
    if (cobranca.status_pagamento === 'pago') return false;
    const matchPesquisa = cobranca.cliente_nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
                          cobranca.cpf_cnpj.includes(pesquisa);
    const matchDataCobranca = !filtroDataCobranca || cobranca.data_cobranca === filtroDataCobranca;
    const matchStatusCliente = !filtroStatusCliente || filtroStatusCliente === 'todos' || cobranca.status_cliente === filtroStatusCliente;
    const matchTipoCobranca = !filtroTipoCobranca || filtroTipoCobranca === 'todos' || cobranca.tipo_cobranca === filtroTipoCobranca;

    return matchPesquisa && matchDataCobranca && matchStatusCliente && matchTipoCobranca;
  });

  // Adicionar funções auxiliares para atualizar status_cliente e tipo_cobranca
  const statusClienteOptions = [
    'Regular', 'SPC', 'Serasa', 'Protesto'
  ];
  const tipoCobrancaOptions = [
    'Cobrança +VGV', 'Serasa', 'Cartório', 'Protestado', '-'
  ];

  const atualizarCampoCobranca = async (id, campo, valor) => {
    await supabase.from('cobrancas').update({ [campo]: valor }).eq('id', id);
    carregarCobrancas();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Painel do Assistente</h1>
          <p className="text-slate-600">Gerencie suas cobranças e acompanhe seu desempenho</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Meus Clientes</p>
                  <p className="text-3xl font-bold">{metricas.totalClientes}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Valor em Aberto</p>
                  <p className="text-2xl font-bold">R$ {(metricas.valorEmAberto / 1000).toFixed(0)}k</p>
                </div>
                <DollarSign className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Valor Recuperado</p>
                  <p className="text-2xl font-bold">R$ {(metricas.valorRecuperado / 1000).toFixed(0)}k</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Juros Recebidos</p>
                  <p className="text-2xl font-bold">R$ {(metricas.jurosRecebidos / 1000).toFixed(0)}k</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Taxa Recuperação</p>
                  <p className="text-3xl font-bold">
                    {metricas.totalClientes > 0 
                      ? Math.round((cobrancas.filter(c => c.status_pagamento === 'pago').length / metricas.totalClientes) * 100)
                      : 0}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="kanban" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <KanbanCobrancas />
          </TabsContent>

          <TabsContent value="relatorios">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Relatórios de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-600">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-semibold mb-2">Relatórios em desenvolvimento</p>
                  <p>Relatórios detalhados serão implementados em breve.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
