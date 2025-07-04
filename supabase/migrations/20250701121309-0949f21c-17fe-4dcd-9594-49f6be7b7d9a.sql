
-- Distribuir cobranças existentes entre os assistentes disponíveis
-- Primeiro, vamos verificar quantos usuários temos e distribuir as cobranças igualmente

WITH usuarios_disponveis AS (
  SELECT id, email, ROW_NUMBER() OVER (ORDER BY email) as rn
  FROM users
  WHERE role IN ('admin', 'user')
),
total_usuarios AS (
  SELECT COUNT(*) as total FROM usuarios_disponveis
),
cobrancas_sem_assistente AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM cobrancas 
  WHERE assistente_responsavel IS NULL
)
UPDATE cobrancas 
SET assistente_responsavel = (
  SELECT u.id 
  FROM usuarios_disponveis u, total_usuarios t
  WHERE u.rn = ((c.rn - 1) % t.total) + 1
)
FROM cobrancas_sem_assistente c
WHERE cobrancas.id = c.id;

-- Verificar o resultado da distribuição
SELECT 
  u.email,
  u.role,
  COUNT(c.id) as total_cobrancas
FROM users u
LEFT JOIN cobrancas c ON c.assistente_responsavel = u.id
GROUP BY u.id, u.email, u.role
ORDER BY u.email;
