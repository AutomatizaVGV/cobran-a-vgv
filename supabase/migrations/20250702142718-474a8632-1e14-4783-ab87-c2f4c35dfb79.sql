-- 1. Criar função para sincronizar usuários automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, password, role)
  VALUES (
    NEW.id,
    NEW.email,
    'temp_password', -- Senha temporária, será gerenciada pelo Supabase Auth
    CASE 
      WHEN (SELECT COUNT(*) FROM public.users WHERE role = 'admin') = 0 THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Inserir usuários já autenticados que não existem na tabela users
INSERT INTO public.users (id, email, password, role)
SELECT 
  au.id,
  au.email,
  'temp_password', -- Senha temporária, autenticação real é via Supabase Auth
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN 'admin'
    ELSE 'user'
  END as role
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Configurar RLS policies para tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários vejam apenas seus próprios dados ou admins vejam tudo
DROP POLICY IF EXISTS "Users can view own data or admins view all" ON public.users;
CREATE POLICY "Users can view own data or admins view all" 
ON public.users 
FOR SELECT 
USING (
  auth.uid() = id OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Permitir que apenas admins atualizem roles
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.users;
CREATE POLICY "Only admins can update user roles" 
ON public.users 
FOR UPDATE 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Permitir inserção automática via trigger
DROP POLICY IF EXISTS "Allow automatic user creation" ON public.users;
CREATE POLICY "Allow automatic user creation" 
ON public.users 
FOR INSERT 
WITH CHECK (true);