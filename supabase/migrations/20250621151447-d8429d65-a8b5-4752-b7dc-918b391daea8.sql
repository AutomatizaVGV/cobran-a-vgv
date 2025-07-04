
-- Criar tabela de cobranças (sem a coluna gerada problemática)
CREATE TABLE public.cobrancas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  produto TEXT NOT NULL,
  vencimento DATE NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'em_aberto',
  origem TEXT,
  assistente_responsavel UUID REFERENCES public.users(id),
  ultima_acao TEXT,
  resultado_ultima_acao TEXT,
  proxima_acao TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de recebimentos
CREATE TABLE public.recebimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
  data_recebimento DATE NOT NULL,
  valor_pago DECIMAL(15,2) NOT NULL,
  forma_pagamento TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de ações de cobrança (histórico)
CREATE TABLE public.acoes_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  tipo_acao TEXT NOT NULL,
  resultado TEXT,
  observacao TEXT,
  data_acao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Função para calcular dias em atraso
CREATE OR REPLACE FUNCTION public.calcular_dias_atraso(vencimento_data DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE 
    WHEN CURRENT_DATE > vencimento_data THEN CURRENT_DATE - vencimento_data
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Criar índices para performance
CREATE INDEX idx_cobrancas_assistente ON public.cobrancas(assistente_responsavel);
CREATE INDEX idx_cobrancas_status ON public.cobrancas(status_pagamento);
CREATE INDEX idx_cobrancas_vencimento ON public.cobrancas(vencimento);
CREATE INDEX idx_cobrancas_cpf_cnpj ON public.cobrancas(cpf_cnpj);
CREATE INDEX idx_recebimentos_cobranca ON public.recebimentos(cobranca_id);
CREATE INDEX idx_acoes_cobranca_id ON public.acoes_cobranca(cobranca_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela cobrancas
CREATE POLICY "Usuarios veem apenas suas cobranças" 
  ON public.cobrancas FOR SELECT
  USING (
    auth.uid() = assistente_responsavel OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Usuarios podem atualizar suas cobranças" 
  ON public.cobrancas FOR UPDATE
  USING (
    auth.uid() = assistente_responsavel OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Apenas admins podem inserir cobranças" 
  ON public.cobrancas FOR INSERT
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Apenas admins podem deletar cobranças" 
  ON public.cobrancas FOR DELETE
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Políticas para tabela recebimentos
CREATE POLICY "Usuarios veem recebimentos de suas cobranças" 
  ON public.recebimentos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cobrancas 
      WHERE id = recebimentos.cobranca_id 
      AND (assistente_responsavel = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
    )
  );

CREATE POLICY "Apenas admins podem gerenciar recebimentos" 
  ON public.recebimentos FOR ALL
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Políticas para tabela acoes_cobranca
CREATE POLICY "Usuarios veem ações de suas cobranças" 
  ON public.acoes_cobranca FOR SELECT
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin' OR
    EXISTS (
      SELECT 1 FROM public.cobrancas 
      WHERE id = acoes_cobranca.cobranca_id 
      AND assistente_responsavel = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem inserir ações em suas cobranças" 
  ON public.acoes_cobranca FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.cobrancas 
      WHERE id = cobranca_id 
      AND (assistente_responsavel = auth.uid() OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at na tabela cobrancas
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.cobrancas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
