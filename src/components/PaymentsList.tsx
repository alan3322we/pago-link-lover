import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, User, Calendar, CreditCard, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  order_bump_amount?: number;
  order_bump_selected?: boolean;
  checkout_links?: {
    title: string;
    delivery_link?: string;
  };
}

function PaymentsList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          checkout_links (
            title,
            delivery_link
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

  const deleteAllPayments = async () => {
    try {
      const { error } = await supabase.rpc('delete_all_payments');
      
      if (error) throw error;
      
      setPayments([]);
      
      toast({
        title: "Pagamentos apagados",
        description: "Todos os pagamentos foram apagados do sistema.",
        variant: "destructive"
      });
    } catch (error: any) {
      console.error('Error deleting all payments:', error);
      toast({
        title: "Erro",
        description: "Erro ao apagar pagamentos.",
        variant: "destructive"
      });
    }
  };

  const downloadPaymentsData = () => {
    const approvedPayments = payments.filter(p => p.status === 'approved');
    
    const csvData = [
      ['ID', 'MercadoPago ID', 'Status', 'Valor', 'Moeda', 'Nome', 'Email', 'Método', 'Data', 'Produto'],
      ...approvedPayments.map(payment => [
        payment.id,
        payment.mercadopago_payment_id,
        payment.status,
        payment.amount,
        payment.currency,
        payment.payer_name || '',
        payment.payer_email || '',
        payment.payment_method || '',
        new Date(payment.created_at).toLocaleDateString('pt-BR'),
        payment.checkout_links?.title || ''
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pagamentos_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Download iniciado",
      description: "O arquivo com os dados dos pagamentos está sendo baixado.",
    });
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Pagamentos Recebidos
            </CardTitle>
            <CardDescription>
              Acompanhe todos os pagamentos em tempo real
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={downloadPaymentsData}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={deleteAllPayments}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Apagar Todos
            </Button>
          </div>
        </div>
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

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground font-mono">
                    ID: {payment.mercadopago_payment_id}
                  </div>
                  {payment.status === 'approved' && payment.checkout_links?.delivery_link && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(payment.checkout_links?.delivery_link, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Ver Entrega
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentsList;