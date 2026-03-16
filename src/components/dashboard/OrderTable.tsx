import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types/domain';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-primary/10 text-primary border-primary/20',
  shipped: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted text-muted-foreground border-border',
};

interface OrderTableProps {
  orders: Order[];
}

export function OrderTable({ orders }: OrderTableProps) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">{order.id}</TableCell>
                <TableCell className="font-medium">{order.companyName}</TableCell>
                <TableCell>{order.country}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(order.totalValue)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[order.status])}>
                    {order.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
