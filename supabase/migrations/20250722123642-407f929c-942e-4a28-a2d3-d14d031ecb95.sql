-- Adicionar delivery_link na tabela order_bumps
ALTER TABLE public.order_bumps ADD COLUMN IF NOT EXISTS delivery_link TEXT;

-- Criar tabela de profiles para usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para updated_at na tabela profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$;

-- Atualizar policies das tabelas existentes para incluir verificação de admin
DROP POLICY IF EXISTS "Admin can manage customization" ON public.checkout_customization;
CREATE POLICY "Admin can manage customization" 
ON public.checkout_customization 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage checkout links" ON public.checkout_links;
CREATE POLICY "Admin can manage checkout links" 
ON public.checkout_links 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage order bumps" ON public.order_bumps;
CREATE POLICY "Admin can manage order bumps" 
ON public.order_bumps 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage config" ON public.mercadopago_config;
CREATE POLICY "Admin can manage config" 
ON public.mercadopago_config 
FOR ALL 
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can manage notifications" ON public.notifications;
CREATE POLICY "Admin can manage notifications" 
ON public.notifications 
FOR ALL 
USING (public.is_admin());

-- Atualizar policies de payments
DROP POLICY IF EXISTS "Admin can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admin can update payments" ON public.payments;
DROP POLICY IF EXISTS "Admin can insert payments" ON public.payments;

CREATE POLICY "Admin can view all payments" 
ON public.payments 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admin can update payments" 
ON public.payments 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admin can insert payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (true); -- Permitir inserção via webhook

CREATE POLICY "Anyone can view payments for webhooks" 
ON public.payments 
FOR SELECT 
USING (true); -- Para webhooks funcionarem