import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('Webhook received:', webhookData);

    // Buscar configuração do Mercado Pago
    const { data: config, error: configError } = await supabase
      .from('mercadopago_config')
      .select('*')
      .single();

    if (configError || !config) {
      console.error('Config error:', configError);
      return new Response('Config not found', { status: 400 });
    }

    // Processar notificações de pagamento
    if (webhookData.type === 'payment') {
      const paymentId = webhookData.data?.id;
      
      if (!paymentId) {
        console.error('Payment ID not found in webhook');
        return new Response('Payment ID not found', { status: 400 });
      }

      // Buscar dados do pagamento no Mercado Pago
      const mpUrl = config.is_sandbox 
        ? `https://api.mercadopago.com/v1/payments/${paymentId}`
        : `https://api.mercadopago.com/v1/payments/${paymentId}`;

      const mpResponse = await fetch(mpUrl, {
        headers: {
          'Authorization': `Bearer ${config.access_token}`
        }
      });

      if (!mpResponse.ok) {
        console.error('Error fetching payment from Mercado Pago');
        return new Response('Error fetching payment', { status: 500 });
      }

      const paymentData = await mpResponse.json();
      console.log('Payment data from MP:', paymentData);

      // Buscar checkout link relacionado
      const { data: checkoutLink } = await supabase
        .from('checkout_links')
        .select('*')
        .eq('reference_id', paymentData.external_reference)
        .single();

      // Verificar se o pagamento já existe
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('mercadopago_payment_id', paymentId.toString())
        .single();

      const paymentRecord = {
        checkout_link_id: checkoutLink?.id || null,
        mercadopago_payment_id: paymentId.toString(),
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        currency: paymentData.currency_id,
        payer_name: `${paymentData.payer?.first_name || ''} ${paymentData.payer?.last_name || ''}`.trim() || null,
        payer_email: paymentData.payer?.email || null,
        payer_phone: paymentData.payer?.phone?.number || null,
        payer_document_type: paymentData.payer?.identification?.type || null,
        payer_document_number: paymentData.payer?.identification?.number || null,
        payment_method: paymentData.payment_method_id,
        transaction_amount: paymentData.transaction_amount,
        net_received_amount: paymentData.transaction_details?.net_received_amount || null,
        fee_amount: paymentData.fee_details?.[0]?.amount || null,
        webhook_data: paymentData
      };

      // Criar ou atualizar notificação baseada no status
      let notificationMessage = '';
      let notificationType = 'payment_status_update';

      switch (paymentData.status) {
        case 'approved':
          notificationMessage = `✅ Pagamento aprovado! ${paymentRecord.payer_name || 'Cliente'} pagou R$ ${paymentData.transaction_amount} via ${paymentData.payment_method_id}`;
          notificationType = 'payment_approved';
          break;
        case 'pending':
          notificationMessage = `⏳ Pagamento pendente - R$ ${paymentData.transaction_amount} via ${paymentData.payment_method_id}`;
          notificationType = 'payment_pending';
          break;
        case 'rejected':
          notificationMessage = `❌ Pagamento rejeitado - R$ ${paymentData.transaction_amount} via ${paymentData.payment_method_id}`;
          notificationType = 'payment_rejected';
          break;
        case 'cancelled':
          notificationMessage = `🚫 Pagamento cancelado - R$ ${paymentData.transaction_amount} via ${paymentData.payment_method_id}`;
          notificationType = 'payment_cancelled';
          break;
        case 'refunded':
          notificationMessage = `💸 Pagamento reembolsado - R$ ${paymentData.transaction_amount} via ${paymentData.payment_method_id}`;
          notificationType = 'payment_refunded';
          break;
        default:
          notificationMessage = `Status do pagamento atualizado: ${paymentData.status} - R$ ${paymentData.transaction_amount}`;
      }

      if (existingPayment) {
        // Atualizar pagamento existente
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            ...paymentRecord,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id);

        if (updateError) {
          console.error('Error updating payment:', updateError);
          return new Response('Error updating payment', { status: 500 });
        }

        // Criar notificação apenas se houve mudança de status
        if (existingPayment.status !== paymentData.status) {
          await supabase
            .from('notifications')
            .insert({
              payment_id: existingPayment.id,
              type: notificationType,
              message: notificationMessage
            });
        }
      } else {
        // Criar novo pagamento
        const { data: newPayment, error: insertError } = await supabase
          .from('payments')
          .insert(paymentRecord)
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting payment:', insertError);
          return new Response('Error inserting payment', { status: 500 });
        }

        // Criar notificação para novo pagamento
        await supabase
          .from('notifications')
          .insert({
            payment_id: newPayment.id,
            type: notificationType,
            message: notificationMessage
          });
      }
    }

    return new Response('OK', { status: 200 });

  } catch (error: any) {
    console.error('Error in webhook function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);