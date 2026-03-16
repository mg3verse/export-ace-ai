/** Pricing utilities used by both client components and the edge function */

export interface PricingTier {
  minQty: number;
  maxQty: number;
  discountPct: number;
  label: string;
}

export const PRICING_TIERS: PricingTier[] = [
  { minQty: 1, maxQty: 10, discountPct: 0, label: 'Base price' },
  { minQty: 11, maxQty: 50, discountPct: 10, label: '10% volume discount' },
  { minQty: 51, maxQty: 100, discountPct: 15, label: '15% volume discount' },
  { minQty: 101, maxQty: Infinity, discountPct: 20, label: '20% volume discount' },
];

export const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  AED: 3.67,
  NGN: 1550,
  KES: 153,
  PHP: 56.5,
  SAR: 3.75,
};

export function getTier(quantity: number): PricingTier {
  return PRICING_TIERS.find((t) => quantity >= t.minQty && quantity <= t.maxQty) ?? PRICING_TIERS[0];
}

export function calculatePrice(
  basePrice: number,
  quantity: number,
  currency = 'USD'
): {
  baseUnitPrice: number;
  discountPct: number;
  discountedUnitPrice: number;
  subtotal: number;
  currency: string;
  rate: number;
  totalInCurrency: number;
  tierLabel: string;
} {
  const tier = getTier(quantity);
  const discountedUnitPrice = basePrice * (1 - tier.discountPct / 100);
  const subtotal = discountedUnitPrice * quantity;
  const rate = CURRENCY_RATES[currency] ?? 1;

  return {
    baseUnitPrice: basePrice,
    discountPct: tier.discountPct,
    discountedUnitPrice: Math.round(discountedUnitPrice * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    currency,
    rate,
    totalInCurrency: Math.round(subtotal * rate * 100) / 100,
    tierLabel: tier.label,
  };
}

export interface QuoteItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
}

export interface Quote {
  id: string;
  items: QuoteItem[];
  subtotal: number;
  currency: string;
  total: number;
  validUntil: string;
  generatedAt: string;
}

export function generateQuoteId(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const seq = Math.floor(Math.random() * 9000 + 1000);
  return `QT-${y}${m}-${seq}`;
}
