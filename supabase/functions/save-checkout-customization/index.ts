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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const customizationData = await req.json();

    // Primeiro, tentar buscar configuração existente
    const { data: existingConfig } = await supabase
      .from('checkout_customization')
      .select('*')
      .limit(1)
      .single();

    let result;
    if (existingConfig) {
      // Atualizar configuração existente
      const { data, error } = await supabase
        .from('checkout_customization')
        .update(customizationData)
        .eq('id', existingConfig.id)
        .select()
        .single();

      result = { data, error };
    } else {
      // Criar nova configuração
      const { data, error } = await supabase
        .from('checkout_customization')
        .insert(customizationData)
        .select()
        .single();

      result = { data, error };
    }

    if (result.error) {
      console.error('Error saving customization:', result.error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar personalização' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify(result.data),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in save-checkout-customization:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);