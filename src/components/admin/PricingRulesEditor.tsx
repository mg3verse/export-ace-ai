import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PRICING_TIERS, CURRENCY_RATES } from '@/services/ai/pricingUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface TierRow { minQty: number; maxQty: number; discountPct: number; label: string }

export function PricingRulesEditor() {
  const [tiers, setTiers] = useState<TierRow[]>(PRICING_TIERS.map((t) => ({ ...t, maxQty: t.maxQty === Infinity ? 9999 : t.maxQty })));
  const [rates, setRates] = useState<Record<string, number>>({ ...CURRENCY_RATES });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('app_settings').select('*').in('key', ['pricing_tiers', 'currency_rates']);
      data?.forEach((row: { key: string; value: unknown }) => {
        if (row.key === 'pricing_tiers' && Array.isArray(row.value)) setTiers(row.value as TierRow[]);
        if (row.key === 'currency_rates' && typeof row.value === 'object') setRates(row.value as Record<string, number>);
      });
    })();
  }, []);

  const updateTier = (i: number, field: keyof TierRow, value: string | number) => {
    setTiers((prev) => prev.map((t, idx) => idx === i ? { ...t, [field]: typeof value === 'string' ? value : Number(value) } : t));
  };

  const updateRate = (currency: string, value: number) => {
    setRates((prev) => ({ ...prev, [currency]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const [k, v] of [['pricing_tiers', tiers], ['currency_rates', rates]] as [string, unknown][]) {
        await supabase.from('app_settings').upsert({ key: k, value: v as Record<string, unknown>, updated_at: new Date().toISOString() } as any, { onConflict: 'key' });
      }
      toast({ title: 'Pricing Rules Saved', description: 'Changes saved to database.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save pricing rules.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Volume Discount Tiers</CardTitle>
          <CardDescription>Configure quantity-based pricing discounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Min Qty</TableHead>
                <TableHead>Max Qty</TableHead>
                <TableHead>Discount %</TableHead>
                <TableHead>Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((t, i) => (
                <TableRow key={i}>
                  <TableCell><Input type="number" min={0} value={t.minQty} className="w-20" onChange={(e) => updateTier(i, 'minQty', parseInt(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input type="number" min={0} value={t.maxQty} className="w-20" onChange={(e) => updateTier(i, 'maxQty', parseInt(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input type="number" min={0} max={100} value={t.discountPct} className="w-20" onChange={(e) => updateTier(i, 'discountPct', parseInt(e.target.value) || 0)} /></TableCell>
                  <TableCell><Input value={t.label} className="w-48" onChange={(e) => updateTier(i, 'label', e.target.value)} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency Exchange Rates</CardTitle>
          <CardDescription>Rates relative to USD (1 USD = X currency)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(rates).map(([cur, rate]) => (
              <div key={cur} className="space-y-1">
                <Label className="text-xs font-mono">{cur}</Label>
                <Input type="number" step={0.01} min={0} value={rate} onChange={(e) => updateRate(cur, parseFloat(e.target.value) || 0)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving} className="w-full sm:w-auto">
        <Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Pricing Rules'}
      </Button>
    </div>
  );
}
