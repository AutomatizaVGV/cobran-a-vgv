
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

const UserDashboard = () => {
  const { cobrancas, loading, calcularDiasAtraso, calcularMetricas } = useCobrancas({ userRole: 'user' });
  
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
    const matchPesquisa = cobranca.cliente_nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
                          cobranca.cpf_cnpj.includes(pesquisa);
    const matchDataCobranca = !filtroDataCobranca || cobranca.data_cobranca === filtroDataCobranca;
    const matchStatusCliente = !filtroStatusCliente || filtroStatusCliente === 'todos' || cobranca.status_cliente === filtroStatusCliente;
    const matchTipoCobranca = !filtroTipoCobranca || filtroTipoCobranca === 'todos' || cobranca.tipo_cobranca === filtroTipoCobranca;

    return matchPesquisa && matchDataCobranca && matchStatusCliente && matchTipoCobranca;
  });

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <Tabs defaultValue="cobrancas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cobrancas" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Minhas Cobranças
            </TabsTrigger>
            <TabsTrigger value="metricas" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cobrancas">
            <Card>
              <CardHeader>
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Minhas Cobranças ({cobrancasFiltradas.length})
                  </CardTitle>
                  
                  {/* Filtros */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Buscar cliente..."
                        value={pesquisa}
                        onChange={(e) => setPesquisa(e.target.value)}
                        className="pl-10 w-48"
                      />
                    </div>
                    
                    <Input
                      type="date"
                      placeholder="Data Cobrança"
                      value={filtroDataCobranca}
                      onChange={(e) => setFiltroDataCobranca(e.target.value)}
                      className="w-48"
                    />
                    
                    <Select value={filtroStatusCliente} onValueChange={setFiltroStatusCliente}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Status Cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="SPC">SPC</SelectItem>
                        <SelectItem value="Serasa">Serasa</SelectItem>
                        <SelectItem value="Protesto">Protesto</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filtroTipoCobranca} onValueChange={setFiltroTipoCobranca}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Tipo Cobrança" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Cobrança +VGV">Cobrança +VGV</SelectItem>
                        <SelectItem value="Serasa">Serasa</SelectItem>
                        <SelectItem value="Cartório">Cartório</SelectItem>
                        <SelectItem value="Protestado">Protestado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPesquisa('');
                        setFiltroDataCobranca('');
                        setFiltroStatusCliente('');
                        setFiltroTipoCobranca('');
                      }}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {cobrancasFiltradas.length === 0 ? (
                  <div className="text-center py-12 text-slate-600">
                    <ClipboardList className="w-16 h-16 mx-auto mb-6 text-slate-400" />
                    {cobrancas.length === 0 ? (
                      <>
                        <p className="text-xl font-semibold mb-3">Nenhuma cobrança atribuída</p>
                        <p className="mb-4">Você ainda não tem cobranças atribuídas a você.</p>
                        <p className="text-sm text-slate-500">Entre em contato com o administrador para que cobranças sejam atribuídas ao seu perfil.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold mb-2">Nenhuma cobrança encontrada</p>
                        <p>Não há cobranças que correspondam aos filtros aplicados.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-4">Cliente</th>
                          <th className="text-left p-4">Empreendimento</th>
                          <th className="text-left p-4">Valor</th>
                          <th className="text-left p-4">Vencimento</th>
                          <th className="text-left p-4">Status Cliente</th>
                          <th className="text-left p-4">Tipo Cobrança</th>
                          <th className="text-left p-4">Status</th>
                          <th className="text-left p-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cobrancasFiltradas.map((cobranca) => {
                          const diasAtraso = calcularDiasAtraso(cobranca.vencimento);
                          return (
                            <tr key={cobranca.id} className="border-b hover:bg-slate-50">
                              <td className="p-4">
                                <div>
                                  <div className="font-semibold">{cobranca.cliente_nome}</div>
                                  <div className="text-sm text-slate-600">{cobranca.cpf_cnpj}</div>
                                </div>
                              </td>
                              <td className="p-4">{cobranca.empreendimento || '-'}</td>
                              <td className="p-4 font-semibold">R$ {Number(cobranca.valor).toLocaleString()}</td>
                              <td className="p-4">
                                <div>{new Date(cobranca.vencimento).toLocaleDateString()}</div>
                                {diasAtraso > 0 && (
                                  <div className="text-xs text-red-600">{diasAtraso} dias atraso</div>
                                )}
                              </td>
                              <td className="p-4">
                                <Badge variant={cobranca.status_cliente === 'Regular' ? 'default' : 'destructive'}>
                                  {cobranca.status_cliente || 'Regular'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline">{cobranca.tipo_cobranca || '-'}</Badge>
                              </td>
                              <td className="p-4">
                                <Badge variant={cobranca.status_pagamento === 'pago' ? 'default' : 'secondary'}>
                                  {cobranca.status_pagamento === 'pago' ? 'Pago' : 'Em Aberto'}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Button size="sm" variant="default" onClick={() => abrirModalAcao(cobranca)}>
                                  Registrar Ação
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
            <AcoesCobrancaModal
              isOpen={modalAberto}
              onClose={fecharModalAcao}
              cobranca={cobrancaSelecionada}
              onAcaoSalva={() => { fecharModalAcao(); /* pode recarregar cobranças se necessário */ }}
            />
          </TabsContent>

          {/* Removido: <TabsContent value="cadencia"> <CadenciaMessages /> </TabsContent> */}

          <TabsContent value="metricas">
            <MetricasDiarias />
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
