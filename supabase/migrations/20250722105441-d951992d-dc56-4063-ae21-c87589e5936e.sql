-- Adicionar campo delivery_link na tabela checkout_links
ALTER TABLE checkout_links ADD COLUMN delivery_link TEXT;

-- Criar função para apagar notificações
CREATE OR REPLACE FUNCTION delete_notification(notification_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM notifications WHERE id = notification_id;
    RETURN json_build_object('success', true);
END;
$$;

-- Criar função para apagar todos as notificações
CREATE OR REPLACE FUNCTION delete_all_notifications()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM notifications;
    RETURN json_build_object('success', true, 'message', 'Todas as notificações foram apagadas');
END;
$$;

-- Criar função para apagar pagamento
CREATE OR REPLACE FUNCTION delete_payment(payment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM payments WHERE id = payment_id;
    RETURN json_build_object('success', true);
END;
$$;

-- Criar função para apagar todos pagamentos
CREATE OR REPLACE FUNCTION delete_all_payments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM payments;
    RETURN json_build_object('success', true, 'message', 'Todos os pagamentos foram apagados');
END;
$$;