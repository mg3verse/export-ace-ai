
-- Store admin contact settings in app_settings
INSERT INTO public.app_settings (key, value) VALUES 
  ('admin_whatsapp', '""'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES 
  ('admin_email', '""'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.app_settings (key, value) VALUES 
  ('order_approval_threshold', '5000'::jsonb)
ON CONFLICT DO NOTHING;
