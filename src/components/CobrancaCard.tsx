import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar, 
  DollarSign, 
  User, 
  Phone, 
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface CobrancaCardProps {
  cobranca: Cobranca;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onAbrirAcoes: (cobranca: Cobranca) => void;
  calcularDiasAtraso: (vencimento: string) => number;
}

const CobrancaCard: React.FC<CobrancaCardProps> = ({
  cobranca,
  isSelected,
  onSelect,
  onAbrirAcoes,
  calcularDiasAtraso
}) => {
  const [expandido, setExpandido] = useState(false);
  const diasAtraso = calcularDiasAtraso(cobranca.vencimento);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-green-500';
      case 'em_aberto': return diasAtraso > 0 ? 'bg-red-500' : 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'em_aberto': return diasAtraso > 0 ? `${diasAtraso} dias em atraso` : 'Em aberto';
      default: return status;
    }
  };

  const getProximaAcaoStatus = (proxima_acao: string | null) => {
    if (!proxima_acao) return null;
    // Espera formato: 'Descrição - YYYY-MM-DD'
    const partes = proxima_acao.split(' - ');
    if (partes.length < 2) return null;
    const dataStr = partes[1];
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return null;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    data.setHours(0,0,0,0);
    if (data < hoje) return { cor: 'bg-red-500', texto: 'Ação atrasada', icone: '⚠️' };
    if (data.getTime() === hoje.getTime()) return { cor: 'bg-yellow-400', texto: 'Ação hoje', icone: '🕒' };
    return { cor: 'bg-blue-500', texto: `Próxima: ${data.toLocaleDateString()}`, icone: '📅' };
  };

  const proximaStatus = getProximaAcaoStatus(cobranca.proxima_acao);

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(cobranca.id, !!checked)}
            />
            <div>
              <h3 className="font-semibold text-lg">{cobranca.cliente_nome}</h3>
              <p className="text-sm text-slate-600">{cobranca.cpf_cnpj}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={`${getStatusColor(cobranca.status_pagamento)} text-white`}
            >
              {getStatusText(cobranca.status_pagamento)}
            </Badge>
            {proximaStatus && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${proximaStatus.cor} text-white cursor-pointer`}>
                      <span>{proximaStatus.icone}</span>
                      {proximaStatus.texto}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{cobranca.proxima_acao}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandido(!expandido)}
            >
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-semibold">R$ {Number(cobranca.valor).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm">{new Date(cobranca.vencimento).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-600" />
            <span className="text-sm">{cobranca.assistente_email || 'Não atribuído'}</span>
          </div>
          
          <Button
            size="sm"
            onClick={() => onAbrirAcoes(cobranca)}
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Registrar Ação
          </Button>
        </div>
      </CardHeader>

      {expandido && (
        <CardContent className="pt-0 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Detalhes</h4>
              <div className="space-y-1 text-sm">
                {cobranca.empreendimento && (
                  <p><span className="font-medium">Empreendimento:</span> {cobranca.empreendimento}</p>
                )}
                {cobranca.tipo_cobranca && (
                  <p><span className="font-medium">Tipo:</span> {cobranca.tipo_cobranca}</p>
                )}
                {cobranca.status_cliente && (
                  <p><span className="font-medium">Status Cliente:</span> {cobranca.status_cliente}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Última Ação</h4>
              <div className="space-y-1 text-sm">
                {cobranca.ultima_acao ? (
                  <>
                    <p className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {cobranca.ultima_acao}
                    </p>
                    {cobranca.resultado_ultima_acao && (
                      <p className="text-slate-600">Resultado: {cobranca.resultado_ultima_acao}</p>
                    )}
                    {cobranca.proxima_acao && (
                      <p className="text-blue-600">Próxima: {cobranca.proxima_acao}</p>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 italic">Nenhuma ação registrada</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default CobrancaCard;