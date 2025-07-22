-- Fix the delete functions to properly delete all records
CREATE OR REPLACE FUNCTION public.delete_all_payments()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM payments WHERE true;
    RETURN json_build_object('success', true, 'message', 'Todos os pagamentos foram apagados');
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_all_notifications()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM notifications WHERE true;
    RETURN json_build_object('success', true, 'message', 'Todas as notificações foram apagadas');
END;
$function$;