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

    // Gerar chave de idempotência única
    const idempotencyKey = `${checkout_link_id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Preparar dados do pagamento baseado no método
    let paymentData: any = {
      transaction_amount: totalAmount,
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

    // Configurar dados específicos por método de pagamento
    if (payment_method === 'credit_card') {
      paymentData.token = card_data?.token;
      paymentData.installments = card_data?.installments || 1;
      paymentData.payment_method_id = 'visa'; // Será determinado pelo token
    } else if (payment_method === 'debit_card') {
      paymentData.token = card_data?.token;
      paymentData.payment_method_id = 'debvisa'; // Será determinado pelo token
    } else if (payment_method === 'pix') {
      paymentData.payment_method_id = 'pix';
      // Configurações específicas para PIX
      paymentData.date_of_expiration = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutos
    } else if (payment_method === 'boleto') {
      paymentData.payment_method_id = 'bolbradesco';
      paymentData.date_of_expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 dias
    }

    // Criar pagamento no Mercado Pago
    const mpUrl = config.is_sandbox 
      ? 'https://api.mercadopago.com/v1/payments'
      : 'https://api.mercadopago.com/v1/payments';

    const mpResponse = await fetch(mpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.access_token}`,
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        ...paymentData,
        notification_url: "https://yutddrrtogmpakzfzaqz.supabase.co/functions/v1/mercadopago-webhook"
      })
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

    // Estruturar resposta baseada no método de pagamento
    let responseData: any = {
      payment_id: mpData.id?.toString(),
      status: mpData.status,
      payment_method: mpData.payment_method_id,
      transaction_amount: mpData.transaction_amount,
    };

    // Adicionar dados específicos do PIX
    if (payment_method === 'pix' && mpData.point_of_interaction) {
      responseData.pix_qr_code = mpData.point_of_interaction.transaction_data?.qr_code;
      responseData.pix_qr_code_base64 = mpData.point_of_interaction.transaction_data?.qr_code_base64;
      responseData.pix_key = mpData.point_of_interaction.transaction_data?.qr_code; // Chave PIX é o mesmo que QR code
      responseData.expiration_date = mpData.date_of_expiration;
    }
    
    // Adicionar dados específicos do Boleto
    if (payment_method === 'boleto') {
      responseData.boleto_url = mpData.transaction_details?.external_resource_url;
      responseData.barcode = mpData.barcode?.content;
    }

    // Para sandbox, adicionar URL de aprovação
    if (config.is_sandbox) {
      responseData.sandbox_url = mpData.sandbox_url;
    }

    return new Response(
      JSON.stringify(responseData),
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