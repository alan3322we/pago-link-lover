import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, QrCode, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const PaymentPending = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pixData, setPixData] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Extrair dados do PIX dos parâmetros da URL
    const qrCode = searchParams.get('qr_code');
    const qrCodeBase64 = searchParams.get('qr_code_base64');
    const pixKey = searchParams.get('pix_key');
    const amount = searchParams.get('amount');
    const expirationDate = searchParams.get('expiration_date');
    const paymentId = searchParams.get('payment_id');

    if (qrCode || pixKey) {
      setPixData({
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        pix_key: pixKey,
        amount: parseFloat(amount || '0'),
        expiration_date: expirationDate,
        payment_id: paymentId
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (pixData?.expiration_date) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(pixData.expiration_date).getTime();
        const difference = expiry - now;

        if (difference > 0) {
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeRemaining('Expirado');
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [pixData]);

  // Realtime para redirecionamento automático quando pagamento aprovado
  useEffect(() => {
    if (!pixData?.payment_id) return;

    console.log('🔔 [PaymentPending] Configurando realtime para payment:', pixData.payment_id);
    
    const channel = supabase
      .channel(`payment-pending-${pixData.payment_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'payments',
          filter: `mercadopago_payment_id=eq.${pixData.payment_id}`
        },
        (payload: any) => {
          console.log('💳 [PaymentPending] Status atualizado:', payload.new?.status);
          
          if (payload.new && payload.new.status === 'approved') {
            console.log('✅ [PaymentPending] Pagamento aprovado! Redirecionando...');
            
            toast({
              title: "Pagamento Aprovado!",
              description: "Redirecionando para entrega do produto...",
              variant: "default"
            });
            
            // Redirecionamento imediato
            const checkoutId = searchParams.get('checkout_id');
            if (checkoutId) {
              navigate(`/payment-success?checkout_id=${checkoutId}&payment_id=${pixData.payment_id}`, { replace: true });
            } else {
              navigate(`/payment-success?payment_id=${pixData.payment_id}`, { replace: true });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [PaymentPending] Status da subscription:', status);
      });

    // Cleanup
    return () => {
      console.log('🧹 [PaymentPending] Removendo canal realtime');
      supabase.removeChannel(channel);
    };
  }, [pixData?.payment_id, navigate, toast, searchParams]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${type} copiado para a área de transferência`,
      variant: "default"
    });
  };

  // Se há dados do PIX, mostrar interface específica do PIX
  if (pixData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-blue-700 dark:text-blue-300">
              Pagamento PIX
            </CardTitle>
            <CardDescription>
              Escaneie o QR Code ou copie a chave PIX para pagar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Valor e Tempo */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                R$ {pixData.amount.toFixed(2)}
              </div>
              {timeRemaining && timeRemaining !== 'Expirado' && (
                <Badge variant="outline" className="text-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  Expira em: {timeRemaining}
                </Badge>
              )}
              {timeRemaining === 'Expirado' && (
                <Badge variant="destructive" className="text-sm">
                  PIX Expirado
                </Badge>
              )}
            </div>

            {/* QR Code */}
            {pixData.qr_code_base64 && (
              <div className="text-center">
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  <img 
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Abra o app do seu banco e escaneie o código
                </p>
              </div>
            )}

            {/* Chave PIX */}
            {pixData.pix_key && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Chave PIX Copia e Cola:</label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono break-all">
                    {pixData.pix_key}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(pixData.pix_key, 'Chave PIX')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Instruções */}
            <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Como pagar:
              </h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escaneie o QR Code ou use a chave PIX</li>
                <li>3. Confirme os dados e finalize o pagamento</li>
                <li>4. O pagamento será confirmado automaticamente</li>
              </ol>
            </div>

            {/* ID da Transação */}
            {pixData.payment_id && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  ID da transação: {pixData.payment_id}
                </p>
              </div>
            )}

            <Button 
              onClick={() => window.close()}
              className="w-full"
              variant="outline"
            >
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Interface padrão para outros métodos de pagamento
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl text-yellow-700 dark:text-yellow-300">
            Pagamento Pendente
          </CardTitle>
          <CardDescription>
            Seu pagamento está sendo processado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Aguarde a confirmação do pagamento. Isso pode levar alguns minutos dependendo do método escolhido.
          </p>
          <Button 
            onClick={() => window.close()}
            className="w-full"
          >
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPending;