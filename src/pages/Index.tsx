import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfigForm } from '@/components/ConfigForm';
import { CheckoutLinkForm } from '@/components/CheckoutLinkForm';
import { CheckoutLinksList } from '@/components/CheckoutLinksList';
import { PaymentsList } from '@/components/PaymentsList';
import { NotificationsList } from '@/components/NotificationsList';
import { CheckoutCustomization } from '@/components/CheckoutCustomization';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { CreditCard, Link, Settings, Bell, DollarSign, TrendingUp, LogOut, User } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const [hasConfig, setHasConfig] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [refreshLinks, setRefreshLinks] = useState(false);
  const [stats, setStats] = useState({
    totalLinks: 0,
    activeLinks: 0,
    totalPayments: 0,
    totalRevenue: 0
  });

  const checkConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('mercadopago_config')
        .select('*')
        .single();

      setHasConfig(!!data && !error);
    } catch (error) {
      setHasConfig(false);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Buscar estatísticas dos links
      const { data: linksData } = await supabase
        .from('checkout_links')
        .select('is_active');

      // Buscar estatísticas dos pagamentos
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, status');

      const totalLinks = linksData?.length || 0;
      const activeLinks = linksData?.filter(link => link.is_active).length || 0;
      const approvedPayments = paymentsData?.filter(payment => payment.status === 'approved') || [];
      const totalPayments = approvedPayments.length;
      const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.amount, 0);

      setStats({
        totalLinks,
        activeLinks,
        totalPayments,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    checkConfig();
    fetchStats();
  }, []);

  useEffect(() => {
    if (hasConfig) {
      fetchStats();
    }
  }, [hasConfig, refreshLinks]);

  const handleConfigSaved = () => {
    setHasConfig(true);
    fetchStats();
  };

  const handleLinkCreated = () => {
    setRefreshLinks(true);
    fetchStats();
  };

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!hasConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Mercado Pago Link Generator
            </h1>
            <p className="text-xl text-muted-foreground">
              Plataforma completa para gerar e gerenciar links de pagamento
            </p>
          </div>
          <ConfigForm onConfigSaved={handleConfigSaved} />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Mercado Pago Dashboard
            </h1>
            <p className="text-xl text-muted-foreground">
              Gerencie seus links de pagamento e acompanhe vendas em tempo real
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user?.email}
            </div>
            <Button variant="outline" onClick={signOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Links Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalLinks}</div>
              <Badge variant="secondary" className="mt-1">
                {stats.activeLinks} ativos
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalPayments}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Aprovados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                R$ {stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Valor bruto</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats.totalLinks > 0 ? ((stats.totalPayments / stats.totalLinks) * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Pagamentos/Links</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="links" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[700px] mx-auto">
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Links
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Checkout
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CheckoutLinkForm onLinkCreated={handleLinkCreated} />
              </div>
              <div className="lg:col-span-2">
                <CheckoutLinksList 
                  refresh={refreshLinks} 
                  onRefreshComplete={() => setRefreshLinks(false)} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checkout">
            <CheckoutCustomization />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsList />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsList />
          </TabsContent>

          <TabsContent value="settings">
            <ConfigForm onConfigSaved={handleConfigSaved} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
