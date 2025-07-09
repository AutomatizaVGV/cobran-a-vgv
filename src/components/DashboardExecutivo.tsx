import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCobrancas } from '@/hooks/useCobrancas';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';


interface MetricasExecutivas {
  totalCobrancas: number;
  valorTotal: number;
  valorEmAberto: number;
  valorRecuperado: number;
  taxaRecuperacao: number;
  mediaDiasAtraso: number;
  cobrancasVencidas: number;
  cobrancasVencendo: number;
  performanceAssistentes: Array<{
    nome: string;
    total: number;
    recuperado: number;
    taxa: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    valor: number;
    recuperado: number;
  }>;
  distribuicaoStatus: Array<{
    status: string;
    valor: number;
    quantidade: number;
  }>;
}

const DashboardExecutivo = () => {
  const { user } = useAuth();
  const { cobrancas, loading } = useCobrancas({ userRole: 'admin' });
  const [periodo, setPeriodo] = useState('30');
  const [metricas, setMetricas] = useState<MetricasExecutivas | null>(null);

  const calcularMetricasExecutivas = () => {
    if (!cobrancas.length) return null;

    const hoje = new Date();
    const diasAtraso = cobrancas.map(c => {
      const vencimento = new Date(c.vencimento);
      return Math.max(0, Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));
    });

    const totalCobrancas = cobrancas.length;
    const valorTotal = cobrancas.reduce((sum, c) => sum + Number(c.valor), 0);
    const valorEmAberto = cobrancas
      .filter(c => c.status_pagamento === 'em_aberto')
      .reduce((sum, c) => sum + Number(c.valor), 0);
    const valorRecuperado = cobrancas
      .filter(c => c.status_pagamento === 'pago')
      .reduce((sum, c) => sum + Number(c.juros_recebidos || 0), 0);
    const taxaRecuperacao = totalCobrancas > 0 
      ? (cobrancas.filter(c => c.status_pagamento === 'pago').length / totalCobrancas) * 100 
      : 0;
    const mediaDiasAtraso = diasAtraso.reduce((sum, dias) => sum + dias, 0) / diasAtraso.length;
    const cobrancasVencidas = cobrancas.filter(c => new Date(c.vencimento) < hoje).length;
    const cobrancasVencendo = cobrancas.filter(c => {
      const vencimento = new Date(c.vencimento);
      const diffDias = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diffDias >= 0 && diffDias <= 7;
    }).length;

    // Performance por assistente
    const assistentes = new Map();
    cobrancas.forEach(c => {
      if (!assistentes.has(c.assistente_responsavel)) {
        assistentes.set(c.assistente_responsavel, {
          nome: c.assistente_responsavel || 'Não atribuído',
          total: 0,
          recuperado: 0,
          taxa: 0
        });
      }
      const assistente = assistentes.get(c.assistente_responsavel);
      assistente.total += Number(c.valor);
      if (c.status_pagamento === 'pago') {
        assistente.recuperado += Number(c.juros_recebidos || 0);
      }
    });

    const performanceAssistentes = Array.from(assistentes.values()).map(a => ({
      ...a,
      taxa: a.total > 0 ? (a.recuperado / a.total) * 100 : 0
    }));

    // Evolução mensal (simulado)
    const evolucaoMensal = [
      { mes: 'Jan', valor: 150000, recuperado: 45000 },
      { mes: 'Fev', valor: 180000, recuperado: 54000 },
      { mes: 'Mar', valor: 220000, recuperado: 66000 },
      { mes: 'Abr', valor: 250000, recuperado: 75000 },
      { mes: 'Mai', valor: 280000, recuperado: 84000 },
      { mes: 'Jun', valor: valorTotal, recuperado: valorRecuperado }
    ];

    // Distribuição por status
    const distribuicaoStatus = [
      { status: 'Em Aberto', valor: valorEmAberto, quantidade: cobrancas.filter(c => c.status_pagamento === 'em_aberto').length },
      { status: 'Pago', valor: valorRecuperado, quantidade: cobrancas.filter(c => c.status_pagamento === 'pago').length },
      { status: 'Vencido', valor: cobrancas.filter(c => new Date(c.vencimento) < hoje).reduce((sum, c) => sum + Number(c.valor), 0), quantidade: cobrancasVencidas }
    ];

    return {
      totalCobrancas,
      valorTotal,
      valorEmAberto,
      valorRecuperado,
      taxaRecuperacao,
      mediaDiasAtraso,
      cobrancasVencidas,
      cobrancasVencendo,
      performanceAssistentes,
      evolucaoMensal,
      distribuicaoStatus
    };
  };

  useEffect(() => {
    if (!loading && cobrancas.length > 0) {
      setMetricas(calcularMetricasExecutivas());
    }
  }, [cobrancas, loading]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const coresGrafico = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  if (loading || !metricas) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#23272f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Carregando dashboard executivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#23272f] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Executivo</h1>
            <p className="text-slate-600 dark:text-slate-300">Visão estratégica do sistema de cobranças</p>
          </div>
          
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Após o header (título, subtítulo e seletor de período): */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Relatório de Cobrança</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Valor Total</p>
                    <p className="text-3xl font-bold">{formatarMoeda(metricas.valorTotal)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="w-4 h-4 text-green-300" />
                      <span className="text-sm text-blue-100">+12.5% vs mês anterior</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Em Aberto</p>
                    <p className="text-3xl font-bold">{formatarMoeda(metricas.valorEmAberto)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowDownRight className="w-4 h-4 text-red-300" />
                      <span className="text-sm text-red-100">-5.2% vs mês anterior</span>
                    </div>
                  </div>
                  <Clock className="w-8 h-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Recuperado</p>
                    <p className="text-3xl font-bold">{formatarMoeda(metricas.valorRecuperado)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="w-4 h-4 text-green-300" />
                      <span className="text-sm text-green-100">+8.7% vs mês anterior</span>
                    </div>
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
                    <p className="text-3xl font-bold">{formatarMoeda(metricas.valorRecuperado)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="w-4 h-4 text-yellow-300" />
                      <span className="text-sm text-yellow-100">+3.1% vs mês anterior</span>
                    </div>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Taxa de Recuperação</p>
                    <p className="text-3xl font-bold">{metricas.taxaRecuperacao.toFixed(1)}%</p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight className="w-4 h-4 text-purple-300" />
                      <span className="text-sm text-purple-100">+2.1% vs mês anterior</span>
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Métricas Secundárias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Cobranças
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-semibold">{metricas.totalCobrancas}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vencidas</span>
                  <span className="font-semibold text-red-600">{metricas.cobrancasVencidas}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vencendo (7 dias)</span>
                  <span className="font-semibold text-yellow-600">{metricas.cobrancasVencendo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Média Dias Atraso</span>
                  <span className="font-semibold">{metricas.mediaDiasAtraso.toFixed(1)} dias</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metricas.performanceAssistentes.slice(0, 3).map((assistente, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm truncate">{assistente.nome}</span>
                    <div className="text-right">
                      <div className="font-semibold">{assistente.taxa.toFixed(1)}%</div>
                      <div className="text-xs text-slate-500">{formatarMoeda(assistente.recuperado)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximos Vencimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metricas.cobrancasVencendo}</div>
                  <div className="text-sm text-slate-600">Cobranças vencendo em 7 dias</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metricas.cobrancasVencidas}</div>
                  <div className="text-sm text-slate-600">Cobranças vencidas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução Mensal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricas.evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatarMoeda(Number(value))} />
                  <Line type="monotone" dataKey="valor" stroke="#3B82F6" strokeWidth={2} name="Valor Total" />
                  <Line type="monotone" dataKey="recuperado" stroke="#10B981" strokeWidth={2} name="Recuperado" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={metricas.distribuicaoStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="valor"
                    label={({ status, valor }) => `${status}: ${formatarMoeda(valor)}`}
                  >
                    {metricas.distribuicaoStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={coresGrafico[index % coresGrafico.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatarMoeda(Number(value))} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardExecutivo; 