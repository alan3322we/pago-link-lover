import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface CheckoutLink {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  checkout_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface CheckoutLinksListProps {
  refresh: boolean;
  onRefreshComplete: () => void;
}

export function CheckoutLinksList({ refresh, onRefreshComplete }: CheckoutLinksListProps) {
  const [links, setLinks] = useState<CheckoutLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('checkout_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      console.error('Error fetching links:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os links.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  useEffect(() => {
    if (refresh) {
      fetchLinks();
      onRefreshComplete();
    }
  }, [refresh, onRefreshComplete]);

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copiado!",
        description: "Link copiado para a área de transferência.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const toggleLinkStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('checkout_links')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setLinks(links.map(link => 
        link.id === id ? { ...link, is_active: !currentStatus } : link
      ));

      toast({
        title: currentStatus ? "Link desativado" : "Link ativado",
        description: `O link foi ${currentStatus ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (error: any) {
      console.error('Error toggling link status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do link.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando links...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus Links de Checkout</CardTitle>
        <CardDescription>
          Gerencie e monitore todos os seus links de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum link criado ainda. Crie seu primeiro link!
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div key={link.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{link.title}</h3>
                    {link.description && (
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={link.is_active ? "default" : "secondary"}>
                      {link.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleLinkStatus(link.id, link.is_active)}
                    >
                      {link.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    R$ {link.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(link.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {link.checkout_url && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(link.checkout_url!)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => window.open(link.checkout_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}