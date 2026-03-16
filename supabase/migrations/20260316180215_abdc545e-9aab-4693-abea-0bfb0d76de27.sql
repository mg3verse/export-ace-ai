
-- Create purchases table for real purchase data
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_date DATE NOT NULL,
  invoice_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  batch TEXT,
  mfg_date DATE,
  exp_date DATE,
  qty INTEGER NOT NULL DEFAULT 0,
  rate_per_strip NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  bill_discount NUMERIC DEFAULT 0,
  gst_pct NUMERIC DEFAULT 0,
  bill_amount NUMERIC NOT NULL DEFAULT 0,
  cost_per_strip NUMERIC DEFAULT 0,
  company TEXT,
  salt_name TEXT,
  entry_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table for real sales data
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_date DATE NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  batch TEXT,
  mfg_date DATE,
  exp_date DATE,
  qty INTEGER NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  total_selling_amount NUMERIC NOT NULL DEFAULT 0,
  bill_amount NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  cost_amount NUMERIC DEFAULT 0,
  company TEXT,
  salt_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- RLS policies (public read/insert for now)
CREATE POLICY "Allow public read on purchases" ON public.purchases FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on purchases" ON public.purchases FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public read on sales" ON public.sales FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on sales" ON public.sales FOR INSERT TO public WITH CHECK (true);
