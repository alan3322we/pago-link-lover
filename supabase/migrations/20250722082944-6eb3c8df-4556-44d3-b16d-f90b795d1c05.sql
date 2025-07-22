-- Criar bucket para imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Criar políticas para o bucket de imagens
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- Adicionar campo de imagem na tabela checkout_links
ALTER TABLE checkout_links ADD COLUMN image_url TEXT;

-- Criar função para deletar link do checkout e do Mercado Pago
CREATE OR REPLACE FUNCTION delete_checkout_link(link_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    link_record checkout_links%ROWTYPE;
    result JSON;
BEGIN
    -- Buscar o link
    SELECT * INTO link_record
    FROM checkout_links
    WHERE id = link_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Link não encontrado');
    END IF;
    
    -- Marcar como inativo primeiro
    UPDATE checkout_links 
    SET is_active = false, updated_at = now()
    WHERE id = link_id;
    
    -- Retornar dados para deletar no Mercado Pago
    RETURN json_build_object(
        'success', true, 
        'preference_id', link_record.mercadopago_preference_id,
        'image_url', link_record.image_url
    );
END;
$$;