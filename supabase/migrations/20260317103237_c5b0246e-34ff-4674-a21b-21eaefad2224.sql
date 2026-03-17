
-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  company_name TEXT,
  delivery_address TEXT,
  products JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Public read for now (no auth in this app)
CREATE POLICY "Allow public read invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert invoices" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update invoices" ON public.invoices FOR UPDATE USING (true);

-- Index for fast lookups
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_conversation_id ON public.invoices(conversation_id);
