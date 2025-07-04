-- Criar tabela de regras de automação
CREATE TABLE public.regras_automacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  condicoes JSONB NOT NULL DEFAULT '{}',
  acoes JSONB NOT NULL DEFAULT '[]',
  prioridade INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_regras_automacao_user_id ON public.regras_automacao(user_id);
CREATE INDEX idx_regras_automacao_ativa ON public.regras_automacao(ativa);
CREATE INDEX idx_regras_automacao_prioridade ON public.regras_automacao(prioridade);

-- Habilitar RLS
ALTER TABLE public.regras_automacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para regras de automação
CREATE POLICY "Usuarios veem suas próprias regras" 
  ON public.regras_automacao FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem gerenciar suas regras" 
  ON public.regras_automacao FOR ALL
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_regras_automacao
  BEFORE UPDATE ON public.regras_automacao
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para executar automações
CREATE OR REPLACE FUNCTION public.executar_automacao_cobranca(
  p_cobranca_id UUID
)
RETURNS VOID AS $$
DECLARE
  cobranca_record RECORD;
  regra_record RECORD;
  acao_record RECORD;
  dias_atraso INTEGER;
BEGIN
  -- Buscar dados da cobrança
  SELECT * INTO cobranca_record 
  FROM public.cobrancas 
  WHERE id = p_cobranca_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calcular dias em atraso
  dias_atraso = public.calcular_dias_atraso(cobranca_record.vencimento);
  
  -- Buscar regras ativas do assistente responsável
  FOR regra_record IN 
    SELECT * FROM public.regras_automacao 
    WHERE user_id = cobranca_record.assistente_responsavel 
    AND ativa = true
    ORDER BY prioridade ASC
  LOOP
    -- Verificar se a regra se aplica
    IF (
      dias_atraso >= (regra_record.condicoes->>'diasAtraso')::INTEGER
      AND (
        regra_record.condicoes->>'statusCliente' = 'todos' 
        OR cobranca_record.status_cliente = regra_record.condicoes->>'statusCliente'
      )
      AND cobranca_record.valor >= (regra_record.condicoes->>'valorMinimo')::DECIMAL
      AND cobranca_record.valor <= (regra_record.condicoes->>'valorMaximo')::DECIMAL
    ) THEN
      -- Executar ações da regra
      FOR acao_record IN 
        SELECT * FROM jsonb_array_elements(regra_record.acoes) AS acao
      LOOP
        -- Inserir ação na fila de execução
        INSERT INTO public.fila_acoes_automacao (
          cobranca_id,
          regra_id,
          tipo_acao,
          conteudo,
          delay_minutos,
          status
        ) VALUES (
          p_cobranca_id,
          regra_record.id,
          acao_record->>'tipo',
          acao_record->>'conteudo',
          (acao_record->>'delay')::INTEGER,
          'pendente'
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar tabela de fila de ações automáticas
CREATE TABLE public.fila_acoes_automacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
  regra_id UUID NOT NULL REFERENCES public.regras_automacao(id) ON DELETE CASCADE,
  tipo_acao TEXT NOT NULL,
  conteudo TEXT,
  delay_minutos INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'executando', 'concluida', 'erro')),
  data_execucao TIMESTAMP WITH TIME ZONE,
  resultado TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_fila_acoes_cobranca ON public.fila_acoes_automacao(cobranca_id);
CREATE INDEX idx_fila_acoes_status ON public.fila_acoes_automacao(status);
CREATE INDEX idx_fila_acoes_data_execucao ON public.fila_acoes_automacao(data_execucao);

-- Habilitar RLS
ALTER TABLE public.fila_acoes_automacao ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para fila de ações
CREATE POLICY "Usuarios veem ações de suas cobranças" 
  ON public.fila_acoes_automacao FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cobrancas 
      WHERE id = fila_acoes_automacao.cobranca_id 
      AND assistente_responsavel = auth.uid()
    )
  );

CREATE POLICY "Sistema pode gerenciar fila de ações" 
  ON public.fila_acoes_automacao FOR ALL
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_updated_at_fila_acoes
  BEFORE UPDATE ON public.fila_acoes_automacao
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para executar automação quando cobrança é criada/atualizada
CREATE OR REPLACE FUNCTION public.trigger_automacao_cobranca()
RETURNS TRIGGER AS $$
BEGIN
  -- Executar automação para a cobrança
  PERFORM public.executar_automacao_cobranca(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_automacao_cobranca_insert
  AFTER INSERT ON public.cobrancas
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_automacao_cobranca();

CREATE TRIGGER trigger_automacao_cobranca_update
  AFTER UPDATE ON public.cobrancas
  FOR EACH ROW
  WHEN (OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento)
  EXECUTE FUNCTION public.trigger_automacao_cobranca(); 