import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  ArrowRight, 
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Usuario {
  id: string;
  email: string;
  role: string;
  total_cobrancas: number;
}

interface Cobranca {
  id: string;
  cliente_nome: string;
  valor: number;
  assistente_responsavel: string | null;
}

interface TransferenciaLoteProps {
  usuarios: Usuario[];
  cobrancasSelecionadas: string[];
  cobrancas: Cobranca[];
  onTransferenciaCompleta: () => void;
  onLimparSelecao: () => void;
}

const TransferenciaLote: React.FC<TransferenciaLoteProps> = ({
  usuarios,
  cobrancasSelecionadas,
  cobrancas,
  onTransferenciaCompleta,
  onLimparSelecao
}) => {
  const [novoAssistente, setNovoAssistente] = useState('');
  const [transferindo, setTransferindo] = useState(false);
  const { toast } = useToast();

  const cobrancasParaTransferir = cobrancas.filter(c => 
    cobrancasSelecionadas.includes(c.id)
  );

  const valorTotal = cobrancasParaTransferir.reduce((sum, c) => sum + Number(c.valor), 0);

  const transferirLote = async () => {
    if (!novoAssistente || cobrancasSelecionadas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione um assistente e pelo menos uma cobrança",
        variant: "destructive",
      });
      return;
    }

    try {
      setTransferindo(true);

      const { error } = await supabase
        .from('cobrancas')
        .update({ assistente_responsavel: novoAssistente })
        .in('id', cobrancasSelecionadas);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${cobrancasSelecionadas.length} cobranças transferidas com sucesso`,
      });

      setNovoAssistente('');
      onLimparSelecao();
      onTransferenciaCompleta();
    } catch (error) {
      console.error('Erro ao transferir cobranças:', error);
      toast({
        title: "Erro",
        description: "Erro ao transferir cobranças em lote",
        variant: "destructive",
      });
    } finally {
      setTransferindo(false);
    }
  };

  if (cobrancasSelecionadas.length === 0) {
    return (
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="p-6 text-center">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            Transferência em Lote
          </h3>
          <p className="text-slate-500">
            Selecione as cobranças que deseja transferir usando os checkboxes nos cards
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Users className="w-5 h-5" />
          Transferência em Lote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Resumo da Seleção */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <div>
              <p className="font-semibold">
                {cobrancasSelecionadas.length} cobranças selecionadas
              </p>
              <p className="text-sm text-slate-600">
                Valor total: R$ {valorTotal.toLocaleString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLimparSelecao}
            >
              <Square className="w-4 h-4 mr-2" />
              Limpar Seleção
            </Button>
          </div>

          {/* Lista de Cobranças Selecionadas */}
          <div className="max-h-32 overflow-y-auto space-y-1">
            {cobrancasParaTransferir.slice(0, 5).map((cobranca) => (
              <div key={cobranca.id} className="flex items-center justify-between p-2 bg-white rounded text-sm">
                <span className="font-medium">{cobranca.cliente_nome}</span>
                <span className="text-slate-600">R$ {Number(cobranca.valor).toLocaleString()}</span>
              </div>
            ))}
            {cobrancasParaTransferir.length > 5 && (
              <p className="text-center text-sm text-slate-500 p-2">
                ... e mais {cobrancasParaTransferir.length - 5} cobranças
              </p>
            )}
          </div>

          {/* Seleção do Novo Assistente */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Transferir para:
              </label>
              <Select value={novoAssistente} onValueChange={setNovoAssistente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar assistente" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((usuario) => (
                    <SelectItem key={usuario.id} value={usuario.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{usuario.email}</span>
                        <Badge variant="secondary" className="ml-2">
                          {usuario.total_cobrancas} cobranças
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={transferirLote} 
              disabled={transferindo || !novoAssistente}
              className="w-full"
            >
              {transferindo ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Transferir Lote
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransferenciaLote;