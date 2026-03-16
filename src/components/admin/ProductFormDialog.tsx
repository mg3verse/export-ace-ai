import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  price_usd: number;
  stock_quantity: number;
  description: string;
  specifications: Record<string, unknown>;
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => void;
  initialData?: Partial<ProductFormData> | null;
  loading?: boolean;
}

const CATEGORIES = ['Analgesics', 'Antibiotics', 'Cardiovascular', 'Supplements', 'Dermatology', 'Other'];

const EMPTY: ProductFormData = {
  sku: '', name: '', category: 'Analgesics', price_usd: 0,
  stock_quantity: 0, description: '', specifications: {},
};

export function ProductFormDialog({ open, onOpenChange, onSubmit, initialData, loading }: ProductFormDialogProps) {
  const [form, setForm] = useState<ProductFormData>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdit = !!initialData?.sku;

  useEffect(() => {
    if (open) setForm(initialData ? { ...EMPTY, ...initialData } : EMPTY);
    setErrors({});
  }, [open, initialData]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.sku.trim() || form.sku.length > 20) e.sku = 'SKU is required (max 20 chars)';
    if (!form.name.trim() || form.name.length > 100) e.name = 'Name is required (max 100 chars)';
    if (form.price_usd <= 0) e.price_usd = 'Price must be > 0';
    if (form.stock_quantity < 0) e.stock_quantity = 'Stock cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" value={form.sku} maxLength={20} disabled={isEdit}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" value={form.name} maxLength={100}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD) *</Label>
              <Input id="price" type="number" min={0} step={0.01} value={form.price_usd}
                onChange={(e) => setForm((f) => ({ ...f, price_usd: parseFloat(e.target.value) || 0 }))} />
              {errors.price_usd && <p className="text-xs text-destructive">{errors.price_usd}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input id="stock" type="number" min={0} value={form.stock_quantity}
                onChange={(e) => setForm((f) => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))} />
              {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={form.description} maxLength={500} rows={3}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Add Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
