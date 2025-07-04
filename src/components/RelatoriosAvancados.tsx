import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useCobrancas } from '@/hooks/useCobrancas';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';

interface RelatorioConfig {
  tipo: 'cobrancas' | 'performance' | 'financeiro' | 'clientes';
  formato: 'pdf' | 'excel';
  dataInicio: Date | null;
  dataFim: Date | null;
  filtros: {
    status: string;
    assistente: string;
    tipoCobranca: string;
  };
}

const RelatoriosAvancados = () => {
  const { user } = useAuth();
  const { cobrancas, loading } = useCobrancas({ userRole: user?.role as 'admin' | 'user' });
  const { toast } = useToast();
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [config, setConfig] = useState<RelatorioConfig>({
    tipo: 'cobrancas',
    formato: 'pdf',
    dataInicio: null,
    dataFim: null,
    filtros: {
      status: 'todos',
      assistente: 'todos',
      tipoCobranca: 'todos'
    }
  });

  const tiposRelatorio = [
    { value: 'cobrancas', label: 'Relatório de Cobranças', icon: FileText },
    { value: 'performance', label: 'Performance por Assistente', icon: TrendingUp },
    { value: 'financeiro', label: 'Relatório Financeiro', icon: DollarSign },
    { value: 'clientes', label: 'Análise de Clientes', icon: Users }
  ];

  const formatosExportacao = [
    { value: 'pdf', label: 'PDF', icon: FileText },
    { value: 'excel', label: 'Excel', icon: Download }
  ];

  const filtrarDados = () => {
    let dadosFiltrados = [...cobrancas];

    // Filtro por data
    if (config.dataInicio) {
      dadosFiltrados = dadosFiltrados.filter(c => 
        new Date(c.created_at) >= config.dataInicio!
      );
    }

    if (config.dataFim) {
      dadosFiltrados = dadosFiltrados.filter(c => 
        new Date(c.created_at) <= config.dataFim!
      );
    }

    // Filtro por status
    if (config.filtros.status !== 'todos') {
      dadosFiltrados = dadosFiltrados.filter(c => 
        c.status_pagamento === config.filtros.status
      );
    }

    // Filtro por assistente
    if (config.filtros.assistente !== 'todos') {
      dadosFiltrados = dadosFiltrados.filter(c => 
        c.assistente_responsavel === config.filtros.assistente
      );
    }

    // Filtro por tipo de cobrança
    if (config.filtros.tipoCobranca !== 'todos') {
      dadosFiltrados = dadosFiltrados.filter(c => 
        c.tipo_cobranca === config.filtros.tipoCobranca
      );
    }

    return dadosFiltrados;
  };

  const calcularMetricas = (dados: any[]) => {
    const totalCobrancas = dados.length;
    const valorTotal = dados.reduce((sum, c) => sum + Number(c.valor), 0);
    const valorEmAberto = dados
      .filter(c => c.status_pagamento === 'em_aberto')
      .reduce((sum, c) => sum + Number(c.valor), 0);
    const valorRecuperado = dados
      .filter(c => c.status_pagamento === 'pago')
      .reduce((sum, c) => sum + Number(c.juros_recebidos || 0), 0);
    const taxaRecuperacao = totalCobrancas > 0 
      ? (dados.filter(c => c.status_pagamento === 'pago').length / totalCobrancas) * 100 
      : 0;

    return {
      totalCobrancas,
      valorTotal,
      valorEmAberto,
      valorRecuperado,
      taxaRecuperacao
    };
  };

  const gerarRelatorio = async () => {
    setGerandoRelatorio(true);
    
    try {
      const dadosFiltrados = filtrarDados();
      const metricas = calcularMetricas(dadosFiltrados);

      // Simular geração do relatório
      await new Promise(resolve => setTimeout(resolve, 2000));

      const nomeArquivo = `relatorio_${config.tipo}_${new Date().toISOString().split('T')[0]}.${config.formato}`;
      
      // Aqui você implementaria a lógica real de geração
      // Por enquanto, vamos simular o download
      const blob = new Blob(['Relatório gerado com sucesso'], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Relatório gerado",
        description: `Relatório ${config.tipo} exportado como ${config.formato.toUpperCase()}`,
      });

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive",
      });
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const dadosFiltrados = filtrarDados();
  const metricas = calcularMetricas(dadosFiltrados);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Relatórios Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuração do Relatório */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Tipo de Relatório</Label>
              <Select 
                value={config.tipo} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, tipo: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposRelatorio.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      <div className="flex items-center gap-2">
                        <tipo.icon className="w-4 h-4" />
                        {tipo.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Formato de Exportação</Label>
              <Select 
                value={config.formato} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, formato: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatosExportacao.map(formato => (
                    <SelectItem key={formato.value} value={formato.value}>
                      <div className="flex items-center gap-2">
                        <formato.icon className="w-4 h-4" />
                        {formato.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  dataInicio: e.target.value ? new Date(e.target.value) : null 
                }))}
              />
            </div>

            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  dataFim: e.target.value ? new Date(e.target.value) : null 
                }))}
              />
            </div>
          </div>

          {/* Filtros Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Status</Label>
              <Select 
                value={config.filtros.status} 
                onValueChange={(value) => setConfig(prev => ({ 
                  ...prev, 
                  filtros: { ...prev.filtros, status: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="em_aberto">Em Aberto</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assistente</Label>
              <Select 
                value={config.filtros.assistente} 
                onValueChange={(value) => setConfig(prev => ({ 
                  ...prev, 
                  filtros: { ...prev.filtros, assistente: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {/* Aqui você adicionaria os assistentes disponíveis */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Cobrança</Label>
              <Select 
                value={config.filtros.tipoCobranca} 
                onValueChange={(value) => setConfig(prev => ({ 
                  ...prev, 
                  filtros: { ...prev.filtros, tipoCobranca: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Cobrança +VGV">Cobrança +VGV</SelectItem>
                  <SelectItem value="Serasa">Serasa</SelectItem>
                  <SelectItem value="Cartório">Cartório</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview das Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Total Cobranças</p>
                    <p className="text-2xl font-bold text-blue-900">{metricas.totalCobrancas}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Valor Total</p>
                    <p className="text-2xl font-bold text-green-900">
                      R$ {(metricas.valorTotal / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Em Aberto</p>
                    <p className="text-2xl font-bold text-red-900">
                      R$ {(metricas.valorEmAberto / 1000).toFixed(0)}k
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Taxa Recuperação</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {metricas.taxaRecuperacao.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão Gerar Relatório */}
          <div className="flex justify-center">
            <Button 
              onClick={gerarRelatorio}
              disabled={gerandoRelatorio}
              className="flex items-center gap-2"
              size="lg"
            >
              {gerandoRelatorio ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {gerandoRelatorio ? 'Gerando Relatório...' : 'Gerar Relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosAvancados; 