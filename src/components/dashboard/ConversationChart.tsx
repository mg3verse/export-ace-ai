import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  data: { time: string; total: number; pricing: number; faq: number; order: number; qualifier: number }[];
}

export function ConversationChart({ data }: Props) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Conversation Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="total" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={false} name="Total" />
              <Line type="monotone" dataKey="pricing" stroke="hsl(262, 83%, 58%)" strokeWidth={1.5} dot={false} name="Pricing" />
              <Line type="monotone" dataKey="faq" stroke="hsl(142, 71%, 45%)" strokeWidth={1.5} dot={false} name="FAQ" />
              <Line type="monotone" dataKey="order" stroke="hsl(32, 95%, 50%)" strokeWidth={1.5} dot={false} name="Order" />
              <Line type="monotone" dataKey="qualifier" stroke="hsl(0, 84%, 60%)" strokeWidth={1.5} dot={false} name="Qualifier" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
