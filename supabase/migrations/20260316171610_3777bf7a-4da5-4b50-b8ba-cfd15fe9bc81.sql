
-- Create app_settings table
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on app_settings" ON public.app_settings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on app_settings" ON public.app_settings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on app_settings" ON public.app_settings FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Add missing RLS policies on products
CREATE POLICY "Allow public insert on products" ON public.products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on products" ON public.products FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on products" ON public.products FOR DELETE TO public USING (true);

-- Add missing RLS policies on leads
CREATE POLICY "Allow public update on leads" ON public.leads FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on leads" ON public.leads FOR DELETE TO public USING (true);

-- Add missing RLS policies on orders
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on orders" ON public.orders FOR DELETE TO public USING (true);

-- Indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON public.conversations(conversation_state);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
