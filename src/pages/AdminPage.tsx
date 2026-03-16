import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRODUCTS, LEADS } from '@/data/sampleData';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const STOCK_STYLES: Record<string, string> = {
  in_stock: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  low_stock: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  out_of_stock: 'bg-destructive/10 text-destructive border-destructive/20',
};

const TIER_STYLES: Record<string, string> = {
  vip: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  active: 'bg-primary/10 text-primary border-primary/20',
  qualified: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  new: 'bg-muted text-muted-foreground border-border',
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-muted-foreground">Manage products, leads, and configuration</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-6">
          <TabsTrigger value="products">Product Catalog</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Product Catalog (5 SKUs)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead className="text-right">Price/Box</TableHead>
                    <TableHead className="text-right">Min Qty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PRODUCTS.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.dosage}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.pricePerBox)}</TableCell>
                      <TableCell className="text-right">{p.minOrderQty}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', STOCK_STYLES[p.stockStatus])}>
                          {p.stockStatus.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Buyer Leads ({LEADS.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Last Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEADS.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.companyName}</TableCell>
                      <TableCell>{l.contactName}</TableCell>
                      <TableCell>{l.country}</TableCell>
                      <TableCell className="font-mono text-xs">{l.licenseNumber || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', TIER_STYLES[l.tier])}>
                          {l.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(l.lastContactAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card className="glass-card border-border/50 p-8 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <h3 className="text-xl font-semibold">Configuration Panel</h3>
              <p className="text-muted-foreground">
                AI agent settings, discount rules, shipping zones, and API keys will be configurable here.
              </p>
              <Badge variant="outline">Coming in Phase 2</Badge>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
