import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, MessageSquare, Mail, MapPin, Handshake, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Acao {
  id: string;
  tipo_acao: string;
  data_acao: string;
  observacao: string;
  resultado: string | null;
  user_email?: string;
}

interface HistoricoAcoesProps {
  cobrancaId: string;
}

const HistoricoAcoes: React.FC<HistoricoAcoesProps> = ({ cobrancaId }) => {
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarAcoes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('acoes_cobranca')
        .select(`
          id,
          tipo_acao,
          data_acao,
          observacao,
          resultado,
          users(email)
        `)
        .eq('cobranca_id', cobrancaId)
        .order('data_acao', { ascending: false });

      if (error) throw error;

      const acoesComEmail = data.map(acao => ({
        ...acao,
        user_email: (acao as any).users?.email || 'Usuário desconhecido'
      }));

      setAcoes(acoesComEmail);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cobrancaId) {
      carregarAcoes();
    }
  }, [cobrancaId]);

  const getIconeAcao = (tipo: string) => {
    switch (tipo) {
      case 'Ligação': return Phone;
      case 'WhatsApp': return MessageSquare;
      case 'E-mail': return Mail;
      case 'Visita': return MapPin;
      case 'Negociação': return Handshake;
      default: return Clock;
    }
  };

  const getCorAcao = (tipo: string) => {
    switch (tipo) {
      case 'Ligação': return 'bg-blue-500';
      case 'WhatsApp': return 'bg-green-500';
      case 'E-mail': return 'bg-purple-500';
      case 'Visita': return 'bg-orange-500';
      case 'Negociação': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p>Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (acoes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">
            Nenhuma ação registrada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Histórico de Ações ({acoes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {acoes.map((acao) => {
            const IconeAcao = getIconeAcao(acao.tipo_acao);
            return (
              <div key={acao.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                <div className={`p-2 rounded-full ${getCorAcao(acao.tipo_acao)} flex-shrink-0`}>
                  <IconeAcao className="w-4 h-4 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{acao.tipo_acao}</span>
                      {acao.resultado && (
                        <Badge variant="outline" className="text-xs">
                          {acao.resultado}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(acao.data_acao).toLocaleDateString()} às{' '}
                      {new Date(acao.data_acao).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-700 mb-2">
                    {acao.observacao}
                  </p>
                  
                  <p className="text-xs text-slate-500">
                    Registrado por: {acao.user_email}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoricoAcoes;