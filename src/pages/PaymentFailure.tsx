import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

const PaymentFailure = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-700 dark:text-red-300">
            Pagamento Não Aprovado
          </CardTitle>
          <CardDescription>
            Houve um problema com o processamento do seu pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Por favor, verifique os dados do seu cartão e tente novamente, ou entre em contato conosco.
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Tentar Novamente
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.close()}
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

export default PaymentFailure;