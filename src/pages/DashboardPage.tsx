import { useEffect } from 'react';
import { DollarSign, Users, TrendingUp, ShoppingCart } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted text-muted-foreground border-border',
};

export default function DashboardPage() {
  const { data, isLoading, fetchData } = useDashboardStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && data.totalRevenue === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-10 w-48" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="mt-8 h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Real-time analytics for MedSource International</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Revenue" value={formatCurrency(data.totalRevenue)} change="+31.2% from last month" changeType="positive" icon={DollarSign} />
        <MetricCard title="Active Leads" value={String(data.activeLeads)} change="+3 this week" changeType="positive" icon={Users} />
        <MetricCard title="Conversion Rate" value={`${data.conversionRate}%`} change="+5.4% improvement" changeType="positive" icon={TrendingUp} />
        <MetricCard title="Pending Orders" value={String(data.pendingOrders)} change="2 need review" changeType="neutral" icon={ShoppingCart} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueChart data={data.revenueByMonth} />
        </div>
        <div className="lg:col-span-2">
          <div className="glass-card rounded-xl border border-border/50 p-6">
            <h3 className="mb-4 text-lg font-semibold">Leads by Company</h3>
            <div className="space-y-3">
              {data.leadsByCountry.map((item) => (
                <div key={item.country} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.country}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full gradient-bg" style={{ width: `${(item.count / 4) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-sm font-semibold text-muted-foreground">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No orders yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{order.customer_name}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(order.total_amount))}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[order.status] ?? '')}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
