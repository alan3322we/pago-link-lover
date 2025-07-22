import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfigRequest {
  access_token: string;
  public_key?: string;
  is_sandbox: boolean;
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

    const { access_token, public_key, is_sandbox }: ConfigRequest = await req.json();

    // Verificar se já existe configuração
    const { data: existingConfig } = await supabase
      .from('mercadopago_config')
      .select('*')
      .single();

    const configData = {
      access_token,
      public_key,
      is_sandbox,
      webhook_secret: crypto.randomUUID()
    };

    let result;
    if (existingConfig) {
      // Atualizar configuração existente
      result = await supabase
        .from('mercadopago_config')
        .update(configData)
        .eq('id', existingConfig.id)
        .select()
        .single();
    } else {
      // Criar nova configuração
      result = await supabase
        .from('mercadopago_config')
        .insert(configData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('Config save error:', result.error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar configuração' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Configuração salva com sucesso!' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in save-config function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);