import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessPaymentRequest {
  checkout_link_id: string;
  payment_method: 'credit_card' | 'debit_card' | 'pix' | 'boleto';
  card_data?: {
    token: string;
    installments: number;
  };
  customer_data: {
    name: string;
    email: string;
    phone: string;
    document_type: string;
    document_number: string;
  };
  order_bump_selected?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const {
      checkout_link_id,
      payment_method,
      card_data,
      customer_data,
      order_bump_selected = false
    }: ProcessPaymentRequest = await req.json();

    // Buscar link de checkout
    const { data: checkoutLink, error: linkError } = await supabase
      .from('checkout_links')
      .select('*')
      .eq('id', checkout_link_id)
      .eq('is_active', true)
      .single();

    if (linkError || !checkoutLink) {
      return new Response(
        JSON.stringify({ error: 'Link de checkout não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Buscar configuração do Mercado Pago
    const { data: config, error: configError } = await supabase
      .from('mercadopago_config')
      .select('*')
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'Configuração do Mercado Pago não encontrada' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Buscar order bump se selecionado
    let orderBumpAmount = 0;
    if (order_bump_selected) {
      const { data: orderBump } = await supabase
        .from('order_bumps')
        .select('*')
        .eq('checkout_link_id', checkout_link_id)
        .eq('is_active', true)
        .single();
      
      if (orderBump) {
        orderBumpAmount = Number(orderBump.price);
      }
    }

    const totalAmount = Number(checkoutLink.amount) + orderBumpAmount;

    // Preparar dados do pagamento
    const paymentData: any = {
      transaction_amount: totalAmount,
      token: card_data?.token,
      installments: card_data?.installments || 1,
      payment_method_id: payment_method === 'credit_card' ? 'visa' : payment_method,
      payer: {
        email: customer_data.email,
        identification: {
          type: customer_data.document_type,
          number: customer_data.document_number,
        },
        first_name: customer_data.name.split(' ')[0],
        last_name: customer_data.name.split(' ').slice(1).join(' ') || customer_data.name.split(' ')[0],
      },
      external_reference: checkoutLink.reference_id,
      description: checkoutLink.description || checkoutLink.title,
      metadata: {
        checkout_link_id: checkout_link_id,
        order_bump_selected: order_bump_selected,
        order_bump_amount: orderBumpAmount
      }
    };

    // Criar pagamento no Mercado Pago
    const mpUrl = config.is_sandbox 
      ? 'https://api.mercadopago.com/v1/payments'
      : 'https://api.mercadopago.com/v1/payments';

    const mpResponse = await fetch(mpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.access_token}`
      },
      body: JSON.stringify(paymentData)
    });

    const mpData = await mpResponse.json();
    console.log('Mercado Pago payment response:', mpData);

    if (!mpResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Erro ao processar pagamento', details: mpData }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Salvar pagamento no banco
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        mercadopago_payment_id: mpData.id.toString(),
        checkout_link_id: checkout_link_id,
        amount: totalAmount,
        currency: checkoutLink.currency,
        status: mpData.status,
        payment_method: mpData.payment_method_id,
        payer_email: customer_data.email,
        payer_name: customer_data.name,
        payer_phone: customer_data.phone,
        payer_document_type: customer_data.document_type,
        payer_document_number: customer_data.document_number,
        customer_data: customer_data,
        order_bump_selected: order_bump_selected,
        order_bump_amount: orderBumpAmount,
        transaction_amount: mpData.transaction_amount,
        net_received_amount: mpData.transaction_details?.net_received_amount,
        fee_amount: mpData.fee_details?.[0]?.amount,
        webhook_data: mpData
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error saving payment:', paymentError);
    }

    // Criar notificação
    await supabase
      .from('notifications')
      .insert({
        type: 'payment_created',
        message: `Novo pagamento de ${totalAmount} ${checkoutLink.currency} - ${mpData.status}`,
        payment_id: payment?.id
      });

    return new Response(
      JSON.stringify({
        payment_id: mpData.id,
        status: mpData.status,
        payment_method: mpData.payment_method_id,
        transaction_amount: mpData.transaction_amount,
        pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        boleto_url: mpData.transaction_details?.external_resource_url,
        approval_url: mpData.sandbox_url
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in process-transparent-payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);