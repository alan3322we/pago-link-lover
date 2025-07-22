import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components for better performance
const ConfigForm = lazy(() => import('@/components/ConfigForm'));
const CheckoutLinkForm = lazy(() => import('@/components/CheckoutLinkForm'));
const CheckoutLinksList = lazy(() => import('@/components/CheckoutLinksList'));
const PaymentsList = lazy(() => import('@/components/PaymentsList'));
const NotificationsList = lazy(() => import('@/components/NotificationsList'));
const CheckoutCustomization = lazy(() => import('@/components/CheckoutCustomization'));
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

  const checkConfig = useCallback(async () => {
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
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Buscar dados em paralelo para otimizar performance
      const [linksResponse, paymentsResponse] = await Promise.all([
        supabase.from('checkout_links').select('is_active'),
        supabase.from('payments').select('amount, status')
      ]);

      const linksData = linksResponse.data;
      const paymentsData = paymentsResponse.data;

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
  }, []);

  useEffect(() => {
    checkConfig();
    fetchStats();
  }, []);

  useEffect(() => {
    if (hasConfig) {
      fetchStats();
    }
  }, [hasConfig, refreshLinks]);

  const handleConfigSaved = useCallback(() => {
    setHasConfig(true);
    fetchStats();
  }, [fetchStats]);

  const handleLinkCreated = useCallback(() => {
    setRefreshLinks(true);
    fetchStats();
  }, [fetchStats]);

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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted py-6 sm:py-8 lg:py-12 px-2 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Mercado Pago Link Generator
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground px-4">
              Plataforma completa para gerar e gerenciar links de pagamento
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
            <ConfigForm onConfigSaved={handleConfigSaved} />
          </Suspense>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-2 sm:px-4">
        {/* Header - Responsivo */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 lg:mb-8 gap-4">
          <div className="text-center lg:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Mercado Pago Dashboard
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground">
              Gerencie seus links de pagamento e acompanhe vendas em tempo real
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate max-w-[150px] sm:max-w-none">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2 w-full sm:w-auto">
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Otimizadas para mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 transition-all hover:shadow-md">
            <CardHeader className="pb-2 p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 sm:gap-2">
                <Link className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Links Totais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalLinks}</div>
              <Badge variant="secondary" className="mt-1 text-xs">
                {stats.activeLinks} ativos
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 transition-all hover:shadow-md">
            <CardHeader className="pb-2 p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1 sm:gap-2">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Pagamentos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{stats.totalPayments}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">Aprovados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 transition-all hover:shadow-md">
            <CardHeader className="pb-2 p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1 sm:gap-2">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Receita Total</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
              <div className="text-lg sm:text-2xl font-bold text-purple-700 dark:text-purple-300">
                R$ {stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Valor bruto</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 transition-all hover:shadow-md">
            <CardHeader className="pb-2 p-4 lg:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1 sm:gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">Taxa Conversão</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 pt-0 lg:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats.totalLinks > 0 ? ((stats.totalPayments / stats.totalLinks) * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Pagamentos/Links</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Tabs responsivas */}
        <Tabs defaultValue="links" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-full lg:max-w-[700px] mx-auto h-auto p-1">
            <TabsTrigger value="links" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Link className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Links</span>
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Checkout</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="lg:col-span-1 order-2 lg:order-1">
                <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                  <CheckoutLinkForm onLinkCreated={handleLinkCreated} />
                </Suspense>
              </div>
              <div className="lg:col-span-2 order-1 lg:order-2">
                <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                  <CheckoutLinksList 
                    refresh={refreshLinks} 
                    onRefreshComplete={() => setRefreshLinks(false)} 
                  />
                </Suspense>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="checkout">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <CheckoutCustomization />
            </Suspense>
          </TabsContent>

          <TabsContent value="payments">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <PaymentsList />
            </Suspense>
          </TabsContent>

          <TabsContent value="notifications">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <NotificationsList />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
              <ConfigForm onConfigSaved={handleConfigSaved} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
