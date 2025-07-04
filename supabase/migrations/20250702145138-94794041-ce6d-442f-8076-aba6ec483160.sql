-- Correção das políticas RLS recursivas da tabela users

-- 1. Remover políticas problemáticas que causam recursão
DROP POLICY IF EXISTS "Users can view own data or admins view all" ON public.users;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.users;

-- 2. Criar função SECURITY DEFINER para verificações administrativas
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Criar políticas simplificadas sem recursão
CREATE POLICY "Users can view own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- 4. Política separada para admins verem todos os dados
CREATE POLICY "Admins can view all users" 
ON public.users 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- 5. Permitir que usuários atualizem seus próprios dados (exceto role)
CREATE POLICY "Users can update own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Apenas admins podem alterar roles
CREATE POLICY "Only admins can update roles" 
ON public.users 
FOR UPDATE 
USING (public.is_admin(auth.uid()) AND auth.uid() != id)
WITH CHECK (public.is_admin(auth.uid()));

-- 7. Manter política de inserção automática
-- (não precisa alterar, já existe)