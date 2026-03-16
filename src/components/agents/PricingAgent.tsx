import { useState } from 'react';
import { DollarSign, Search, Calculator, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { calculatePrice, CURRENCY_RATES, generateQuoteId, PRICING_TIERS } from '@/services/ai/pricingUtils';
import { logAnalyticsEvent } from '@/services/api';
import { toast } from 'sonner';
import type { DbProduct } from '@/types/database';

export default function PricingAgent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DbProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DbProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState('USD');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`sku.ilike.%${query.trim()}%,name.ilike.%${query.trim()}%`)
        .limit(5);
      if (error) throw error;
      setResults((data ?? []) as unknown as DbProduct[]);
      logAnalyticsEvent('pricing_search', { query: query.trim(), resultCount: data?.length ?? 0 });
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const pricing = selectedProduct
    ? calculatePrice(Number(selectedProduct.price_usd), quantity, currency)
    : null;

  const handleGenerateQuote = () => {
    if (!selectedProduct || !pricing) return;
    const quoteId = generateQuoteId();
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    logAnalyticsEvent('quote_generated', {
      quoteId,
      sku: selectedProduct.sku,
      quantity,
      total: pricing.subtotal,
      currency,
    });
    toast.success(`Quote ${quoteId} generated — valid until ${validUntil}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Pricing Agent</h2>
        <Badge variant="outline" className="ml-auto text-xs">
          💰 Live Pricing
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" /> Product Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name or SKU…"
              className="flex-1"
            />
            <Button size="sm" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? '…' : 'Search'}
            </Button>
          </div>
          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                    selectedProduct?.id === p.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>{' '}
                  {p.name} — ${Number(p.price_usd).toFixed(2)}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calculator */}
      {selectedProduct && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Price Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-semibold">{selectedProduct.name}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CURRENCY_RATES).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tier info */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              {PRICING_TIERS.map((t) => (
                <div
                  key={t.minQty}
                  className={`flex justify-between ${
                    pricing && pricing.tierLabel === t.label ? 'text-primary font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  <span>
                    {t.maxQty === Infinity ? `${t.minQty}+` : `${t.minQty}-${t.maxQty}`} units
                  </span>
                  <span>{t.discountPct === 0 ? 'Base price' : `${t.discountPct}% off`}</span>
                </div>
              ))}
            </div>

            {pricing && (
              <div className="rounded-lg border border-border p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base price</span>
                  <span>${pricing.baseUnitPrice.toFixed(2)}/unit</span>
                </div>
                {pricing.discountPct > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>{pricing.tierLabel}</span>
                    <span>-{pricing.discountPct}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unit price</span>
                  <span>${pricing.discountedUnitPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>×{quantity}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total ({currency})</span>
                  <span>
                    {currency === 'USD' ? '$' : ''}
                    {pricing.totalInCurrency.toLocaleString()}
                    {currency !== 'USD' && ` (≈ $${pricing.subtotal.toLocaleString()})`}
                  </span>
                </div>
              </div>
            )}

            <Button className="w-full" size="sm" onClick={handleGenerateQuote}>
              <FileText className="mr-2 h-4 w-4" /> Generate Quote (7-day validity)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
