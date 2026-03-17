
-- Create admin_alerts table (required by send-admin-alert edge function)
CREATE TABLE public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  conversation_id uuid REFERENCES public.conversations(id),
  order_id uuid REFERENCES public.orders(id),
  assigned_to text,
  resolution_note text,
  notified_whatsapp boolean DEFAULT false,
  notified_email boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing pattern)
CREATE POLICY "Allow public read on admin_alerts" ON public.admin_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on admin_alerts" ON public.admin_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on admin_alerts" ON public.admin_alerts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on admin_alerts" ON public.admin_alerts FOR DELETE USING (true);

-- Enable realtime for live alert updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_alerts;

-- Index for fast lookups
CREATE INDEX idx_admin_alerts_status ON public.admin_alerts(status);
CREATE INDEX idx_admin_alerts_type ON public.admin_alerts(alert_type);
CREATE INDEX idx_admin_alerts_created ON public.admin_alerts(created_at DESC);
