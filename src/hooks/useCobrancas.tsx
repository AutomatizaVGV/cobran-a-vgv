
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  juros_recebidos: number | null;
  assistente_responsavel: string | null;
  status_kanban?: string | null; // Adicionado para suportar status de agendamento
}

interface UseCobrancasProps {
  userRole?: 'admin' | 'user';
}

export const useCobrancas = ({ userRole }: UseCobrancasProps = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarCobrancas = async () => {
    if (!user || !userRole) {
      console.log('useCobrancas: Aguardando user e userRole', { user: !!user, userRole });
      return;
    }

    try {
      console.log('useCobrancas: Carregando cobranças para role:', userRole);
      setLoading(true);
      
      let query = supabase
        .from('cobrancas')
        .select('*');

      // Se for usuário comum, mostrar apenas suas cobranças
      if (userRole === 'user') {
        console.log('useCobrancas: Filtrando por assistente_responsavel:', user.id);
        query = query.eq('assistente_responsavel', user.id);
      } else {
        console.log('useCobrancas: Admin - carregando todas as cobranças');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('useCobrancas: Cobranças carregadas:', data?.length || 0);
      setCobrancas(data || []);
    } catch (error) {
      console.error('Erro ao carregar cobranças:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar cobranças",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCobrancas();
  }, [user, userRole]);

  const calcularDiasAtraso = (vencimento: string): number => {
    const hoje = new Date();
    const dataVencimento = new Date(vencimento);
    const diffTime = hoje.getTime() - dataVencimento.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calcularMetricas = () => {
    const totalClientes = cobrancas.length;
    const valorEmAberto = cobrancas
      .filter(c => c.status_pagamento === 'em_aberto')
      .reduce((sum, c) => sum + Number(c.valor), 0);
    
    const valorRecuperado = cobrancas
      .filter(c => c.status_pagamento === 'pago')
      .reduce((sum, c) => sum + Number(c.valor), 0);
    const jurosRecebidos = cobrancas
      .filter(c => c.status_pagamento === 'pago')
      .reduce((sum, c) => sum + Number(c.juros_recebidos || 0), 0);

    return {
      totalClientes,
      valorEmAberto,
      valorRecuperado,
      jurosRecebidos
    };
  };

  return {
    cobrancas,
    loading,
    carregarCobrancas,
    calcularDiasAtraso,
    calcularMetricas
  };
};
