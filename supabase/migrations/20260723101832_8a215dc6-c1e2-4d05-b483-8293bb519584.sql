
-- =====================
-- Enums
-- =====================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.twin_status AS ENUM ('active', 'paused');
CREATE TYPE public.task_status AS ENUM ('pending', 'running', 'done', 'rejected');
CREATE TYPE public.decision_risk AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.decision_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.anchor_status AS ENUM ('pending', 'anchored', 'failed', 'simulated');
CREATE TYPE public.workspace_mode AS ENUM ('test', 'live');

-- =====================
-- Shared updated_at trigger
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================
-- profiles
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- =====================
-- user_roles (separate table — never on profiles)
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Now safe to attach the signup trigger (references user_roles)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- master_twins (one per user)
-- =====================
CREATE TABLE public.master_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL DEFAULT 'M',
  expertise TEXT,
  reputation NUMERIC(4,2) NOT NULL DEFAULT 0,
  verified_actions INTEGER NOT NULL DEFAULT 0,
  status public.twin_status NOT NULL DEFAULT 'active',
  mode public.workspace_mode NOT NULL DEFAULT 'test',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_twins TO authenticated;
GRANT ALL ON public.master_twins TO service_role;
ALTER TABLE public.master_twins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own master twin" ON public.master_twins FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_master_twins_updated BEFORE UPDATE ON public.master_twins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- specialist_twins
-- =====================
CREATE TABLE public.specialist_twins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT NOT NULL,
  type TEXT NOT NULL,
  status public.twin_status NOT NULL DEFAULT 'active',
  reputation NUMERIC(4,2) NOT NULL DEFAULT 0,
  earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specialist_twins TO authenticated;
GRANT ALL ON public.specialist_twins TO service_role;
ALTER TABLE public.specialist_twins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own specialists" ON public.specialist_twins FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_specialist_twins_updated BEFORE UPDATE ON public.specialist_twins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_specialists_user ON public.specialist_twins(user_id);

-- =====================
-- skills (marketplace catalog)
-- =====================
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  installs INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT true,
  schema JSONB,
  rules JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public skills readable" ON public.skills FOR SELECT
  USING (is_public = true);
CREATE POLICY "read own skills" ON public.skills FOR SELECT TO authenticated
  USING (auth.uid() = author_id);
CREATE POLICY "insert own skills" ON public.skills FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "update own skills" ON public.skills FOR UPDATE TO authenticated
  USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "delete own skills" ON public.skills FOR DELETE TO authenticated
  USING (auth.uid() = author_id);
