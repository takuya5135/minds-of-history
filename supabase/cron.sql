-- ==============================================================================
-- Auto-Deletion using pg_cron
-- 智慧の書は10日間、チャット履歴は3日間保存されます。
-- ==============================================================================

-- 1. Enable the pg_cron extension (required for scheduling)
create extension if not exists pg_cron;

-- 2. Schedule the deletion jobs
-- Runs every day at 18:00 UTC (which is 03:00 JST next day)

-- 智慧の書の削除 (10日経過分)
select cron.schedule(
  'delete-old-wisdoms', 
  '0 18 * * *',         
  $$ delete from wisdoms where created_at < now() - interval '10 days' $$
);

-- チャット履歴（メッセージ）の削除 (3日経過分)
select cron.schedule(
  'delete-old-messages',
  '5 18 * * *', -- 5分ずらして実行
  $$ delete from messages where created_at < now() - interval '3 days' $$
);

-- Note: To check scheduled jobs, you can run:
-- select * from cron.job;
