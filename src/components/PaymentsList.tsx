import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, User, Calendar, CreditCard } from 'lucide-react';

interface Payment {
  id: string;
  mercadopago_payment_id: string;
  status: string;
  amount: number;
  currency: string;
  payer_name: string | null;
  payer_email: string | null;
  payment_method: string | null;
  created_at: string;
  checkout_links?: {
    title: string;
  };
}

export function PaymentsList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          checkout_links (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel('payments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: 'Aprovado', variant: 'default' as const },
      pending: { label: 'Pendente', variant: 'secondary' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
      cancelled: { label: 'Cancelado', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: 'outline' as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando pagamentos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Pagamentos Recebidos
        </CardTitle>
        <CardDescription>
          Acompanhe todos os pagamentos em tempo real
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum pagamento recebido ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {payment.checkout_links?.title || 'Pagamento'}
                      </h3>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      R$ {payment.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" />
                      {payment.payment_method || 'N/A'}
                    </div>
                  </div>
                </div>

                {payment.payer_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{payment.payer_name}</span>
                    {payment.payer_email && (
                      <span className="text-muted-foreground">({payment.payer_email})</span>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground font-mono">
                  ID: {payment.mercadopago_payment_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}