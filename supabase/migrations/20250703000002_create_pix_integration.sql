-- Criar tabela de configurações PIX
CREATE TABLE public.configuracoes_pix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chave_pix TEXT NOT NULL,
  tipo_chave TEXT NOT NULL CHECK (tipo_chave IN ('email', 'cpf', 'cnpj', 'telefone', 'aleatoria')),
  nome_recebedor TEXT NOT NULL,
  cidade_recebedor TEXT,
  cep_recebedor TEXT,
  ativo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar tabela de cobranças PIX
CREATE TABLE public.cobrancas_pix (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
  valor DECIMAL(15,2) NOT NULL,
  chave_pix TEXT NOT NULL,
  qr_code TEXT,
  qr_code_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'expirado')),
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_configuracoes_pix_user ON public.configuracoes_pix(user_id);
CREATE INDEX idx_cobrancas_pix_cobranca ON public.cobrancas_pix(cobranca_id);
CREATE INDEX idx_cobrancas_pix_status ON public.cobrancas_pix(status);
CREATE INDEX idx_cobrancas_pix_data_expiracao ON public.cobrancas_pix(data_expiracao);

-- Habilitar RLS
ALTER TABLE public.configuracoes_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas_pix ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para configurações PIX
CREATE POLICY "Usuarios veem suas próprias configurações" 
  ON public.configuracoes_pix FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios podem gerenciar suas configurações" 
  ON public.configuracoes_pix FOR ALL
  USING (user_id = auth.uid());

-- Políticas RLS para cobranças PIX
CREATE POLICY "Usuarios veem PIX de suas cobranças" 
  ON public.cobrancas_pix FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cobrancas 
      WHERE id = cobrancas_pix.cobranca_id 
      AND assistente_responsavel = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem criar PIX para suas cobranças" 
  ON public.cobrancas_pix FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cobrancas 
      WHERE id = cobrancas_pix.cobranca_id 
      AND assistente_responsavel = auth.uid()
    )
  );

CREATE POLICY "Sistema pode atualizar status dos PIX" 
  ON public.cobrancas_pix FOR UPDATE
  USING (true);

-- Triggers para atualizar updated_at
CREATE TRIGGER set_updated_at_configuracoes_pix
  BEFORE UPDATE ON public.configuracoes_pix
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_cobrancas_pix
  BEFORE UPDATE ON public.cobrancas_pix
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para gerar QR Code PIX
CREATE OR REPLACE FUNCTION public.gerar_qr_code_pix(
  p_chave_pix TEXT,
  p_valor DECIMAL,
  p_nome_recebedor TEXT,
  p_cidade_recebedor TEXT
)
RETURNS TEXT AS $$
DECLARE
  qr_code_text TEXT;
BEGIN
  -- Gerar código PIX no formato EMV
  qr_code_text := '00020126580014br.gov.bcb.pix0136' || 
                   p_chave_pix || 
                   '5204000053039865405' || 
                   LENGTH(p_valor::TEXT) || 
                   p_valor::TEXT || 
                   '5802BR5913' || 
                   p_nome_recebedor || 
                   '6008' || 
                   p_cidade_recebedor || 
                   '62070503***6304ABCD';
  
  RETURN qr_code_text;
END;
$$ LANGUAGE plpgsql STABLE;

-- Função para criar PIX automaticamente
CREATE OR REPLACE FUNCTION public.criar_pix_cobranca(
  p_cobranca_id UUID,
  p_valor DECIMAL
)
RETURNS UUID AS $$
DECLARE
  pix_id UUID;
  config_record RECORD;
  qr_code_text TEXT;
BEGIN
  -- Buscar configuração PIX do assistente responsável
  SELECT cp.* INTO config_record
  FROM public.configuracoes_pix cp
  JOIN public.cobrancas c ON c.assistente_responsavel = cp.user_id
  WHERE c.id = p_cobranca_id AND cp.ativo = true
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuração PIX não encontrada ou inativa';
  END IF;
  
  -- Gerar QR Code
  qr_code_text := public.gerar_qr_code_pix(
    config_record.chave_pix,
    p_valor,
    config_record.nome_recebedor,
    config_record.cidade_recebedor
  );
  
  -- Inserir cobrança PIX
  INSERT INTO public.cobrancas_pix (
    cobranca_id,
    valor,
    chave_pix,
    qr_code_text,
    data_expiracao
  ) VALUES (
    p_cobranca_id,
    p_valor,
    config_record.chave_pix,
    qr_code_text,
    now() + INTERVAL '24 hours'
  ) RETURNING id INTO pix_id;
  
  RETURN pix_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 