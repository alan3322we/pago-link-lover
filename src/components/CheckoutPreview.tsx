import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Smartphone, FileText, QrCode, Shield, Lock, CheckCircle } from 'lucide-react';

interface CustomizationData {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  logo_url?: string;
  company_name: string;
  checkout_title: string;
  checkout_description?: string;
  enable_credit_card: boolean;
  enable_debit_card: boolean;
  enable_pix: boolean;
  enable_boleto: boolean;
  enable_order_bump: boolean;
  order_bump_title?: string;
  order_bump_description?: string;
  order_bump_price?: number;
  order_bump_image_url?: string;
}

export const CheckoutPreview = () => {
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [orderBumpSelected, setOrderBumpSelected] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document_type: 'CPF',
    document_number: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
    card_holder_name: '',
    installments: 1
  });

  // Mock data para preview
  const mockCheckoutData = {
    id: 'preview',
    title: 'Produto Exemplo',
    description: 'Este é um produto de exemplo para demonstração',
    amount: 99.90,
    currency: 'BRL'
  };

  useEffect(() => {
    loadCustomization();
  }, []);

  const loadCustomization = async () => {
    try {
      const { data } = await supabase
        .from('checkout_customization')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        setCustomization(data);
        // Aplicar cores personalizadas
        document.documentElement.style.setProperty('--primary', data.primary_color);
        document.documentElement.style.setProperty('--secondary', data.secondary_color);
      }
    } catch (error) {
      console.error('Error loading customization:', error);
    }
  };

  const handlePayment = async () => {
    toast({
      title: "Preview Mode",
      description: "Este é apenas um preview. Nenhum pagamento será processado.",
      variant: "default"
    });
  };

  if (!customization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalAmount = mockCheckoutData.amount + (orderBumpSelected ? (customization.order_bump_price || 0) : 0);

  return (
    <div 
      className="min-h-screen py-8 px-4"
      style={{ 
        backgroundColor: customization.background_color,
        color: customization.text_color 
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Preview Banner */}
        <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded-lg text-center">
          <h2 className="text-lg font-semibold text-blue-800">🔍 Modo Preview</h2>
          <p className="text-blue-700">Esta é uma prévia do seu checkout personalizado. Nenhum pagamento será processado.</p>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          {customization.logo_url && (
            <img 
              src={customization.logo_url} 
              alt={customization.company_name}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold mb-2">{customization.checkout_title}</h1>
          {customization.checkout_description && (
            <p className="text-lg opacity-80">{customization.checkout_description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumo do Produto */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-xs">Imagem</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{mockCheckoutData.title}</h3>
                  <p className="text-sm opacity-75">{mockCheckoutData.description}</p>
                  <p className="text-xl font-bold mt-2">
                    R$ {mockCheckoutData.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order Bump */}
              {customization.enable_order_bump && customization.order_bump_title && (
                <div className="border rounded-lg p-4 bg-gradient-to-r from-primary/10 to-secondary/10">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="order-bump"
                      checked={orderBumpSelected}
                      onCheckedChange={(checked) => setOrderBumpSelected(checked === true)}
                    />
                    <div className="flex-1">
                      <label htmlFor="order-bump" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{customization.order_bump_title}</span>
                          <span className="text-primary font-bold">
                            +R$ {(customization.order_bump_price || 0).toFixed(2)}
                          </span>
                        </div>
                        {customization.order_bump_description && (
                          <p className="text-sm opacity-75">{customization.order_bump_description}</p>
                        )}
                      </label>
                    </div>
                    {customization.order_bump_image_url && (
                      <img 
                        src={customization.order_bump_image_url}
                        alt="Order bump"
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span style={{ color: customization.primary_color }}>
                    R$ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h4 className="font-semibold">Dados Pessoais</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="seu@email.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="document-type">Documento</Label>
                      <Select
                        value={formData.document_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="document-number">Número</Label>
                      <Input
                        id="document-number"
                        value={formData.document_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-4">
                <h4 className="font-semibold">Método de Pagamento</h4>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {customization.enable_credit_card && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="credit_card" id="credit_card" />
                      <Label htmlFor="credit_card" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Crédito
                      </Label>
                    </div>
                  )}
                  {customization.enable_debit_card && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="debit_card" id="debit_card" />
                      <Label htmlFor="debit_card" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Cartão de Débito
                      </Label>
                    </div>
                  )}
                  {customization.enable_pix && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        PIX
                      </Label>
                    </div>
                  )}
                  {customization.enable_boleto && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="boleto" id="boleto" />
                      <Label htmlFor="boleto" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Boleto
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              {/* Dados do Cartão */}
              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Dados do Cartão</h4>
                  <div>
                    <Label htmlFor="card-number">Número do Cartão</Label>
                    <Input
                      id="card-number"
                      value={formData.card_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="card-holder">Nome no Cartão</Label>
                    <Input
                      id="card-holder"
                      value={formData.card_holder_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, card_holder_name: e.target.value }))}
                      placeholder="Nome como aparece no cartão"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="card-expiry">Validade</Label>
                      <Input
                        id="card-expiry"
                        value={formData.card_expiry}
                        onChange={(e) => setFormData(prev => ({ ...prev, card_expiry: e.target.value }))}
                        placeholder="MM/AA"
                      />
                    </div>
                    <div>
                      <Label htmlFor="card-cvv">CVV</Label>
                      <Input
                        id="card-cvv"
                        value={formData.card_cvv}
                        onChange={(e) => setFormData(prev => ({ ...prev, card_cvv: e.target.value }))}
                        placeholder="123"
                      />
                    </div>
                    {paymentMethod === 'credit_card' && (
                      <div>
                        <Label htmlFor="installments">Parcelas</Label>
                        <Select
                          value={formData.installments.toString()}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, installments: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                              <SelectItem key={i} value={i.toString()}>
                                {i}x de R$ {(totalAmount / i).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botão de Pagamento */}
              <Button
                className="w-full py-6 text-lg font-semibold"
                style={{ backgroundColor: customization.primary_color }}
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? "Processando..." : `Finalizar Compra - R$ ${totalAmount.toFixed(2)}`}
              </Button>

              {/* Elementos de Segurança */}
              <div className="flex justify-center items-center gap-4 text-sm opacity-75">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Compra Segura
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="h-4 w-4" />
                  SSL Protegido
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPreview;