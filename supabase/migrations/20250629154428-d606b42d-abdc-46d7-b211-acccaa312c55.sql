
-- Adicionar coluna quantidade_parcelas na tabela cobrancas
ALTER TABLE public.cobrancas 
ADD COLUMN quantidade_parcelas INTEGER DEFAULT 1;

-- Criar índice para performance
CREATE INDEX idx_cobrancas_quantidade_parcelas ON public.cobrancas(quantidade_parcelas);
