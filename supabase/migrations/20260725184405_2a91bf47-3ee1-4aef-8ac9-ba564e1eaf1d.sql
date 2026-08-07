
CREATE TABLE public.mock_customers (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_customers TO authenticated, anon;
GRANT ALL ON public.mock_customers TO service_role;
ALTER TABLE public.mock_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_customers_read_all" ON public.mock_customers FOR SELECT USING (true);

CREATE TABLE public.mock_orders (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES public.mock_customers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'paid',
  charge_count int NOT NULL DEFAULT 1,
  refund_state text NOT NULL DEFAULT 'none',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mock_orders TO authenticated, anon;
GRANT ALL ON public.mock_orders TO service_role;
ALTER TABLE public.mock_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_orders_read_all" ON public.mock_orders FOR SELECT USING (true);

CREATE TABLE public.mock_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text NOT NULL REFERENCES public.mock_orders(id) ON DELETE CASCADE,
  agent text NOT NULL,
  kind text NOT NULL DEFAULT 'refund',
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL,
  receipt jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mock_payments TO authenticated;
GRANT ALL ON public.mock_payments TO service_role;
ALTER TABLE public.mock_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_payments_own" ON public.mock_payments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX mock_payments_order_agent_idx ON public.mock_payments(order_id, agent);

-- Seed the duplicate-charge scenario.
INSERT INTO public.mock_customers (id, name, email) VALUES
  ('8842', 'Dana Reyes', 'dana.reyes@example.com'),
  ('7130', 'Miguel Ortiz', 'miguel.ortiz@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.mock_orders (id, customer_id, amount, currency, status, charge_count, description) VALUES
  ('UA-1123', '8842', 480.00, 'USD', 'paid', 2, 'Annual plan renewal — charged twice on 2026-07-18 due to a retry timeout.'),
  ('UA-1099', '7130', 89.00, 'USD', 'paid', 1, 'Monthly plan renewal.')
ON CONFLICT (id) DO NOTHING;
