ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS anchor_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anchor_last_error text,
  ADD COLUMN IF NOT EXISTS anchor_last_attempt_at timestamptz;

CREATE INDEX IF NOT EXISTS receipts_unanchored_idx
  ON public.receipts (created_at)
  WHERE tx_hash IS NULL;