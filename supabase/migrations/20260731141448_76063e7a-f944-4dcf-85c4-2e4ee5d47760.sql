CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('anchor-retry-queue')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'anchor-retry-queue');

SELECT cron.schedule(
  'anchor-retry-queue',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--676d49b8-c2f7-4d97-95a7-27059111c263.lovable.app/api/public/anchor/retry',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_bCv6xbaSCGp9t4w6QaAGCQ_SuYIGHxU"}'::jsonb,
    body := '{"source": "pg_cron"}'::jsonb
  ) as request_id;
  $$
);