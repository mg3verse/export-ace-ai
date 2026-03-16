import { DollarSign, Users, TrendingUp, ShoppingCart } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { useDashboardStore } from '@/stores/dashboardStore';
import { formatCurrency } from '@/utils/formatters';

export default function DashboardPage() {
  const { data } = useDashboardStore();

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
            <h3 className="mb-4 text-lg font-semibold">Leads by Market</h3>
            <div className="space-y-3">
              {data.leadsByCountry.map((item) => (
                <div key={item.country} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.country}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full gradient-bg"
                        style={{ width: `${(item.count / 4) * 100}%` }}
                      />
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
        <OrderTable orders={data.recentOrders} />
      </div>
    </div>
  );
}
