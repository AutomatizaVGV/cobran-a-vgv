import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Calendar, Phone, MessageSquare, Mail, MapPin, Handshake } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import HistoricoAcoes from './HistoricoAcoes';

interface Cobranca {
  id: string;
  cliente_nome: string;
  cpf_cnpj: string;
  valor: number;
  vencimento: string;
  status_pagamento: string;
}

interface AcoesCobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cobranca: Cobranca | null;
  onAcaoSalva: () => void;
}

const AcoesCobrancaModal: React.FC<AcoesCobrancaModalProps> = ({
  isOpen,
  onClose,
  cobranca,
  onAcaoSalva
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  
  const [formData, setFormData] = useState({
    tipo_acao: '',
    observacao: '',
    resultado: '',
    proximaAcao: '',
    dataProximaAcao: ''
  });

  const tiposAcao = [
    { value: 'Ligação', label: 'Ligação', icon: Phone },
    { value: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare },
    { value: 'E-mail', label: 'E-mail', icon: Mail },
    { value: 'Visita', label: 'Visita', icon: MapPin },
    { value: 'Negociação', label: 'Negociação', icon: Handshake }
  ];

  const resultados = [
    'Sem resposta',
    'Não atende',
    'Prometeu pagar',
    'Negociou prazo',
    'Pagamento confirmado',
    'Cliente irritado',
    'Número incorreto',
    'Vai analisar',
    'Solicitou boleto',
    'Outros'
  ];

  const sugestoesProximaAcao = [
    'Ligar novamente',
    'Enviar WhatsApp',
    'Aguardar retorno',
    'Enviar e-mail',
    'Agendar visita',
    'Outro'
  ];

  const handleSalvar = async () => {
    if (!cobranca || !user || !formData.tipo_acao || !formData.observacao || !formData.resultado) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios (inclua o resultado)",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);

      // Inserir ação na tabela acoes_cobranca
      const { error: acaoError } = await supabase
        .from('acoes_cobranca')
        .insert({
          cobranca_id: cobranca.id,
          user_id: user.id,
          tipo_acao: formData.tipo_acao,
          observacao: formData.observacao,
          resultado: formData.resultado || null
        });

      if (acaoError) throw acaoError;

      // Atualizar campos da cobrança
      const updateData: Record<string, any> = {
        ultima_acao: formData.tipo_acao,
        resultado_ultima_acao: formData.resultado || null
      };

      if (formData.proximaAcao && formData.dataProximaAcao) {
        updateData.proxima_acao = `${formData.proximaAcao} - ${formData.dataProximaAcao}`;
      }

      const { error: cobrancaError } = await supabase
        .from('cobrancas')
        .update(updateData)
        .eq('id', cobranca.id);

      if (cobrancaError) throw cobrancaError;

      toast({
        title: "Sucesso",
        description: "Ação registrada com sucesso",
      });

      // Limpar formulário
      setFormData({
        tipo_acao: '',
        observacao: '',
        resultado: '',
        proximaAcao: '',
        dataProximaAcao: ''
      });

      onAcaoSalva();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar ação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar ação",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  if (!cobranca) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Ação - {cobranca.cliente_nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Cobrança */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-lg">{cobranca.cliente_nome}</p>
                <p className="text-sm text-slate-600">{cobranca.cpf_cnpj}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Valor</p>
                <p className="text-lg font-bold">R$ {Number(cobranca.valor).toLocaleString()}</p>
                <Badge variant={cobranca.status_pagamento === 'pago' ? 'default' : 'destructive'}>
                  {cobranca.status_pagamento}
                </Badge>
              </div>
            </div>
          </div>

          {/* Formulário de Ação */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Ação *
              </label>
              <Select value={formData.tipo_acao} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, tipo_acao: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  {tiposAcao.map((tipo) => (
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
              <label className="block text-sm font-medium mb-2">
                Observações *
              </label>
              <Textarea
                placeholder="Descreva detalhadamente o que aconteceu na interação..."
                value={formData.observacao}
                onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Resultado *
              </label>
              <Select value={formData.resultado} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, resultado: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Qual foi o resultado?" />
                </SelectTrigger>
                <SelectContent>
                  {resultados.map((resultado) => (
                    <SelectItem key={resultado} value={resultado}>
                      {resultado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Próxima Ação com sugestões rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Próxima Ação
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {sugestoesProximaAcao.map((sugestao) => (
                    <Button
                      key={sugestao}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, proximaAcao: sugestao }))}
                    >
                      {sugestao}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Ex: Ligar novamente"
                  value={formData.proximaAcao}
                  onChange={(e) => setFormData(prev => ({ ...prev, proximaAcao: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Data da Próxima Ação
                </label>
                <Input
                  type="date"
                  value={formData.dataProximaAcao}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataProximaAcao: e.target.value }))}
                />
              </div>
            </div>
          </div>
          {/* Histórico de ações */}
          <div className="pt-8">
            <HistoricoAcoes cobrancaId={cobranca.id} />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Ação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcoesCobrancaModal;