import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Key, Shield } from 'lucide-react';

interface ConfigFormProps {
  onConfigSaved: () => void;
}

export function ConfigForm({ onConfigSaved }: ConfigFormProps) {
  const [accessToken, setAccessToken] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [isSandbox, setIsSandbox] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('save-config', {
        body: {
          access_token: accessToken,
          public_key: publicKey,
          is_sandbox: isSandbox
        }
      });

      if (error) throw error;

      toast({
        title: "Configuração salva!",
        description: "Suas credenciais do Mercado Pago foram salvas com sucesso.",
      });

      onConfigSaved();
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Configuração do Mercado Pago</CardTitle>
        <CardDescription>
          Configure suas credenciais para começar a gerar links de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>URL do Webhook:</strong> {`${window.location.origin.replace('http://localhost:5173', 'https://yutddrrtogmpakzfzaqz.supabase.co')}/functions/v1/mercadopago-webhook`}
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              Configure esta URL nas notificações do seu painel do Mercado Pago
            </span>
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="accessToken" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Access Token *
            </Label>
            <Input
              id="accessToken"
              type="password"
              placeholder="Seu Access Token do Mercado Pago"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              required
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Encontre em: Integrações → Credenciais de produção/teste
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Public Key
            </Label>
            <Input
              id="publicKey"
              placeholder="Sua Public Key do Mercado Pago (opcional)"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sandbox"
              checked={isSandbox}
              onCheckedChange={setIsSandbox}
            />
            <Label htmlFor="sandbox">Modo Sandbox (Teste)</Label>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !accessToken.trim()}
          >
            {isLoading ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}