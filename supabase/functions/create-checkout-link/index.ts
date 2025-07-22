import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateCheckoutRequest {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
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

    const { title, description, amount, currency = 'BRL' }: CreateCheckoutRequest = await req.json();

    // Buscar configuração do Mercado Pago
    const { data: config, error: configError } = await supabase
      .from('mercadopago_config')
      .select('*')
      .single();

    if (configError || !config) {
      console.error('Config error:', configError);
      return new Response(
        JSON.stringify({ error: 'Configuração do Mercado Pago não encontrada' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Criar preferência no Mercado Pago
    const reference_id = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const preferenceData = {
      items: [{
        title,
        description: description || title,
        quantity: 1,
        currency_id: currency,
        unit_price: amount
      }],
      external_reference: reference_id,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      auto_return: 'approved',
      back_urls: {
        success: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-success`,
        failure: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-failure`,
        pending: `${req.headers.get('origin') || 'http://localhost:5173'}/payment-pending`
      }
    };

    const mpUrl = config.is_sandbox 
      ? 'https://api.mercadopago.com/checkout/preferences'
      : 'https://api.mercadopago.com/checkout/preferences';

    const mpResponse = await fetch(mpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.access_token}`
      },
      body: JSON.stringify(preferenceData)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Mercado Pago API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar preferência no Mercado Pago', details: errorText }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const mpData = await mpResponse.json();
    console.log('Mercado Pago response:', mpData);

    // Salvar link no banco
    const { data: checkoutLink, error: insertError } = await supabase
      .from('checkout_links')
      .insert({
        title,
        description,
        amount,
        currency,
        reference_id,
        mercadopago_preference_id: mpData.id,
        checkout_url: mpData.init_point,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar link no banco', details: insertError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify(checkoutLink),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in create-checkout-link function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);