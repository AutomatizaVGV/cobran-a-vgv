import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Clock, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  Save,
  X,
  Loader2,
  Plus
} from 'lucide-react';

interface RegraAutomacao {
  id: string;
  nome: string;
  descricao: string;
  ativa: boolean;
  condicoes: {
    diasAtraso: number;
    statusCliente: string;
    valorMinimo: number;
    valorMaximo: number;
  };
  acoes: {
    tipo: 'mensagem' | 'ligacao' | 'email' | 'notificacao';
    conteudo: string;
    delay: number;
  }[];
  prioridade: number;
  created_at: string;
}

const AutomacaoAcoes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [regras, setRegras] = useState<RegraAutomacao[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [novaRegra, setNovaRegra] = useState({
    nome: '',
    descricao: '',
    condicoes: {
      diasAtraso: 0,
      statusCliente: 'todos',
      valorMinimo: 0,
      valorMaximo: 999999
    },
    acoes: [{
      tipo: 'mensagem' as const,
      conteudo: '',
      delay: 0
    }],
    prioridade: 1
  });

  useEffect(() => {
    if (user) {
      carregarRegras();
    }
  }, [user]);

  const carregarRegras = async () => {
    try {
      const { data, error } = await supabase
        .from('regras_automacao')
        .select('*')
        .eq('user_id', user?.id)
        .order('prioridade', { ascending: true });

      if (error) throw error;
      setRegras(data || []);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar regras de automação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarRegra = async (regra: Partial<RegraAutomacao>) => {
    try {
      if (regra.id) {
        const { error } = await supabase
          .from('regras_automacao')
          .update({
            nome: regra.nome,
            descricao: regra.descricao,
            condicoes: regra.condicoes,
            acoes: regra.acoes,
            prioridade: regra.prioridade,
            ativa: regra.ativa
          })
          .eq('id', regra.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('regras_automacao')
          .insert({
            user_id: user?.id,
            nome: novaRegra.nome,
            descricao: novaRegra.descricao,
            condicoes: novaRegra.condicoes,
            acoes: novaRegra.acoes,
            prioridade: novaRegra.prioridade,
            ativa: true
          });

        if (error) throw error;
        setNovaRegra({
          nome: '',
          descricao: '',
          condicoes: {
            diasAtraso: 0,
            statusCliente: 'todos',
            valorMinimo: 0,
            valorMaximo: 999999
          },
          acoes: [{
            tipo: 'mensagem',
            conteudo: '',
            delay: 0
          }],
          prioridade: 1
        });
      }

      await carregarRegras();
      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Regra salva com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar regra",
        variant: "destructive",
      });
    }
  };

  const toggleRegra = async (id: string, ativa: boolean) => {
    try {
      const { error } = await supabase
        .from('regras_automacao')
        .update({ ativa })
        .eq('id', id);

      if (error) throw error;
      await carregarRegras();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const excluirRegra = async (id: string) => {
    try {
      const { error } = await supabase
        .from('regras_automacao')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await carregarRegras();
      toast({
        title: "Sucesso",
        description: "Regra excluída com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir regra:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir regra",
        variant: "destructive",
      });
    }
  };

  const adicionarAcao = () => {
    setNovaRegra(prev => ({
      ...prev,
      acoes: [...prev.acoes, {
        tipo: 'mensagem',
        conteudo: '',
        delay: 0
      }]
    }));
  };

  const removerAcao = (index: number) => {
    setNovaRegra(prev => ({
      ...prev,
      acoes: prev.acoes.filter((_, i) => i !== index)
    }));
  };

  const getAcaoIcon = (tipo: string) => {
    switch (tipo) {
      case 'mensagem':
        return <MessageSquare className="w-4 h-4" />;
      case 'ligacao':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'notificacao':
        return <Zap className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Automação de Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Automação de Ações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nova Regra */}
          <div className="border rounded-lg p-6 bg-slate-50">
            <h4 className="font-semibold mb-4">Nova Regra de Automação</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Nome da Regra</Label>
                <Input
                  placeholder="Ex: Cobrança 30 dias em atraso"
                  value={novaRegra.nome}
                  onChange={(e) => setNovaRegra({...novaRegra, nome: e.target.value})}
                />
              </div>
              
              <div>
                <Label>Prioridade</Label>
                <Input
                  type="number"
                  min="1"
                  value={novaRegra.prioridade}
                  onChange={(e) => setNovaRegra({...novaRegra, prioridade: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            <div className="mb-4">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o objetivo desta regra..."
                value={novaRegra.descricao}
                onChange={(e) => setNovaRegra({...novaRegra, descricao: e.target.value})}
                rows={2}
              />
            </div>

            {/* Condições */}
            <div className="mb-4">
              <Label className="text-sm font-semibold">Condições</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <Label className="text-xs">Dias em Atraso</Label>
                  <Input
                    type="number"
                    min="0"
                    value={novaRegra.condicoes.diasAtraso}
                    onChange={(e) => setNovaRegra({
                      ...novaRegra, 
                      condicoes: {...novaRegra.condicoes, diasAtraso: parseInt(e.target.value) || 0}
                    })}
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Status Cliente</Label>
                  <Select 
                    value={novaRegra.condicoes.statusCliente}
                    onValueChange={(value) => setNovaRegra({
                      ...novaRegra,
                      condicoes: {...novaRegra.condicoes, statusCliente: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="SPC">SPC</SelectItem>
                      <SelectItem value="Serasa">Serasa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Valor Mínimo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={novaRegra.condicoes.valorMinimo}
                    onChange={(e) => setNovaRegra({
                      ...novaRegra,
                      condicoes: {...novaRegra.condicoes, valorMinimo: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
                
                <div>
                  <Label className="text-xs">Valor Máximo</Label>
                  <Input
                    type="number"
                    min="0"
                    value={novaRegra.condicoes.valorMaximo}
                    onChange={(e) => setNovaRegra({
                      ...novaRegra,
                      condicoes: {...novaRegra.condicoes, valorMaximo: parseFloat(e.target.value) || 999999}
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Ações</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarAcao}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Ação
                </Button>
              </div>
              
              <div className="space-y-3">
                {novaRegra.acoes.map((acao, index) => (
                  <div key={index} className="border rounded p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getAcaoIcon(acao.tipo)}
                        <span className="text-sm font-medium">Ação {index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removerAcao(index)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Tipo</Label>
                        <Select 
                          value={acao.tipo}
                          onValueChange={(value) => {
                            const novasAcoes = [...novaRegra.acoes];
                            novasAcoes[index].tipo = value as any;
                            setNovaRegra({...novaRegra, acoes: novasAcoes});
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensagem">Mensagem</SelectItem>
                            <SelectItem value="ligacao">Ligação</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="notificacao">Notificação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Delay (minutos)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={acao.delay}
                          onChange={(e) => {
                            const novasAcoes = [...novaRegra.acoes];
                            novasAcoes[index].delay = parseInt(e.target.value) || 0;
                            setNovaRegra({...novaRegra, acoes: novasAcoes});
                          }}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Conteúdo</Label>
                        <Input
                          placeholder="Conteúdo da ação..."
                          value={acao.conteudo}
                          onChange={(e) => {
                            const novasAcoes = [...novaRegra.acoes];
                            novasAcoes[index].conteudo = e.target.value;
                            setNovaRegra({...novaRegra, acoes: novasAcoes});
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => salvarRegra({})}
              disabled={!novaRegra.nome || novaRegra.acoes.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Criar Regra
            </Button>
          </div>

          {/* Lista de Regras */}
          <div className="space-y-4">
            <h4 className="font-semibold">Regras Configuradas</h4>
            
            {regras.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Nenhuma regra configurada</p>
                <p className="text-sm">Crie sua primeira regra de automação acima</p>
              </div>
            ) : (
              <div className="space-y-3">
                {regras.map((regra) => (
                  <Card key={regra.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold">{regra.nome}</h5>
                            <Badge variant={regra.ativa ? "default" : "secondary"}>
                              {regra.ativa ? "Ativa" : "Inativa"}
                            </Badge>
                            <Badge variant="outline">Prioridade: {regra.prioridade}</Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{regra.descricao}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="font-medium">Dias Atraso:</span> {regra.condicoes.diasAtraso}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span> {regra.condicoes.statusCliente}
                            </div>
                            <div>
                              <span className="font-medium">Valor:</span> R$ {regra.condicoes.valorMinimo} - R$ {regra.condicoes.valorMaximo}
                            </div>
                            <div>
                              <span className="font-medium">Ações:</span> {regra.acoes.length}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={regra.ativa}
                            onCheckedChange={(checked) => toggleRegra(regra.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(regra.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => excluirRegra(regra.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomacaoAcoes; 