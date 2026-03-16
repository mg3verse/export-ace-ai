import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Search, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';

interface Purchase {
  id: string;
  purchase_date: string;
  invoice_number: string;
  supplier_name: string;
  product_name: string;
  batch: string | null;
  qty: number;
  rate_per_strip: number;
  bill_amount: number;
  cost_per_strip: number;
  company: string | null;
  salt_name: string | null;
}

interface Sale {
  id: string;
  sale_date: string;
  invoice_number: string;
  customer_name: string;
  product_name: string;
  batch: string | null;
  qty: number;
  selling_price: number;
  total_selling_amount: number;
  bill_amount: number;
  cost: number;
  cost_amount: number;
  company: string | null;
  salt_name: string | null;
}

export function TransactionsPanel() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchP, setSearchP] = useState('');
  const [searchS, setSearchS] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pRes, sRes] = await Promise.all([
      supabase.from('purchases').select('*').order('purchase_date', { ascending: false }).limit(500),
      supabase.from('sales').select('*').order('sale_date', { ascending: false }).limit(500),
    ]);
    setPurchases((pRes.data as Purchase[]) || []);
    setSales((sRes.data as Sale[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredP = useMemo(() => {
    if (!searchP) return purchases;
    const q = searchP.toLowerCase();
    return purchases.filter(p => p.product_name.toLowerCase().includes(q) || p.supplier_name.toLowerCase().includes(q) || p.invoice_number.toLowerCase().includes(q));
  }, [purchases, searchP]);

  const filteredS = useMemo(() => {
    if (!searchS) return sales;
    const q = searchS.toLowerCase();
    return sales.filter(s => s.product_name.toLowerCase().includes(q) || s.customer_name.toLowerCase().includes(q) || s.invoice_number.toLowerCase().includes(q));
  }, [sales, searchS]);

  const totalPurchaseAmt = purchases.reduce((s, p) => s + Number(p.bill_amount), 0);
  const totalSalesAmt = sales.reduce((s, p) => s + Number(p.bill_amount), 0);
  const totalProfit = sales.reduce((s, p) => s + (Number(p.bill_amount) - Number(p.cost_amount)), 0);

  if (loading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2"><TrendingDown className="h-5 w-5 text-red-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold"><IndianRupee className="inline h-5 w-5" />{totalPurchaseAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">{purchases.length} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2"><TrendingUp className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold"><IndianRupee className="inline h-5 w-5" />{totalSalesAmt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">{sales.length} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><IndianRupee className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Gross Profit</p>
                <p className="text-2xl font-bold text-emerald-500"><IndianRupee className="inline h-5 w-5" />{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">{totalSalesAmt > 0 ? ((totalProfit / totalSalesAmt) * 100).toFixed(1) : 0}% margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales ({sales.length})</TabsTrigger>
          <TabsTrigger value="purchases">Purchases ({purchases.length})</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Sales Records</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search customer, product, invoice..." value={searchS} onChange={e => setSearchS(e.target.value)} className="pl-9 w-64" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Invoice</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Company</TableHead>
                      <TableHead className="text-xs text-right">Qty</TableHead>
                      <TableHead className="text-xs text-right">Sell Price</TableHead>
                      <TableHead className="text-xs text-right">Bill Amt</TableHead>
                      <TableHead className="text-xs text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredS.map(s => {
                      const profit = Number(s.bill_amount) - Number(s.cost_amount);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs whitespace-nowrap">{new Date(s.sale_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</TableCell>
                          <TableCell className="text-xs font-mono">{s.invoice_number}</TableCell>
                          <TableCell className="text-xs font-medium max-w-[120px] truncate">{s.customer_name}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{s.product_name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{s.company}</TableCell>
                          <TableCell className="text-xs text-right">{s.qty}</TableCell>
                          <TableCell className="text-xs text-right">₹{Number(s.selling_price).toFixed(0)}</TableCell>
                          <TableCell className="text-xs text-right font-medium">₹{Number(s.bill_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell className={`text-xs text-right font-medium ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            ₹{profit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchases Tab */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Purchase Records</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search supplier, product, invoice..." value={searchP} onChange={e => setSearchP(e.target.value)} className="pl-9 w-64" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Invoice</TableHead>
                      <TableHead className="text-xs">Supplier</TableHead>
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Company</TableHead>
                      <TableHead className="text-xs text-right">Qty</TableHead>
                      <TableHead className="text-xs text-right">Rate/Strip</TableHead>
                      <TableHead className="text-xs text-right">Bill Amt</TableHead>
                      <TableHead className="text-xs text-right">Cost/Strip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredP.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(p.purchase_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</TableCell>
                        <TableCell className="text-xs font-mono">{p.invoice_number}</TableCell>
                        <TableCell className="text-xs font-medium max-w-[120px] truncate">{p.supplier_name}</TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">{p.product_name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{p.company}</TableCell>
                        <TableCell className="text-xs text-right">{p.qty}</TableCell>
                        <TableCell className="text-xs text-right">₹{Number(p.rate_per_strip).toFixed(0)}</TableCell>
                        <TableCell className="text-xs text-right font-medium">₹{Number(p.bill_amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell className="text-xs text-right">₹{Number(p.cost_per_strip).toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
