
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleSheetsConfig from '@/components/GoogleSheetsConfig';
import DistribuicaoCobrancas from '@/components/DistribuicaoCobrancas';
import RelatoriosAvancados from '@/components/RelatoriosAvancados';
import DashboardExecutivo from '@/components/DashboardExecutivo';
import { useCobrancas } from '@/hooks/useCobrancas';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  FileSpreadsheet,
  Settings,
  BarChart3,
  Database,
  Loader2,
  UserCheck
} from 'lucide-react';
import KanbanCobrancas from '../components/KanbanCobrancas';

const AdminDashboard = () => {
  const { cobrancas, loading, calcularMetricas } = useCobrancas({ userRole: 'admin' });
  const metricas = calcularMetricas();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando dados administrativos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Painel Administrativo</h1>
          <p className="text-slate-600">Gerencie o sistema e monitore todas as cobranças</p>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total de Clientes</p>
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
                  <p className="text-red-100 text-sm">Valor Total em Aberto</p>
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
                  <p className="text-purple-100 text-sm">Taxa de Recuperação</p>
                  <p className="text-3xl font-bold">
                    {metricas.totalClientes > 0 
                      ? Math.round((cobrancas.filter(c => c.status_pagamento === 'pago').length / metricas.totalClientes) * 100)
                      : 0}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="executivo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="executivo" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Executivo
            </TabsTrigger>
            <TabsTrigger value="sheets" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="distribuicao" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Distribuição
            </TabsTrigger>
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executivo">
            <DashboardExecutivo />
          </TabsContent>

          <TabsContent value="sheets">
            <GoogleSheetsConfig />
          </TabsContent>

          <TabsContent value="distribuicao">
            <DistribuicaoCobrancas />
          </TabsContent>

          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Visão Geral dos Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900">Total de Cobranças</h4>
                    <p className="text-2xl font-bold text-blue-600">{cobrancas.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900">Em Aberto</h4>
                    <p className="text-2xl font-bold text-red-600">
                      {cobrancas.filter(c => c.status_pagamento === 'em_aberto').length}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-900">Pagas</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {cobrancas.filter(c => c.status_pagamento === 'pago').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relatorios">
            <RelatoriosAvancados />
          </TabsContent>

          <TabsContent value="configuracoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-600">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg font-semibold mb-2">Configurações em desenvolvimento</p>
                  <p>Configurações avançadas do sistema serão implementadas em breve.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <KanbanCobrancas />
      </div>
    </div>
  );
};

export default AdminDashboard;
