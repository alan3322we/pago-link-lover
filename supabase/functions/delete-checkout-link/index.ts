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

    const { linkId }: { linkId: string } = await req.json();

    // Chamar função do banco para deletar link
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('delete_checkout_link', { link_id: linkId });

    if (deleteError) {
      console.error('Delete function error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao deletar link', details: deleteError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!deleteResult.success) {
      return new Response(
        JSON.stringify({ error: deleteResult.error }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Se tem preference_id, tentar deletar do Mercado Pago
    if (deleteResult.preference_id) {
      const { data: config } = await supabase
        .from('mercadopago_config')
        .select('*')
        .single();

      if (config?.access_token) {
        try {
          // Tentar deletar preferência do Mercado Pago (pode não existir mais)
          const mpUrl = `https://api.mercadopago.com/checkout/preferences/${deleteResult.preference_id}`;
          await fetch(mpUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${config.access_token}`
            }
          });
        } catch (mpError) {
          console.log('Mercado Pago delete error (pode ser normal):', mpError);
          // Não falhar se não conseguir deletar do MP
        }
      }
    }

    // Se tem imagem, deletar do storage
    if (deleteResult.image_url) {
      try {
        const imagePath = deleteResult.image_url.split('/').pop();
        if (imagePath) {
          await supabase.storage
            .from('product-images')
            .remove([imagePath]);
        }
      } catch (storageError) {
        console.log('Storage delete error:', storageError);
        // Não falhar se não conseguir deletar a imagem
      }
    }

    // Deletar completamente do banco agora
    const { error: finalDeleteError } = await supabase
      .from('checkout_links')
      .delete()
      .eq('id', linkId);

    if (finalDeleteError) {
      console.error('Final delete error:', finalDeleteError);
      return new Response(
        JSON.stringify({ error: 'Erro ao deletar definitivamente', details: finalDeleteError }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in delete-checkout-link function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);