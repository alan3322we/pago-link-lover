-- Adicionar novos campos de personalização para o checkout transparente
ALTER TABLE public.checkout_customization 
ADD COLUMN IF NOT EXISTS border_radius text DEFAULT '8px',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS button_style text DEFAULT 'rounded',
ADD COLUMN IF NOT EXISTS shadow_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS gradient_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gradient_start_color text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS gradient_end_color text DEFAULT '#10B981',
ADD COLUMN IF NOT EXISTS header_background_color text DEFAULT '#F8FAFC',
ADD COLUMN IF NOT EXISTS card_background_color text DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#F59E0B',
ADD COLUMN IF NOT EXISTS subtitle_color text DEFAULT '#6B7280',
ADD COLUMN IF NOT EXISTS border_color text DEFAULT '#E5E7EB',
ADD COLUMN IF NOT EXISTS hover_color text DEFAULT '#2563EB',
ADD COLUMN IF NOT EXISTS animation_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS custom_css text,
ADD COLUMN IF NOT EXISTS layout_style text DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS button_size text DEFAULT 'large',
ADD COLUMN IF NOT EXISTS spacing_size text DEFAULT 'normal';

-- Comentário sobre os novos campos
COMMENT ON COLUMN public.checkout_customization.border_radius IS 'Raio da borda dos elementos (ex: 8px, 16px, 32px)';
COMMENT ON COLUMN public.checkout_customization.font_family IS 'Família da fonte (ex: Inter, Roboto, Open Sans)';
COMMENT ON COLUMN public.checkout_customization.button_style IS 'Estilo dos botões (rounded, square, pill)';
COMMENT ON COLUMN public.checkout_customization.shadow_enabled IS 'Habilitar sombras nos elementos';
COMMENT ON COLUMN public.checkout_customization.gradient_enabled IS 'Habilitar gradientes de cores';
COMMENT ON COLUMN public.checkout_customization.gradient_start_color IS 'Cor inicial do gradiente';
COMMENT ON COLUMN public.checkout_customization.gradient_end_color IS 'Cor final do gradiente';
COMMENT ON COLUMN public.checkout_customization.header_background_color IS 'Cor de fundo do cabeçalho';
COMMENT ON COLUMN public.checkout_customization.card_background_color IS 'Cor de fundo dos cards';
COMMENT ON COLUMN public.checkout_customization.accent_color IS 'Cor de destaque/acento';
COMMENT ON COLUMN public.checkout_customization.subtitle_color IS 'Cor dos subtítulos';
COMMENT ON COLUMN public.checkout_customization.border_color IS 'Cor das bordas';
COMMENT ON COLUMN public.checkout_customization.hover_color IS 'Cor do hover/passagem do mouse';
COMMENT ON COLUMN public.checkout_customization.animation_enabled IS 'Habilitar animações';
COMMENT ON COLUMN public.checkout_customization.custom_css IS 'CSS customizado';
COMMENT ON COLUMN public.checkout_customization.layout_style IS 'Estilo do layout (modern, classic, minimal)';
COMMENT ON COLUMN public.checkout_customization.button_size IS 'Tamanho dos botões (small, normal, large)';
COMMENT ON COLUMN public.checkout_customization.spacing_size IS 'Espaçamento entre elementos (tight, normal, relaxed)';