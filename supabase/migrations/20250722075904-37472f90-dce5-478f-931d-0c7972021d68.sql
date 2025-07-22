-- Criar tabela para configurações do Mercado Pago
CREATE TABLE public.mercadopago_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  public_key TEXT,
  webhook_secret TEXT,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para links de checkout
CREATE TABLE public.checkout_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  reference_id TEXT UNIQUE,
  mercadopago_preference_id TEXT,
  checkout_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para pagamentos
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checkout_link_id UUID REFERENCES public.checkout_links(id),
  mercadopago_payment_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  payer_name TEXT,
  payer_email TEXT,
  payer_phone TEXT,
  payer_document_type TEXT,
  payer_document_number TEXT,
  payment_method TEXT,
  transaction_amount DECIMAL(10,2),
  net_received_amount DECIMAL(10,2),
  fee_amount DECIMAL(10,2),
  webhook_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.mercadopago_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações (apenas admin pode ver/editar)
CREATE POLICY "Admin can manage config" ON public.mercadopago_config FOR ALL USING (true);

-- Políticas para links de checkout
CREATE POLICY "Anyone can view active checkout links" ON public.checkout_links FOR SELECT USING (is_active = true);
CREATE POLICY "Admin can manage checkout links" ON public.checkout_links FOR ALL USING (true);

-- Políticas para pagamentos
CREATE POLICY "Admin can view all payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Admin can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update payments" ON public.payments FOR UPDATE USING (true);

-- Políticas para notificações
CREATE POLICY "Admin can manage notifications" ON public.notifications FOR ALL USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_mercadopago_config_updated_at
  BEFORE UPDATE ON public.mercadopago_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checkout_links_updated_at
  BEFORE UPDATE ON public.checkout_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;