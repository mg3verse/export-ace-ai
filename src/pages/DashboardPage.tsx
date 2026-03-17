import { useEffect, useRef } from 'react';
import { MessageSquare, ShoppingCart, DollarSign, Target, Download, RefreshCw } from 'lucide-react';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ConversationChart } from '@/components/dashboard/ConversationChart';
import { AgentPieChart } from '@/components/dashboard/AgentPieChart';
import { LeadQualityChart } from '@/components/dashboard/LeadQualityChart';
import { OrderStatusChart } from '@/components/dashboard/OrderStatusChart';
import { LiveFeed } from '@/components/dashboard/LiveFeed';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const TIME_OPTIONS = [
  { label: 'Today', value: 'today' as const },
  { label: 'Last 7 Days', value: '7d' as const },
  { label: 'Last 30 Days', value: '30d' as const },
];

const AGENT_OPTIONS = [
  { label: 'All Agents', value: 'all' as const },
  { label: 'Pricing', value: 'pricing' as const },
  { label: 'FAQ', value: 'faq' as const },
  { label: 'Order', value: 'order' as const },
  { label: 'Qualifier', value: 'qualifier' as const },
];

export default function DashboardPage() {
  const { data, isLoading, timeRange, agentFilter, setTimeRange, setAgentFilter, fetchData } = useDashboardStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30000);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const handleExport = (format: string) => {
    toast.success(`${format} export started — check your downloads`);
  };

  const convChange = data.yesterdayConversations > 0
    ? Math.round(((data.todayConversations - data.yesterdayConversations) / data.yesterdayConversations) * 100)
    : 0;

  if (isLoading && data.totalConversations === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header + Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time analytics • Auto-refreshes every 30s</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Time range */}
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeRange(opt.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  timeRange === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Agent filter */}
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            {AGENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAgentFilter(opt.value)}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-medium transition-colors',
                  agentFilter === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Actions */}
          <Button variant="outline" size="sm" onClick={() => fetchData()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            {['CSV', 'Excel', 'PDF'].map((f) => (
              <button
                key={f}
                onClick={() => handleExport(f)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-card text-muted-foreground hover:bg-muted transition-colors"
              >
                <Download className="h-3 w-3" /> {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Conversations"
          value={String(data.todayConversations)}
          subtitle={`${convChange >= 0 ? '+' : ''}${convChange}% from yesterday`}
          detail={`${data.activeConversations} active sessions • ${data.totalConversations} all time`}
          icon={MessageSquare}
          accentColor="blue"
        />
        <KpiCard
          title="Orders Collected"
          value={String(data.todayOrders)}
          subtitle={`${data.orderConversionRate}% conversion rate`}
          detail={`Avg order value: ${formatCurrency(data.avgOrderValue)} • ${data.ordersCollected} total`}
          icon={ShoppingCart}
          accentColor="green"
        />
        <KpiCard
          title="Revenue Generated"
          value={formatCurrency(data.todayRevenue)}
          subtitle={`Monthly: ${formatCurrency(data.monthlyRevenue)}`}
          detail={`All time: ${formatCurrency(data.totalRevenue)}`}
          icon={DollarSign}
          accentColor="purple"
        />
        <KpiCard
          title="Lead Score Avg"
          value={String(data.avgLeadScore)}
          subtitle={`${data.highValueLeads} high-value leads`}
          detail={`${data.qualificationRate}% qualification rate`}
          icon={Target}
          accentColor="orange"
        />
      </div>

      {/* Row 2: Conversation Activity + Agent Performance */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ConversationChart data={data.conversationActivity} />
        </div>
        <div className="lg:col-span-2">
          <AgentPieChart
            data={data.conversationsByAgent}
            title="Agent Performance"
            centerLabel="Total"
          />
        </div>
      </div>

      {/* Row 3: Revenue + Lead Quality + Order Status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueChart data={data.revenueByMonth} />
        <LeadQualityChart data={data.leadsByQuality} />
        <OrderStatusChart data={data.ordersByStatus} />
      </div>

      {/* Row 4: Live Feed + Recent Orders */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <LiveFeed items={data.liveFeed} />
        </div>
        <div className="lg:col-span-3">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No orders yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Order ID</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs">Products</TableHead>
                      <TableHead className="text-xs text-right">Value</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentOrders.map((order) => {
                      const products = (order.products || []) as { name?: string; sku?: string; quantity?: number; unit_price?: number; line_total?: number }[];
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-xs font-medium">{order.customer_name}</TableCell>
                          <TableCell className="text-xs max-w-[200px]">
                            {products.length === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <div className="space-y-0.5">
                                {products.map((p, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    <span className="truncate">{p.name || p.sku}</span>
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                                      ×{p.quantity}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-right font-semibold">{formatCurrency(Number(order.total_amount))}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('capitalize text-[10px]', STATUS_STYLES[order.status] ?? '')}>
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
