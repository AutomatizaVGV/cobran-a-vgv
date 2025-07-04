
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface MensagemCadencia {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
  ativa: boolean;
}

const CadenciaMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mensagens, setMensagens] = useState<MensagemCadencia[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novaMsg, setNovaMsg] = useState({ titulo: '', conteudo: '', ordem: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      carregarMensagens();
    }
  }, [user]);

  const carregarMensagens = async () => {
    try {
      const { data, error } = await supabase
        .from('mensagens_cadencia')
        .select('*')
        .eq('user_id', user?.id)
        .order('ordem');

      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens de cadência",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarMensagem = async (mensagem: Partial<MensagemCadencia>) => {
    try {
      if (mensagem.id) {
        const { error } = await supabase
          .from('mensagens_cadencia')
          .update({
            titulo: mensagem.titulo,
            conteudo: mensagem.conteudo,
            ordem: mensagem.ordem,
            ativa: mensagem.ativa
          })
          .eq('id', mensagem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('mensagens_cadencia')
          .insert({
            user_id: user?.id,
            titulo: novaMsg.titulo,
            conteudo: novaMsg.conteudo,
            ordem: novaMsg.ordem
          });

        if (error) throw error;
        setNovaMsg({ titulo: '', conteudo: '', ordem: mensagens.length + 1 });
      }

      await carregarMensagens();
      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Mensagem salva com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar mensagem",
        variant: "destructive",
      });
    }
  };

  const excluirMensagem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mensagens_cadencia')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await carregarMensagens();
      toast({
        title: "Sucesso",
        description: "Mensagem excluída com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir mensagem",
        variant: "destructive",
      });
    }
  };

  const toggleAtiva = async (id: string, ativa: boolean) => {
    try {
      const { error } = await supabase
        .from('mensagens_cadencia')
        .update({ ativa })
        .eq('id', id);

      if (error) throw error;
      await carregarMensagens();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Cadência de Mensagens
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
            <MessageSquare className="w-5 h-5" />
            Cadência de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nova Mensagem */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h4 className="font-semibold mb-3">Nova Mensagem</h4>
            <div className="grid grid-cols-1 gap-3">
              <Input
                placeholder="Título da mensagem"
                value={novaMsg.titulo}
                onChange={(e) => setNovaMsg({...novaMsg, titulo: e.target.value})}
              />
              <Textarea
                placeholder="Conteúdo da mensagem (use [NOME_CLIENTE], [VALOR], [PRODUTO] para personalizar)"
                value={novaMsg.conteudo}
                onChange={(e) => setNovaMsg({...novaMsg, conteudo: e.target.value})}
                rows={3}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Ordem"
                  value={novaMsg.ordem}
                  onChange={(e) => setNovaMsg({...novaMsg, ordem: parseInt(e.target.value) || 1})}
                  className="w-24"
                />
                <Button 
                  onClick={() => salvarMensagem({})}
                  disabled={!novaMsg.titulo || !novaMsg.conteudo}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Mensagens */}
          <div className="space-y-3">
            {mensagens.map((msg) => (
              <div key={msg.id} className="border rounded-lg p-4">
                {editingId === msg.id ? (
                  <EditMessageForm 
                    mensagem={msg}
                    onSave={salvarMensagem}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">#{msg.ordem}</Badge>
                        <h5 className="font-semibold">{msg.titulo}</h5>
                        <Switch
                          checked={msg.ativa}
                          onCheckedChange={(checked) => toggleAtiva(msg.id, checked)}
                        />
                        <span className="text-sm text-slate-600">
                          {msg.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(msg.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluirMensagem(msg.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 bg-white p-2 rounded border">
                      {msg.conteudo}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EditMessageForm = ({ mensagem, onSave, onCancel }: {
  mensagem: MensagemCadencia;
  onSave: (msg: MensagemCadencia) => void;
  onCancel: () => void;
}) => {
  const [editData, setEditData] = useState(mensagem);

  return (
    <div className="space-y-3">
      <Input
        value={editData.titulo}
        onChange={(e) => setEditData({...editData, titulo: e.target.value})}
      />
      <Textarea
        value={editData.conteudo}
        onChange={(e) => setEditData({...editData, conteudo: e.target.value})}
        rows={3}
      />
      <div className="flex gap-2">
        <Input
          type="number"
          value={editData.ordem}
          onChange={(e) => setEditData({...editData, ordem: parseInt(e.target.value) || 1})}
          className="w-24"
        />
        <Button onClick={() => onSave(editData)} size="sm">
          <Save className="w-4 h-4" />
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default CadenciaMessages;
