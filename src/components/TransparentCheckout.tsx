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
import { useParams, useNavigate } from 'react-router-dom';

interface CheckoutData {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  image_url: string;
}

interface CustomizationData {
  checkout_title: string;
  checkout_description?: string;
  company_name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  logo_url?: string;
  background_image_url?: string;
  show_company_logo: boolean;
  show_security_badges: boolean;
  show_payment_methods: boolean;
  enable_credit_card: boolean;
  enable_debit_card: boolean;
  enable_pix: boolean;
  enable_boleto: boolean;
  enable_order_bump: boolean;
  order_bump_title?: string;
  order_bump_description?: string;
  order_bump_price?: number;
  order_bump_image_url?: string;
  success_message: string;
  // Novas personalizações avançadas
  border_radius?: string;
  font_family?: string;
  button_style?: string;
  shadow_enabled?: boolean;
  gradient_enabled?: boolean;
  gradient_start_color?: string;
  gradient_end_color?: string;
  header_background_color?: string;
  card_background_color?: string;
  accent_color?: string;
  subtitle_color?: string;
  border_color?: string;
  hover_color?: string;
  animation_enabled?: boolean;
  custom_css?: string;
  layout_style?: string;
  button_size?: string;
  spacing_size?: string;
}

export const TransparentCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
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

  useEffect(() => {
    if (id) {
      loadCheckoutData();
      loadCustomization();
    }
  }, [id]);

  const loadCheckoutData = async () => {
    try {
      const { data, error } = await supabase
        .from('checkout_links')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({
          title: "Erro",
          description: "Link de checkout não encontrado",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setCheckoutData(data);
    } catch (error) {
      console.error('Error loading checkout data:', error);
    }
  };

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
        document.documentElement.style.setProperty('--accent', data.accent_color || '#080602');
        document.documentElement.style.setProperty('--muted-foreground', data.subtitle_color || '#1152d4');
        document.documentElement.style.setProperty('--border', data.border_color || '#E5E7EB');
      }
    } catch (error) {
      console.error('Error loading customization:', error);
    }
  };

  const handlePayment = async () => {
    if (!checkoutData) return;

    // Validar campos obrigatórios
    if (!formData.name || !formData.email || !formData.phone || !formData.document_number) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar dados do cartão se necessário
    if ((paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && 
        (!formData.card_number || !formData.card_holder_name || !formData.card_expiry || !formData.card_cvv)) {
      toast({
        title: "Dados do cartão incompletos",
        description: "Por favor, preencha todos os dados do cartão",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simular tokenização do cartão (normalmente feito com SDK do Mercado Pago)
      let cardToken = '';
      if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        // Aqui você integraria com o SDK do Mercado Pago para tokenizar o cartão
        cardToken = 'mock_token_' + Math.random().toString(36).substr(2, 9);
      }

      const paymentData = {
        checkout_link_id: checkoutData.id,
        payment_method: paymentMethod,
        card_data: (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') ? {
          token: cardToken,
          installments: formData.installments || 1
        } : undefined,
        customer_data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document_type: formData.document_type,
          document_number: formData.document_number
        },
        order_bump_selected: orderBumpSelected
      };

      const { data, error } = await supabase.functions.invoke('process-transparent-payment', {
        body: paymentData
      });

      if (error) {
        console.error('Payment error:', error);
        throw new Error(error.message || 'Erro ao processar pagamento');
      }

      if (!data) {
        throw new Error('Resposta inválida do servidor');
      }

      // Redirecionar baseado no método de pagamento e status
      if (paymentMethod === 'pix') {
        // Para PIX, sempre redirecionar para página de PIX com os dados
        const pixData = {
          qr_code: data.pix_qr_code,
          qr_code_base64: data.pix_qr_code_base64,
          pix_key: data.pix_key,
          amount: data.transaction_amount,
          expiration_date: data.expiration_date,
          payment_id: data.payment_id
        };
        const pixParams = new URLSearchParams();
        Object.entries(pixData).forEach(([key, value]) => {
          if (value) pixParams.append(key, value.toString());
        });
        navigate(`/payment-pending?${pixParams.toString()}`);
      } else if (paymentMethod === 'boleto' && data.boleto_url) {
        window.open(data.boleto_url, '_blank');
        navigate('/payment-pending');
      } else if (data.status === 'approved') {
        navigate('/payment-success');
      } else if (data.status === 'pending') {
        navigate('/payment-pending');
      } else {
        navigate('/payment-failure');
      }

    } catch (error: any) {
      console.error('Payment processing error:', error);
      let errorMessage = 'Erro desconhecido ao processar pagamento';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Erro no pagamento",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!checkoutData || !customization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalAmount = checkoutData.amount + (orderBumpSelected ? (customization.order_bump_price || 0) : 0);

  return (
    <div 
      className={`min-h-screen ${customization.animation_enabled ? 'transition-all duration-300' : ''}`}
      style={{ 
        background: customization.gradient_enabled 
          ? `linear-gradient(135deg, ${customization.gradient_start_color}, ${customization.gradient_end_color})`
          : customization.background_image_url 
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${customization.background_image_url})`
            : customization.background_color,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        color: customization.text_color,
        fontFamily: customization.font_family || 'Inter'
      }}
    >
      {/* Background Image Overlay */}
      {customization.background_image_url && (
        <div 
          className="fixed inset-0 bg-cover bg-center opacity-10 z-0"
          style={{ backgroundImage: `url(${customization.background_image_url})` }}
        />
      )}
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-12">
            <div 
              className={`inline-flex items-center justify-center p-2 mb-6 ${
                customization.animation_enabled ? 'transition-all duration-300 hover:scale-105' : ''
              } ${customization.shadow_enabled ? 'shadow-lg' : ''}`}
              style={{ 
                backgroundColor: `${customization.primary_color}20`,
                borderRadius: customization.border_radius || '50%'
              }}
            >
              {customization.logo_url ? (
                <img 
                  src={customization.logo_url} 
                  alt={customization.company_name}
                  className="h-20 w-auto"
                />
              ) : (
                <div 
                  className="h-16 w-16 flex items-center justify-center text-2xl font-bold"
                  style={{ 
                    backgroundColor: customization.primary_color, 
                    color: customization.background_color,
                    borderRadius: customization.border_radius === '32px' ? '50%' : customization.border_radius || '50%'
                  }}
                >
                  {customization.company_name.charAt(0)}
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: customization.text_color }}>
              {customization.checkout_title}
            </h1>
            {customization.checkout_description && (
              <p 
                className="text-xl max-w-2xl mx-auto"
                style={{ color: customization.subtitle_color || customization.text_color }}
              >
                {customization.checkout_description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Product Summary - Enhanced */}
            <div className="xl:col-span-1">
              <Card 
                className={`sticky top-8 border-0 ${
                  customization.shadow_enabled ? 'shadow-2xl' : 'shadow-md'
                } ${customization.animation_enabled ? 'transition-all duration-300 hover:shadow-3xl' : ''}`}
                style={{ 
                  backgroundColor: customization.card_background_color || `${customization.background_color}f5`,
                  borderRadius: customization.border_radius || '12px',
                  borderColor: customization.border_color
                }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: customization.primary_color }}></div>
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Display */}
                  <div className="relative">
                    {checkoutData.image_url && (
                      <div className="relative mb-4">
                        <img 
                          src={checkoutData.image_url} 
                          alt={checkoutData.title}
                          className="w-full h-48 object-cover rounded-lg shadow-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">{checkoutData.title}</h3>
                      {checkoutData.description && (
                        <p className="text-sm opacity-75 mb-4">{checkoutData.description}</p>
                      )}
                      <div className="inline-flex items-center px-4 py-2 rounded-full"
                           style={{ backgroundColor: `${customization.primary_color}20` }}>
                        <span className="text-2xl font-bold" style={{ color: customization.primary_color }}>
                          {checkoutData.currency} {checkoutData.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Order Bump */}
                  {customization.enable_order_bump && customization.order_bump_title && (
                    <div className="relative">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                          🔥 OFERTA ESPECIAL
                        </div>
                      </div>
                      <div 
                        className="border-2 rounded-xl p-6 mt-4 transition-all duration-300 hover:shadow-xl cursor-pointer"
                        style={{ 
                          borderColor: orderBumpSelected ? customization.primary_color : `${customization.primary_color}40`,
                          background: orderBumpSelected 
                            ? `linear-gradient(135deg, ${customization.primary_color}10, ${customization.secondary_color}10)`
                            : `${customization.background_color}80`
                        }}
                        onClick={() => setOrderBumpSelected(!orderBumpSelected)}
                      >
                        <div className="flex items-start gap-4">
                          <Checkbox
                            id="order-bump"
                            checked={orderBumpSelected}
                            onCheckedChange={(checked) => setOrderBumpSelected(checked === true)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-lg">{customization.order_bump_title}</h4>
                              <div className="text-right">
                                <div className="text-xs opacity-60 line-through">
                                  {checkoutData.currency} {((customization.order_bump_price || 0) * 1.5).toFixed(2)}
                                </div>
                                <div className="font-bold text-lg" style={{ color: customization.primary_color }}>
                                  +{checkoutData.currency} {(customization.order_bump_price || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                            {customization.order_bump_description && (
                              <p className="text-sm opacity-75 mb-3">{customization.order_bump_description}</p>
                            )}
                            <div className="flex items-center gap-2 text-xs opacity-60">
                              <CheckCircle className="h-4 w-4" />
                              <span>Aproveite esta oferta única!</span>
                            </div>
                          </div>
                          {customization.order_bump_image_url && (
                            <img 
                              src={customization.order_bump_image_url}
                              alt="Order bump"
                              className="w-16 h-16 object-cover rounded-lg shadow-md"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Total */}
                  <div className="border-t pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Produto:</span>
                        <span>{checkoutData.currency} {checkoutData.amount.toFixed(2)}</span>
                      </div>
                      {orderBumpSelected && (
                        <div className="flex justify-between text-green-600">
                          <span>Oferta Especial:</span>
                          <span>+{checkoutData.currency} {(customization.order_bump_price || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-2xl font-bold">
                          <span>Total:</span>
                          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {checkoutData.currency} {totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form - Enhanced */}
            <div className="xl:col-span-2">
              <Card 
                className={`border-0 ${
                  customization.shadow_enabled ? 'shadow-2xl' : 'shadow-md'
                } ${customization.animation_enabled ? 'transition-all duration-300' : ''}`}
                style={{ 
                  backgroundColor: customization.card_background_color || `${customization.background_color}f5`,
                  borderRadius: customization.border_radius || '12px',
                  borderColor: customization.border_color
                }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <div className="w-3 h-8 rounded-full" style={{ backgroundColor: customization.secondary_color }}></div>
                    Dados do Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-6 rounded-full" style={{ backgroundColor: customization.primary_color }}></div>
                      Dados Pessoais
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="h-12"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">E-mail</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="h-12"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="h-12"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="document-type">Documento</Label>
                          <Select
                            value={formData.document_type}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
                          >
                            <SelectTrigger className="h-12">
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
                            className="h-12"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Método de Pagamento */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <div className="w-2 h-6 rounded-full" style={{ backgroundColor: customization.primary_color }}></div>
                      Método de Pagamento
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {customization.enable_credit_card && (
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                            paymentMethod === 'credit_card' ? 'ring-2' : 'hover:shadow-md'
                          }`}
                          style={{ 
                            borderColor: paymentMethod === 'credit_card' ? customization.primary_color : '#e5e7eb',
                            backgroundColor: paymentMethod === 'credit_card' ? `${customization.primary_color}10` : 'transparent'
                          }}
                          onClick={() => setPaymentMethod('credit_card')}
                        >
                          <div className="text-center">
                            <CreditCard className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm font-medium">Cartão de Crédito</span>
                          </div>
                        </div>
                      )}
                      {customization.enable_debit_card && (
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                            paymentMethod === 'debit_card' ? 'ring-2' : 'hover:shadow-md'
                          }`}
                          style={{ 
                            borderColor: paymentMethod === 'debit_card' ? customization.primary_color : '#e5e7eb',
                            backgroundColor: paymentMethod === 'debit_card' ? `${customization.primary_color}10` : 'transparent'
                          }}
                          onClick={() => setPaymentMethod('debit_card')}
                        >
                          <div className="text-center">
                            <CreditCard className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm font-medium">Cartão de Débito</span>
                          </div>
                        </div>
                      )}
                      {customization.enable_pix && (
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                            paymentMethod === 'pix' ? 'ring-2' : 'hover:shadow-md'
                          }`}
                          style={{ 
                            borderColor: paymentMethod === 'pix' ? customization.primary_color : '#e5e7eb',
                            backgroundColor: paymentMethod === 'pix' ? `${customization.primary_color}10` : 'transparent'
                          }}
                          onClick={() => setPaymentMethod('pix')}
                        >
                          <div className="text-center">
                            <QrCode className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm font-medium">PIX</span>
                          </div>
                        </div>
                      )}
                      {customization.enable_boleto && (
                        <div 
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                            paymentMethod === 'boleto' ? 'ring-2' : 'hover:shadow-md'
                          }`}
                          style={{ 
                            borderColor: paymentMethod === 'boleto' ? customization.primary_color : '#e5e7eb',
                            backgroundColor: paymentMethod === 'boleto' ? `${customization.primary_color}10` : 'transparent'
                          }}
                          onClick={() => setPaymentMethod('boleto')}
                        >
                          <div className="text-center">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <span className="text-sm font-medium">Boleto</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dados do Cartão */}
                  {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <div className="w-2 h-6 rounded-full" style={{ backgroundColor: customization.primary_color }}></div>
                        Dados do Cartão
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="card-number">Número do Cartão</Label>
                          <Input
                            id="card-number"
                            value={formData.card_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                            placeholder="1234 5678 9012 3456"
                            className="h-12"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-holder">Nome no Cartão</Label>
                          <Input
                            id="card-holder"
                            value={formData.card_holder_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, card_holder_name: e.target.value }))}
                            className="h-12"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="card-expiry">Validade</Label>
                            <Input
                              id="card-expiry"
                              value={formData.card_expiry}
                              onChange={(e) => setFormData(prev => ({ ...prev, card_expiry: e.target.value }))}
                              placeholder="MM/AA"
                              className="h-12"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="card-cvv">CVV</Label>
                            <Input
                              id="card-cvv"
                              value={formData.card_cvv}
                              onChange={(e) => setFormData(prev => ({ ...prev, card_cvv: e.target.value }))}
                              placeholder="123"
                              className="h-12"
                              required
                            />
                          </div>
                          {paymentMethod === 'credit_card' && (
                            <div>
                              <Label htmlFor="installments">Parcelas</Label>
                              <Select
                                value={formData.installments.toString()}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, installments: parseInt(value) }))}
                              >
                                <SelectTrigger className="h-12">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                                    <SelectItem key={i} value={i.toString()}>
                                      {i}x de {(totalAmount / i).toFixed(2)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Payment Button */}
                  <div className="pt-6">
                    <Button 
                      onClick={handlePayment} 
                      disabled={loading}
                      className="w-full h-16 text-xl font-bold shadow-2xl transition-all duration-300 hover:scale-105"
                      style={{ 
                        background: `linear-gradient(135deg, ${customization.primary_color}, ${customization.secondary_color})`,
                        border: 'none'
                      }}
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          Processando Pagamento...
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Lock className="h-6 w-6" />
                          <span>Finalizar Pagamento - {checkoutData.currency} {totalAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Enhanced Security Badges */}
                  <div className="flex items-center justify-center gap-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm opacity-75">
                      <div className="p-2 rounded-full" style={{ backgroundColor: `${customization.primary_color}20` }}>
                        <Shield className="h-4 w-4" style={{ color: customization.primary_color }} />
                      </div>
                      <span>Pagamento 100% Seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-75">
                      <div className="p-2 rounded-full" style={{ backgroundColor: `${customization.primary_color}20` }}>
                        <Lock className="h-4 w-4" style={{ color: customization.primary_color }} />
                      </div>
                      <span>SSL Protegido</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparentCheckout;