import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [deliveryLink, setDeliveryLink] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string>('seu produto');
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('payment_id');
  const checkoutId = searchParams.get('checkout_id');

  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      try {
        if (checkoutId) {
          const { data: checkoutData } = await supabase
            .from('checkout_links')
            .select('delivery_link, title')
            .eq('id', checkoutId)
            .single();

          if (checkoutData) {
            setDeliveryLink(checkoutData.delivery_link);
            setProductTitle(checkoutData.title);
          }
        } else if (paymentId) {
          // Buscar pelo ID do pagamento
          const { data: paymentData } = await supabase
            .from('payments')
            .select('checkout_links(delivery_link, title)')
            .eq('mercadopago_payment_id', paymentId)
            .single();

          if (paymentData?.checkout_links) {
            setDeliveryLink(paymentData.checkout_links.delivery_link);
            setProductTitle(paymentData.checkout_links.title);
          }
        } else {
          // Se não há parâmetros, buscar o pagamento mais recente aprovado
          const { data: recentPayment } = await supabase
            .from('payments')
            .select('checkout_links(delivery_link, title)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (recentPayment?.checkout_links) {
            setDeliveryLink(recentPayment.checkout_links.delivery_link);
            setProductTitle(recentPayment.checkout_links.title);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar informações de entrega:', error);
      }
      setLoading(false);
    };

    fetchDeliveryInfo();
  }, [paymentId, checkoutId]);

  const handleAccessProduct = () => {
    if (deliveryLink) {
      window.open(deliveryLink, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-700 dark:text-green-300">
            Pagamento Aprovado!
          </CardTitle>
          <CardDescription>
            Seu pagamento foi processado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              🎉 Parabéns! Sua compra de "{productTitle}" foi confirmada!
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : deliveryLink ? (
            <div className="space-y-3">
              <Button 
                onClick={handleAccessProduct}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Acessar Produto
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3 inline mr-1" />
                Link será aberto em nova aba
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Link de entrega não configurado. Entre em contato com o suporte.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              onClick={() => window.close()}
              variant="outline"
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;