import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

const PaymentPending = () => {
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