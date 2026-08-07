-- 1. task_events ledger
CREATE TABLE public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  phase text NOT NULL,           -- sense | plan | act | verify | anchor | gate
  kind text NOT NULL,            -- tool | sip | model | guard | output | loop | chain
  title text NOT NULL,
  detail text,
  chip text,                     -- ERC-8004 | SIP | TOP | ISO 42001
  tag text,
  tx_hash text,                  -- real on-chain tx if this event is chain-related
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_events_task_seq ON public.task_events(task_id, seq);
CREATE INDEX idx_task_events_user ON public.task_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.task_events TO authenticated;
GRANT ALL ON public.task_events TO service_role;

ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own task events read"
  ON public.task_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "own task events insert"
  ON public.task_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Realtime publication for live streaming
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.decision_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;

-- Ensure full row payload for updates so UI reflects status flips.
ALTER TABLE public.task_events REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.decision_cards REPLICA IDENTITY FULL;
ALTER TABLE public.receipts REPLICA IDENTITY FULL;