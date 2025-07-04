
-- Adicionar novos campos à tabela cobrancas
ALTER TABLE public.cobrancas 
ADD COLUMN data_cobranca DATE,
ADD COLUMN status_cliente TEXT,
ADD COLUMN tipo_cobranca TEXT,
ADD COLUMN juros_recebidos DECIMAL(15,2) DEFAULT 0,
ADD COLUMN empreendimento TEXT;

-- Atualizar campo produto para manter compatibilidade (renomear para empreendimento)
UPDATE public.cobrancas SET empreendimento = produto WHERE empreendimento IS NULL;

-- Adicionar novos campos à tabela recebimentos
ALTER TABLE public.recebimentos 
ADD COLUMN tipo_pagamento TEXT,
ADD COLUMN juros_pagos DECIMAL(15,2) DEFAULT 0;

-- Criar tabela de mensagens de cadência
CREATE TABLE public.mensagens_cadencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 1,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de métricas diárias
CREATE TABLE public.metricas_diarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  contatos_realizados INTEGER NOT NULL DEFAULT 0,
  meta_contatos INTEGER NOT NULL DEFAULT 50,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, data_referencia)
);

-- Criar índices para performance
CREATE INDEX idx_cobrancas_data_cobranca ON public.cobrancas(data_cobranca);
CREATE INDEX idx_cobrancas_status_cliente ON public.cobrancas(status_cliente);
CREATE INDEX idx_cobrancas_tipo_cobranca ON public.cobrancas(tipo_cobranca);
CREATE INDEX idx_cobrancas_empreendimento ON public.cobrancas(empreendimento);
CREATE INDEX idx_recebimentos_tipo_pagamento ON public.recebimentos(tipo_pagamento);
CREATE INDEX idx_mensagens_cadencia_user ON public.mensagens_cadencia(user_id);
CREATE INDEX idx_metricas_diarias_user_data ON public.metricas_diarias(user_id, data_referencia);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.mensagens_cadencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_diarias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para mensagens_cadencia
CREATE POLICY "Usuarios veem suas próprias mensagens" 
  ON public.mensagens_cadencia FOR SELECT
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Usuarios podem gerenciar suas mensagens" 
  ON public.mensagens_cadencia FOR ALL
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Políticas RLS para metricas_diarias
CREATE POLICY "Usuarios veem suas próprias métricas" 
  ON public.metricas_diarias FOR SELECT
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Usuarios podem gerenciar suas métricas" 
  ON public.metricas_diarias FOR ALL
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Trigger para atualizar updated_at nas novas tabelas
CREATE TRIGGER set_updated_at_mensagens_cadencia
  BEFORE UPDATE ON public.mensagens_cadencia
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_metricas_diarias
  BEFORE UPDATE ON public.metricas_diarias
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inserir algumas mensagens padrão de exemplo
INSERT INTO public.mensagens_cadencia (user_id, titulo, conteudo, ordem) 
SELECT 
  id,
  'Primeira Tentativa',
  'Olá [NOME_CLIENTE], identificamos um débito em aberto referente ao [PRODUTO] no valor de R$ [VALOR]. Entre em contato para regularização.',
  1
FROM public.users WHERE role = 'user';

INSERT INTO public.mensagens_cadencia (user_id, titulo, conteudo, ordem) 
SELECT 
  id,
  'Segunda Tentativa', 
  'Prezado(a) [NOME_CLIENTE], seu débito de R$ [VALOR] referente ao [PRODUTO] ainda está em aberto. Regularize para evitar negativação.',
  2
FROM public.users WHERE role = 'user';

INSERT INTO public.mensagens_cadencia (user_id, titulo, conteudo, ordem) 
SELECT 
  id,
  'Última Oportunidade',
  'URGENTE: [NOME_CLIENTE], esta é sua última oportunidade para quitar o débito de R$ [VALOR] antes da negativação. Entre em contato HOJE!',
  3
FROM public.users WHERE role = 'user';
