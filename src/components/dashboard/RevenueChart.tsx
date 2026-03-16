import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueChartProps {
  data: { month: string; revenue: number; orders: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(0,0%,100%)', border: '1px solid hsl(220,13%,91%)', borderRadius: '8px', fontSize: '13px' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(221, 83%, 53%)" fill="url(#revGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
