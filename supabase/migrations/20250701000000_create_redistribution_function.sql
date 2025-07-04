
-- Função para redistribuir cobranças igualmente entre assistentes
CREATE OR REPLACE FUNCTION public.redistribuir_cobrancas_igualmente()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usuarios_count INTEGER;
    cobranca_record RECORD;
    usuario_index INTEGER := 0;
    usuarios_array UUID[];
BEGIN
    -- Obter array de usuários disponíveis
    SELECT ARRAY_AGG(id ORDER BY email) INTO usuarios_array
    FROM users 
    WHERE role IN ('admin', 'user');
    
    usuarios_count := array_length(usuarios_array, 1);
    
    -- Se não há usuários, retornar
    IF usuarios_count = 0 THEN
        RETURN;
    END IF;
    
    -- Redistribuir cobranças em ordem round-robin
    FOR cobranca_record IN 
        SELECT id 
        FROM cobrancas 
        ORDER BY created_at 
    LOOP
        UPDATE cobrancas 
        SET assistente_responsavel = usuarios_array[(usuario_index % usuarios_count) + 1]
        WHERE id = cobranca_record.id;
        
        usuario_index := usuario_index + 1;
    END LOOP;
END;
$$;

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION public.redistribuir_cobrancas_igualmente() TO authenticated;
