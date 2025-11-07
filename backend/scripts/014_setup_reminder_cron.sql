-- =====================================================
-- SETUP INSTRUCTIONS FOR EMAIL REMINDER SYSTEM
-- =====================================================
-- 
-- After running this script, follow these steps:
--
-- 1. Enable Extensions in Supabase Dashboard:
--    - Go to Database > Extensions
--    - Enable 'pg_cron'
--    - Enable 'pg_net' (for HTTP requests)
--
-- 2. Get your Supabase project details:
--    - Project URL: Found in Supabase Dashboard > Settings > API
--    - Service Role Key: Found in Supabase Dashboard > Settings > API (keep secret!)
--
-- 3. Set up the cron job (run in Supabase SQL Editor):
--
--    SELECT cron.schedule(
--      'send-task-reminders-daily',
--      '0 9 * * *', -- Run at 9:00 AM daily (UTC time)
--      $$
--      SELECT
--        net.http_post(
--          url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-task-reminders',
--          headers := jsonb_build_object(
--            'Content-Type', 'application/json',
--            'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--          ),
--          body := '{}'::jsonb
--        ) AS request_id;
--      $$
--    );
--
--    Replace:
--    - YOUR_PROJECT_REF: Your Supabase project reference (e.g., 'abcdefghijklmnop')
--    - YOUR_SERVICE_ROLE_KEY: Your Supabase service role key
--
-- 4. To test the cron job manually, you can call the Edge Function directly:
--
--    curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-task-reminders \
--      -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--      -H "Content-Type: application/json"
--
-- 5. To check cron job status:
--
--    SELECT * FROM cron.job WHERE jobname = 'send-task-reminders-daily';
--
-- 6. To check cron job execution history:
--
--    SELECT * FROM cron.job_run_details 
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-task-reminders-daily')
--    ORDER BY start_time DESC
--    LIMIT 10;
--
-- 7. To unschedule the job:
--
--    SELECT cron.unschedule('send-task-reminders-daily');
--
-- =====================================================

-- Helper function to check if reminders are working
create or replace function public.test_reminder_system()
returns table(
  task_id uuid,
  user_email text,
  company_name text,
  task_title text,
  task_due_date date,
  reminder_type text,
  days_until_due integer
)
language plpgsql
security definer
as $$
begin
  return query
  select * from public.get_tasks_needing_reminders(current_date);
end;
$$;

comment on function public.test_reminder_system is 'Test function to see which tasks need reminders today. Useful for debugging.';

