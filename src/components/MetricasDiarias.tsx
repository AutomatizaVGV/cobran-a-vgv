
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Target, TrendingUp, Calendar, Plus, Minus } from 'lucide-react';

interface MetricaDiaria {
  id: string;
  data_referencia: string;
  contatos_realizados: number;
  meta_contatos: number;
  observacoes: string | null;
}

const MetricasDiarias = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metricaHoje, setMetricaHoje] = useState<MetricaDiaria | null>(null);
  const [loading, setLoading] = useState(true);

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      carregarMetricaHoje();
    }
  }, [user]);

  const carregarMetricaHoje = async () => {
    try {
      const { data, error } = await supabase
        .from('metricas_diarias')
        .select('*')
        .eq('user_id', user?.id)
        .eq('data_referencia', hoje)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // Criar métrica para hoje se não existir
        const { data: novaMetrica, error: createError } = await supabase
          .from('metricas_diarias')
          .insert({
            user_id: user?.id,
            data_referencia: hoje,
            contatos_realizados: 0,
            meta_contatos: 50
          })
          .select()
          .single();

        if (createError) throw createError;
        setMetricaHoje(novaMetrica);
      } else {
        setMetricaHoje(data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar métricas do dia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarContatos = async (incremento: number) => {
    if (!metricaHoje) return;

    const novosContatos = Math.max(0, metricaHoje.contatos_realizados + incremento);

    try {
      const { error } = await supabase
        .from('metricas_diarias')
        .update({ contatos_realizados: novosContatos })
        .eq('id', metricaHoje.id);

      if (error) throw error;

      setMetricaHoje({
        ...metricaHoje,
        contatos_realizados: novosContatos
      });

      if (incremento > 0) {
        toast({
          title: "Contato registrado!",
          description: `Total de contatos hoje: ${novosContatos}`,
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar contatos:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar contatos",
        variant: "destructive",
      });
    }
  };

  const atualizarMeta = async (novaMeta: number) => {
    if (!metricaHoje) return;

    try {
      const { error } = await supabase
        .from('metricas_diarias')
        .update({ meta_contatos: novaMeta })
        .eq('id', metricaHoje.id);

      if (error) throw error;

      setMetricaHoje({
        ...metricaHoje,
        meta_contatos: novaMeta
      });

      toast({
        title: "Meta atualizada!",
        description: `Nova meta: ${novaMeta} contatos`,
      });
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar meta",
        variant: "destructive",
      });
    }
  };

  const atualizarObservacoes = async (observacoes: string) => {
    if (!metricaHoje) return;

    try {
      const { error } = await supabase
        .from('metricas_diarias')
        .update({ observacoes })
        .eq('id', metricaHoje.id);

      if (error) throw error;

      setMetricaHoje({
        ...metricaHoje,
        observacoes
      });

      toast({
        title: "Observações salvas!",
        description: "Suas observações foram atualizadas",
      });
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar observações",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Métricas do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!metricaHoje) return null;

  const progresso = (metricaHoje.contatos_realizados / metricaHoje.meta_contatos) * 100;
  const progressoFormatado = Math.min(progresso, 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contador de Contatos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Contatos Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {metricaHoje.contatos_realizados}
            </div>
            <div className="text-sm text-slate-600">
              Meta: {metricaHoje.meta_contatos} contatos
            </div>
          </div>

          <Progress value={progressoFormatado} className="h-3" />

          <div className="text-center text-sm">
            <span className={progresso >= 100 ? 'text-green-600 font-semibold' : 'text-slate-600'}>
              {progressoFormatado.toFixed(1)}% da meta alcançada
            </span>
          </div>

          <div className="flex justify-center gap-2">
            <Button
              onClick={() => atualizarContatos(-1)}
              variant="outline"
              size="sm"
              disabled={metricaHoje.contatos_realizados === 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => atualizarContatos(1)}
              className="px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Registrar Contato
            </Button>
          </div>

          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Nova meta"
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement;
                  const novaMeta = parseInt(target.value);
                  if (novaMeta > 0) {
                    atualizarMeta(novaMeta);
                    target.value = '';
                  }
                }
              }}
            />
            <span className="text-sm text-slate-600">Enter para salvar</span>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Observações do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Anote aqui suas observações, dificuldades ou conquistas do dia..."
            value={metricaHoje.observacoes || ''}
            onChange={(e) => setMetricaHoje({
              ...metricaHoje,
              observacoes: e.target.value
            })}
            onBlur={(e) => atualizarObservacoes(e.target.value)}
            rows={8}
            className="resize-none"
          />
          <div className="text-xs text-slate-500 mt-2">
            As observações são salvas automaticamente
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricasDiarias;
