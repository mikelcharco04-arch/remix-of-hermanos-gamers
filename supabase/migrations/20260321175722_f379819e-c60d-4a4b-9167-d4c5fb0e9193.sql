
-- Create proxy_keys table
CREATE TABLE public.proxy_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('Normal', 'Premium')),
  status TEXT NOT NULL DEFAULT 'Activa' CHECK (status IN ('Activa', 'Usada', 'Expirada', 'Bloqueada')),
  duration TEXT NOT NULL,
  duration_ms BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_by TEXT,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create active_users table
CREATE TABLE public.active_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  blocked BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.proxy_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_users ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (admin-managed system without user auth)
CREATE POLICY "Allow public read on proxy_keys" ON public.proxy_keys FOR SELECT USING (true);
CREATE POLICY "Allow public insert on proxy_keys" ON public.proxy_keys FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on proxy_keys" ON public.proxy_keys FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on proxy_keys" ON public.proxy_keys FOR DELETE USING (true);

CREATE POLICY "Allow public read on active_users" ON public.active_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on active_users" ON public.active_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on active_users" ON public.active_users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on active_users" ON public.active_users FOR DELETE USING (true);

-- Indexes for fast lookups
CREATE INDEX idx_proxy_keys_key ON public.proxy_keys (key);
CREATE INDEX idx_proxy_keys_status ON public.proxy_keys (status);
CREATE INDEX idx_active_users_key ON public.active_users (key);
