INSERT INTO public.skills (
  id, author_id, name, slug, category, author, provider, description,
  price, installs, tags, is_public, visibility, status, version
) VALUES (
  '11111111-2222-3333-4444-555555555555'::uuid,
  NULL,
  'Daily Briefing',
  'daily-briefing',
  'Operations',
  'AiXin Team',
  'aixin',
  'Fetches live BNB/BTC/ETH prices plus trending coins from CoinGecko and delivers a concise morning briefing. Low-risk, auto-approved. Delivered via your linked Telegram if paired, otherwise as an in-app outcome.',
  0,
  0,
  ARRAY['crypto','markets','telegram','live']::text[],
  true,
  'public',
  'live',
  1
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_public = true,
  visibility = 'public',
  status = 'live';