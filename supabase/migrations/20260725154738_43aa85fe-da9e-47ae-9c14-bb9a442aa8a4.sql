
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'executing';
ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'awaiting_input';

CREATE TABLE public.task_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  artifact jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_outcomes_task ON public.task_outcomes(task_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_outcomes TO authenticated;
GRANT ALL ON public.task_outcomes TO service_role;
ALTER TABLE public.task_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_outcomes" ON public.task_outcomes FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.task_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user','twin','system')),
  body text NOT NULL,
  source text NOT NULL DEFAULT 'app' CHECK (source IN ('app','telegram','system')),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_messages_task ON public.task_messages(task_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_messages TO authenticated;
GRANT ALL ON public.task_messages TO service_role;
ALTER TABLE public.task_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_task_messages" ON public.task_messages FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.telegram_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  chat_id bigint UNIQUE,
  username text,
  link_code text UNIQUE,
  linked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_links TO authenticated;
GRANT ALL ON public.telegram_links TO service_role;
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tg_link" ON public.telegram_links FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_outcomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_messages;
