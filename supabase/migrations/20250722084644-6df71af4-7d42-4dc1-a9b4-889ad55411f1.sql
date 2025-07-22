-- Criar tabela para personalização do checkout
CREATE TABLE public.checkout_customization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Cores personalizadas
  primary_color TEXT NOT NULL DEFAULT '#3B82F6',
  secondary_color TEXT NOT NULL DEFAULT '#10B981',
  background_color TEXT NOT NULL DEFAULT '#FFFFFF',
  text_color TEXT NOT NULL DEFAULT '#1F2937',
  
  -- Logo e imagens
  logo_url TEXT,
  background_image_url TEXT,
  
  -- Textos personalizados
  company_name TEXT NOT NULL DEFAULT 'Minha Empresa',
  checkout_title TEXT NOT NULL DEFAULT 'Finalizar Compra',
  checkout_description TEXT,
  success_message TEXT NOT NULL DEFAULT 'Pagamento realizado com sucesso!',
  
  -- Configurações de layout
  show_company_logo BOOLEAN NOT NULL DEFAULT true,
  show_security_badges BOOLEAN NOT NULL DEFAULT true,
  show_payment_methods BOOLEAN NOT NULL DEFAULT true,
  
  -- Configurações de pagamento
  enable_credit_card BOOLEAN NOT NULL DEFAULT true,
  enable_debit_card BOOLEAN NOT NULL DEFAULT true,
  enable_pix BOOLEAN NOT NULL DEFAULT true,
  enable_boleto BOOLEAN NOT NULL DEFAULT true,
  
  -- Order bump
  enable_order_bump BOOLEAN NOT NULL DEFAULT false,
  order_bump_title TEXT,
  order_bump_description TEXT,
  order_bump_price NUMERIC(10,2),
  order_bump_image_url TEXT
);

-- Criar tabela para order bumps
CREATE TABLE public.order_bumps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_link_id UUID REFERENCES public.checkout_links(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Adicionar colunas na tabela payments para dados do cliente
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_data JSONB;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_bump_selected BOOLEAN DEFAULT false;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS order_bump_amount NUMERIC(10,2) DEFAULT 0;

-- Habilitar RLS
ALTER TABLE public.checkout_customization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_bumps ENABLE ROW LEVEL SECURITY;

-- Policies para checkout_customization
CREATE POLICY "Admin can manage customization" 
ON public.checkout_customization 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can view customization" 
ON public.checkout_customization 
FOR SELECT 
USING (true);

-- Policies para order_bumps
CREATE POLICY "Admin can manage order bumps" 
ON public.order_bumps 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can view active order bumps" 
ON public.order_bumps 
FOR SELECT 
USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_checkout_customization_updated_at
BEFORE UPDATE ON public.checkout_customization
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_bumps_updated_at
BEFORE UPDATE ON public.order_bumps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão
INSERT INTO public.checkout_customization (
  company_name,
  checkout_title,
  primary_color,
  secondary_color
) VALUES (
  'Minha Empresa',
  'Finalizar Compra',
  '#3B82F6',
  '#10B981'
) ON CONFLICT DO NOTHING;