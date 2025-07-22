import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Palette, Settings, Eye, Trash2 } from 'lucide-react';

export const CheckoutCustomization = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customization, setCustomization] = useState({
    primary_color: '#3B82F6',
    secondary_color: '#10B981',
    background_color: '#FFFFFF',
    text_color: '#1F2937',
    logo_url: '',
    background_image_url: '',
    company_name: 'Minha Empresa',
    checkout_title: 'Finalizar Compra',
    checkout_description: '',
    success_message: 'Pagamento realizado com sucesso!',
    show_company_logo: true,
    show_security_badges: true,
    show_payment_methods: true,
    enable_credit_card: true,
    enable_debit_card: true,
    enable_pix: true,
    enable_boleto: true,
    enable_order_bump: false,
    order_bump_title: '',
    order_bump_description: '',
    order_bump_price: 0,
    order_bump_image_url: ''
  });

  useEffect(() => {
    loadCustomization();
  }, []);

  const loadCustomization = async () => {
    try {
      const { data, error } = await supabase
        .from('checkout_customization')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setCustomization(data);
      }
    } catch (error) {
      console.error('Error loading customization:', error);
    }
  };

  const handleImageUpload = async (file: File, field: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `checkout/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setCustomization(prev => ({
        ...prev,
        [field]: data.publicUrl
      }));

      toast({
        title: "Imagem carregada!",
        description: "A imagem foi carregada com sucesso.",
      });

    } catch (error: any) {
      toast({
        title: "Erro ao carregar imagem",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('save-checkout-customization', {
        body: customization
      });

      if (error) throw error;

      toast({
        title: "Personalização salva!",
        description: "As configurações do checkout foram atualizadas.",
      });

    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      // Delete existing configuration
      const { error: deleteError } = await supabase
        .from('checkout_customization')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) throw deleteError;

      // Reset to default values
      setCustomization({
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        logo_url: '',
        background_image_url: '',
        company_name: 'Minha Empresa',
        checkout_title: 'Finalizar Compra',
        checkout_description: '',
        success_message: 'Pagamento realizado com sucesso!',
        show_company_logo: true,
        show_security_badges: true,
        show_payment_methods: true,
        enable_credit_card: true,
        enable_debit_card: true,
        enable_pix: true,
        enable_boleto: true,
        enable_order_bump: false,
        order_bump_title: '',
        order_bump_description: '',
        order_bump_price: 0,
        order_bump_image_url: ''
      });

      toast({
        title: "Configuração resetada!",
        description: "A personalização foi restaurada aos valores padrão.",
      });

    } catch (error: any) {
      toast({
        title: "Erro ao resetar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Personalização do Checkout</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores
            </CardTitle>
            <CardDescription>
              Personalize as cores do seu checkout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-color">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={customization.primary_color}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      primary_color: e.target.value
                    }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={customization.primary_color}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      primary_color: e.target.value
                    }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary-color">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={customization.secondary_color}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      secondary_color: e.target.value
                    }))}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={customization.secondary_color}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      secondary_color: e.target.value
                    }))}
                    placeholder="#10B981"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Textos */}
        <Card>
          <CardHeader>
            <CardTitle>Textos</CardTitle>
            <CardDescription>
              Configure os textos do checkout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={customization.company_name}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  company_name: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="checkout-title">Título do Checkout</Label>
              <Input
                id="checkout-title"
                value={customization.checkout_title}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  checkout_title: e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="checkout-description">Descrição</Label>
              <Textarea
                id="checkout-description"
                value={customization.checkout_description || ''}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  checkout_description: e.target.value
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Imagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Imagens
            </CardTitle>
            <CardDescription>
              Configure logo e imagem de fundo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Logo da Empresa</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'logo_url');
                  }}
                />
                {customization.logo_url && (
                  <img
                    src={customization.logo_url}
                    alt="Logo preview"
                    className="w-20 h-20 object-contain border rounded"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métodos de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Métodos de Pagamento
            </CardTitle>
            <CardDescription>
              Configure quais métodos aceitar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-credit">Cartão de Crédito</Label>
              <Switch
                id="enable-credit"
                checked={customization.enable_credit_card}
                onCheckedChange={(checked) => setCustomization(prev => ({
                  ...prev,
                  enable_credit_card: checked
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-debit">Cartão de Débito</Label>
              <Switch
                id="enable-debit"
                checked={customization.enable_debit_card}
                onCheckedChange={(checked) => setCustomization(prev => ({
                  ...prev,
                  enable_debit_card: checked
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-pix">PIX</Label>
              <Switch
                id="enable-pix"
                checked={customization.enable_pix}
                onCheckedChange={(checked) => setCustomization(prev => ({
                  ...prev,
                  enable_pix: checked
                }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-boleto">Boleto</Label>
              <Switch
                id="enable-boleto"
                checked={customization.enable_boleto}
                onCheckedChange={(checked) => setCustomization(prev => ({
                  ...prev,
                  enable_boleto: checked
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Bump */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Bump (Oferta Adicional)</CardTitle>
            <CardDescription>
              Configure uma oferta adicional no checkout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="enable-order-bump">Ativar Order Bump</Label>
              <Switch
                id="enable-order-bump"
                checked={customization.enable_order_bump}
                onCheckedChange={(checked) => setCustomization(prev => ({
                  ...prev,
                  enable_order_bump: checked
                }))}
              />
            </div>
            
            {customization.enable_order_bump && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="order-bump-title">Título da Oferta</Label>
                  <Input
                    id="order-bump-title"
                    value={customization.order_bump_title}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      order_bump_title: e.target.value
                    }))}
                    placeholder="Oferta Especial!"
                  />
                </div>
                <div>
                  <Label htmlFor="order-bump-price">Preço Adicional</Label>
                  <Input
                    id="order-bump-price"
                    type="number"
                    step="0.01"
                    value={customization.order_bump_price}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      order_bump_price: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="29.90"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label>Imagem da Oferta</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file, 'order_bump_image_url');
                    }}
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="order-bump-description">Descrição da Oferta</Label>
                  <Textarea
                    id="order-bump-description"
                    value={customization.order_bump_description || ''}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      order_bump_description: e.target.value
                    }))}
                    placeholder="Descrição detalhada da sua oferta adicional..."
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={loading} className="flex-1">
          {loading ? 'Salvando...' : 'Salvar Personalização'}
        </Button>
        <Button variant="outline" onClick={() => window.open('/checkout-preview', '_blank')}>
          <Eye className="h-4 w-4 mr-2" />
          Visualizar
        </Button>
        <Button variant="destructive" onClick={handleReset} disabled={loading}>
          <Trash2 className="h-4 w-4 mr-2" />
          Resetar
        </Button>
      </div>
    </div>
  );
};