CREATE TRIGGER trg_skills_updated BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- skill_installs
-- =====================
CREATE TABLE public.skill_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_installs TO authenticated;
GRANT ALL ON public.skill_installs TO service_role;
ALTER TABLE public.skill_installs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own installs" ON public.skill_installs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================
-- skill_assignments
-- =====================
CREATE TABLE public.skill_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialist_twins(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (skill_id, specialist_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_assignments TO authenticated;
GRANT ALL ON public.skill_assignments TO service_role;
ALTER TABLE public.skill_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assignments" ON public.skill_assignments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================
-- tasks
-- =====================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.specialist_twins(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  intent TEXT NOT NULL,
  intent_json JSONB,
  value TEXT,
  status public.task_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_tasks_specialist ON public.tasks(specialist_id);

-- =====================
-- decision_cards
-- =====================
CREATE TABLE public.decision_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES public.specialist_twins(id) ON DELETE SET NULL,
  risk public.decision_risk NOT NULL,
  requestor TEXT NOT NULL,
  specialist_name TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT,
  amount NUMERIC(14,2),
  status public.decision_status NOT NULL DEFAULT 'pending',
  sip_report JSONB,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_cards TO authenticated;
GRANT ALL ON public.decision_cards TO service_role;
ALTER TABLE public.decision_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON public.decision_cards FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_decision_cards_updated BEFORE UPDATE ON public.decision_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- receipts (signed audit records)
-- =====================
CREATE TABLE public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  decision_card_id UUID REFERENCES public.decision_cards(id) ON DELETE SET NULL,
  specialist_id UUID REFERENCES public.specialist_twins(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  sip_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  tx_hash TEXT,
  chain_id INTEGER NOT NULL DEFAULT 97,
  block_number BIGINT,
  anchor_status public.anchor_status NOT NULL DEFAULT 'pending',
  iso_badge BOOLEAN NOT NULL DEFAULT true,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own receipts" ON public.receipts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_receipts_user_time ON public.receipts(user_id, created_at DESC);

-- =====================
-- reputation_entries
-- =====================
CREATE TABLE public.reputation_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('master', 'specialist')),
  subject_id UUID NOT NULL,
  delta NUMERIC(6,3) NOT NULL,
  reason TEXT,
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reputation_entries TO authenticated;
GRANT ALL ON public.reputation_entries TO service_role;
ALTER TABLE public.reputation_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rep entries" ON public.reputation_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================
-- adapters (Test/Live integrations)
-- =====================
CREATE TABLE public.adapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  kind TEXT NOT NULL,
  mode public.workspace_mode NOT NULL DEFAULT 'test',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adapters TO authenticated;
GRANT ALL ON public.adapters TO service_role;
ALTER TABLE public.adapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own adapters" ON public.adapters FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_adapters_updated BEFORE UPDATE ON public.adapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ledger_preview (simulated $AXN balances)
-- =====================
CREATE TABLE public.ledger_preview (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  earning_pool NUMERIC(18,4) NOT NULL DEFAULT 0,
  staked NUMERIC(18,4) NOT NULL DEFAULT 0,
  access_bond NUMERIC(18,4) NOT NULL DEFAULT 0,
  burn_24h NUMERIC(18,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_preview TO authenticated;
GRANT ALL ON public.ledger_preview TO service_role;
ALTER TABLE public.ledger_preview ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger" ON public.ledger_preview FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_ledger_updated BEFORE UPDATE ON public.ledger_preview
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- Seed public marketplace skills (author_id NULL = platform-owned)
-- =====================
INSERT INTO public.skills (name, slug, category, author, provider, description, price, installs, tags, is_public) VALUES
  ('Flight Booking',       'flight-booking',       'Travel',    'Travelpayouts', 'Travelpayouts', 'Search and book flights via Travelpayouts',           29,   12400, ARRAY['deterministic'],               true),
  ('Hotel Booking',        'hotel-booking',        'Travel',    'Travelpayouts', 'Travelpayouts', 'Search and reserve hotels',                           NULL,  8100, ARRAY['deterministic'],               true),
  ('Price Monitor',        'price-monitor',        'Travel',    'AiXin Labs',    'AiXin Labs',    'Watch fare and price drops',                          NULL, 22100, ARRAY['deterministic','autonomous'],  true),
  ('Social Scheduler',     'social-scheduler',     'Marketing', 'Nova Studio',   'Nova Studio',   'Schedule cross-channel posts',                        19,    8700, ARRAY['deterministic'],               true),
  ('Engagement Analyzer',  'engagement-analyzer',  'Marketing', 'AiXin Labs',    'AiXin Labs',    'Analyze engagement across posts',                     NULL,  5400, ARRAY['deterministic'],               true),
  ('Content Optimizer',    'content-optimizer',    'Marketing', 'Nova Studio',   'Nova Studio',   'Rewrite posts for target metrics',                    NULL,  6200, ARRAY['deterministic'],               true),
  ('Portfolio Tracker',    'portfolio-tracker',    'Finance',   'AiXin Labs',    'AiXin Labs',    'Track portfolio holdings and P&L',                    NULL,  4300, ARRAY['deterministic'],               true),
  ('Tax Report',           'tax-report',           'Finance',   'AiXin Labs',    'AiXin Labs',    'Generate a tax report from ledger data',              NULL,  3100, ARRAY['deterministic'],               true),
  ('Trade Executor',       'trade-executor',       'Finance',   'AiXin Labs',    'AiXin Labs',    'Execute trades against a broker adapter',             NULL,  2800, ARRAY['deterministic'],               true),
  ('Refund Handler',       'refund-handler',       'Support',   'AiXin Labs',    'AiXin Labs',    'Issue refunds through payment adapter',               NULL,  3900, ARRAY['deterministic'],               true),
  ('Ticket Triage',        'ticket-triage',        'Support',   'AiXin Labs',    'AiXin Labs',    'Classify and route incoming tickets',                 NULL,  2500, ARRAY['deterministic'],               true);
