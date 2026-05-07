
-- Drop old binance table if exists
DROP TABLE IF EXISTS public.payment_orders CASCADE;

CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text UNIQUE NOT NULL,
  tracking_token text UNIQUE NOT NULL,
  alias text NOT NULL,
  email text,
  plan text NOT NULL,
  duration text NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'AWAITING_RECEIPT',
  receipt_url text,
  ai_validation jsonb,
  assigned_key text,
  rejection_reason text,
  telegram_message_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_orders_token ON public.payment_orders(tracking_token);
CREATE INDEX idx_payment_orders_status ON public.payment_orders(status);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- Public read (intended: user retrieves by token via edge function or anon select; tracking_token is the secret)
CREATE POLICY "Public can read payment orders"
ON public.payment_orders FOR SELECT
USING (true);

-- Updates/inserts only via service role (no policy needed; service role bypasses RLS)

CREATE OR REPLACE FUNCTION public.update_payment_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_orders_updated_at
BEFORE UPDATE ON public.payment_orders
FOR EACH ROW EXECUTE FUNCTION public.update_payment_orders_updated_at();

-- Storage bucket for receipts (public so Telegram can fetch the image URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public read receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');
