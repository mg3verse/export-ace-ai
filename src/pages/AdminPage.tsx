import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, Upload } from 'lucide-react';
import { ProductFormDialog, type ProductFormData } from '@/components/admin/ProductFormDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';
import { FAQManager } from '@/components/admin/FAQManager';
import { PricingRulesEditor } from '@/components/admin/PricingRulesEditor';
import { AgentSettingsPanel } from '@/components/admin/AgentSettingsPanel';
import { IntegrationsPanel } from '@/components/admin/IntegrationsPanel';
import { TeamPanel } from '@/components/admin/TeamPanel';
import type { Tables } from '@/integrations/supabase/types';

type DbProduct = Tables<'products'>;

const stockBadge = (qty: number) => {
  if (qty > 50) return { label: 'In Stock', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  if (qty > 0) return { label: 'Low Stock', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
  return { label: 'Out of Stock', cls: 'bg-destructive/10 text-destructive border-destructive/20' };
};

export default function AdminPage() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<DbProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setProducts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const handleAdd = () => { setEditProduct(null); setFormOpen(true); };
  const handleEdit = (p: DbProduct) => { setEditProduct(p); setFormOpen(true); };

  const handleSubmit = async (data: ProductFormData) => {
    setSaving(true);
    if (editProduct) {
      const { error } = await supabase.from('products').update({
        name: data.name, category: data.category, price_usd: data.price_usd,
        stock_quantity: data.stock_quantity, description: data.description,
      }).eq('id', editProduct.id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Product Updated' });
    } else {
      const { error } = await supabase.from('products').insert({
        sku: data.sku, name: data.name, category: data.category,
        price_usd: data.price_usd, stock_quantity: data.stock_quantity, description: data.description,
      });
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else toast({ title: 'Product Added' });
    }
    setSaving(false); setFormOpen(false); fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Product Deleted' });
    setSaving(false); setDeleteId(null); fetchProducts();
  };

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = text.split('\n').slice(1).filter(Boolean);
    const items = rows.map((r) => {
      const [sku, name, category, price, stock, desc] = r.split(',').map((s) => s.trim());
      return { sku, name, category: category || 'Other', price_usd: parseFloat(price) || 0, stock_quantity: parseInt(stock) || 0, description: desc || '' };
    });
    const { error } = await supabase.from('products').insert(items);
    if (error) toast({ title: 'CSV Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Bulk Import', description: `${items.length} products imported.` });
    fetchProducts();
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-muted-foreground">Manage products, agents, and configuration</p>
      </div>

      <Tabs defaultValue="products">
        <ScrollArea className="w-full">
          <TabsList className="mb-6 w-max">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="faq">FAQ Knowledge</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
            <TabsTrigger value="agents">Agent Settings</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="team">Team & Access</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab 1: Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Product Catalog ({products.length})</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-48" />
                </div>
                <label>
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                  <Button variant="outline" asChild><span><Upload className="mr-2 h-4 w-4" />CSV Import</span></Button>
                </label>
                <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" />Add Product</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const s = stockBadge(p.stock_quantity);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-muted-foreground">{p.category}</TableCell>
                          <TableCell className="text-right">${Number(p.price_usd).toFixed(2)}</TableCell>
                          <TableCell className="text-right">{p.stock_quantity}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(s.cls)}>{s.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && !loading && (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: FAQ */}
        <TabsContent value="faq"><FAQManager /></TabsContent>

        {/* Tab 3: Pricing */}
        <TabsContent value="pricing"><PricingRulesEditor /></TabsContent>

        {/* Tab 4: Agents */}
        <TabsContent value="agents"><AgentSettingsPanel /></TabsContent>

        {/* Tab 5: Integrations */}
        <TabsContent value="integrations"><IntegrationsPanel /></TabsContent>

        {/* Tab 6: Team */}
        <TabsContent value="team"><TeamPanel /></TabsContent>
      </Tabs>

      <ProductFormDialog
        open={formOpen} onOpenChange={setFormOpen} loading={saving}
        initialData={editProduct ? { sku: editProduct.sku, name: editProduct.name, category: editProduct.category, price_usd: Number(editProduct.price_usd), stock_quantity: editProduct.stock_quantity, description: editProduct.description || '' } : null}
        onSubmit={handleSubmit}
      />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Product?" description="This product will be permanently removed from the catalog." onConfirm={handleDelete} loading={saving} />
    </div>
  );
}
