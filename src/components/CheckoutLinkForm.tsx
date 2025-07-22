import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, DollarSign, FileText } from 'lucide-react';

interface CheckoutLinkFormProps {
  onLinkCreated: () => void;
}

export function CheckoutLinkForm({ onLinkCreated }: CheckoutLinkFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-link', {
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          currency: 'BRL'
        }
      });

      if (error) throw error;

      toast({
        title: "Link criado!",
        description: "Seu link de checkout foi criado com sucesso.",
      });

      // Limpar formulário
      setTitle('');
      setDescription('');
      setAmount('');
      
      onLinkCreated();
    } catch (error: any) {
      console.error('Error creating link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o link. Verifique suas configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          <CardTitle>Criar Novo Link</CardTitle>
        </div>
        <CardDescription>
          Crie um novo link de checkout para receber pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Título *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Produto Premium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descrição opcional do produto/serviço..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor (R$) *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !title.trim() || !amount}
          >
            {isLoading ? 'Criando...' : 'Criar Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}