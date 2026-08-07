
ALTER TABLE public.specialist_twins
  ADD COLUMN IF NOT EXISTS agent_id BIGINT,
  ADD COLUMN IF NOT EXISTS agent_domain TEXT,
  ADD COLUMN IF NOT EXISTS identity_tx_hash TEXT;

ALTER TABLE public.receipts
  ADD COLUMN IF NOT EXISTS agent_id BIGINT,
  ADD COLUMN IF NOT EXISTS identity_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS feedback_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS validation_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS validation_response SMALLINT;
