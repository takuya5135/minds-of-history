-- ==============================================================================
-- Auto-Deletion using pg_cron
-- This script sets up a scheduled job to delete 'wisdoms' older than 30 days.
-- ==============================================================================

-- 1. Enable the pg_cron extension (required for scheduling)
-- Note: You might need to enable this in the Supabase Dashboard > Database > Extensions if this fails.
create extension if not exists pg_cron;

-- 2. Schedule the deletion job
-- Runs every day at 18:00 UTC (which is 03:00 JST next day)
-- Deletes rows from 'wisdoms' created more than 30 days ago.
select cron.schedule(
  'delete-old-wisdoms', -- Job name (unique identifier)
  '0 18 * * *',         -- Cron schedule (At 18:00 UTC)
  $$ delete from wisdoms where created_at < now() - interval '30 days' $$
);

-- Note: To check scheduled jobs, you can run:
-- select * from cron.job;
