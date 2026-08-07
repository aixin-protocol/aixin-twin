CREATE TABLE IF NOT EXISTS public.demo_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text UNIQUE NOT NULL,
  agent_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.demo_api_keys TO service_role;
ALTER TABLE public.demo_api_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.demo_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.demo_customers TO service_role;
ALTER TABLE public.demo_customers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.demo_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.demo_orders TO service_role;
ALTER TABLE public.demo_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.demo_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  amount numeric(12,2) NOT NULL,
  reason text,
  issued_by_agent text NOT NULL,
  governance_status text NOT NULL DEFAULT 'executed',
  sip_receipt_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.demo_refunds TO service_role;
ALTER TABLE public.demo_refunds ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.demo_agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_label text NOT NULL,
  tool text NOT NULL,
  args jsonb,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.demo_agent_actions TO service_role;
ALTER TABLE public.demo_agent_actions ENABLE ROW LEVEL SECURITY;

INSERT INTO public.demo_customers (email, name)
VALUES ('demo@aixin.local', 'Demo Customer')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.demo_orders (order_number, customer_email, amount, currency, status)
VALUES ('ORD-1001', 'demo@aixin.local', 129.00, 'USD', 'refunded')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO public.demo_refunds (order_number, amount, reason, issued_by_agent, governance_status)
VALUES ('ORD-1001', 129.00, 'Customer reported non-delivery', 'system-baseline', 'executed');

INSERT INTO public.demo_api_keys (key_hash, agent_label) VALUES
  ('aixin-demo-key-openclaw', 'openclaw-baseline'),
  ('aixin-demo-key-aixin', 'aixin-governed')
ON CONFLICT (key_hash) DO NOTHING;