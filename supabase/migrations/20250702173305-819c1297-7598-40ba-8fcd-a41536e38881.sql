-- Transferir 10 cobranças do assistente que tem mais para o usuário silfrancys92@gmail.com
UPDATE public.cobrancas 
SET assistente_responsavel = '03deb42d-119d-472b-9607-f3f2301a3ea6'
WHERE assistente_responsavel = 'dc6c73b5-4c5d-4d68-8a1f-35c28e108585'
AND id IN (
  SELECT id 
  FROM public.cobrancas 
  WHERE assistente_responsavel = 'dc6c73b5-4c5d-4d68-8a1f-35c28e108585'
  LIMIT 10
);