-- Create table to track sent reminders (avoid duplicates)
create table if not exists public.sent_reminders (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('7days', '3days', '1day', 'due', 'overdue')),
  sent_at timestamptz default now(),
  sent_date date default current_date,
  email_sent boolean default true,
  error_message text
);

create index if not exists idx_sent_reminders_task_id on public.sent_reminders(task_id);
create index if not exists idx_sent_reminders_user_id on public.sent_reminders(user_id);
create index if not exists idx_sent_reminders_sent_at on public.sent_reminders(sent_at desc);
create index if not exists idx_sent_reminders_sent_date on public.sent_reminders(sent_date);

-- Create unique index to prevent duplicate reminders on the same day
-- This ensures we don't send the same reminder twice in one day
create unique index if not exists idx_sent_reminders_unique_daily 
  on public.sent_reminders(task_id, user_id, reminder_type, sent_date);

-- Trigger to automatically set sent_date from sent_at
create or replace function public.set_sent_date_from_sent_at()
returns trigger
language plpgsql
as $$
begin
  if NEW.sent_at is not null and NEW.sent_date is null then
    NEW.sent_date := date(NEW.sent_at);
  elsif NEW.sent_date is null then
    NEW.sent_date := current_date;
  end if;
  return NEW;
end;
$$;

create trigger set_sent_date_trigger
  before insert or update on public.sent_reminders
  for each row
  execute function public.set_sent_date_from_sent_at();

alter table public.sent_reminders enable row level security;

create policy "Users can view their own sent reminders"
  on public.sent_reminders for select
  using (auth.uid() = user_id);

-- Add 1day reminder preference if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'notification_preferences' 
      and column_name = 'email_task_reminder_1day'
  ) then
    alter table public.notification_preferences
      add column email_task_reminder_1day boolean default true;
    
    comment on column public.notification_preferences.email_task_reminder_1day is 'Send email reminder 1 day before task is due';
  end if;
end $$;

-- Function to get tasks that need reminders
create or replace function public.get_tasks_needing_reminders(
  p_check_date date default current_date
)
returns table(
  task_id uuid,
  user_id uuid,
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
  with task_reminders as (
    select 
      t.id as task_id,
      c.user_id,
      u.email as user_email,
      c.name as company_name,
      t.title as task_title,
      t.due_date,
      t.status,
      coalesce(tt.reminder_days, array[7, 3, 1]::integer[]) as reminder_days,
      coalesce(p.email_task_reminder_7days, true) as email_task_reminder_7days,
      coalesce(p.email_task_reminder_3days, true) as email_task_reminder_3days,
      coalesce(p.email_task_reminder_1day, true) as email_task_reminder_1day,
      coalesce(p.email_task_reminder_due, true) as email_task_reminder_due,
      coalesce(p.email_overdue_tasks, true) as email_overdue_tasks,
      (t.due_date - p_check_date)::integer as days_until_due
    from public.tasks t
    inner join public.companies c on c.id = t.company_id
    inner join auth.users u on u.id = c.user_id
    left join public.task_templates tt on tt.id = t.template_id
    left join public.notification_preferences p on p.user_id = c.user_id
    where t.status not in ('completed')
      and t.due_date >= p_check_date - interval '7 days'
  ),
  reminder_types as (
    select 
      tr.task_id,
      tr.user_id,
      tr.user_email,
      tr.company_name,
      tr.task_title,
      tr.due_date as task_due_date,
      tr.days_until_due,
      case
        when tr.days_until_due < 0 then 'overdue'
        when tr.days_until_due = 0 then 'due'
        when tr.days_until_due = 1 then '1day'
        when tr.days_until_due = 3 then '3days'
        when tr.days_until_due = 7 then '7days'
        else null
      end as reminder_type,
      tr.email_task_reminder_7days,
      tr.email_task_reminder_3days,
      tr.email_task_reminder_1day,
      tr.email_task_reminder_due,
      tr.email_overdue_tasks,
      tr.reminder_days
    from task_reminders tr
    where tr.days_until_due is not null
  )
  select 
    rt.task_id,
    rt.user_id,
    rt.user_email,
    rt.company_name,
    rt.task_title,
    rt.task_due_date,
    rt.reminder_type,
    rt.days_until_due
  from reminder_types rt
  where 
    rt.reminder_type is not null
    and (
      -- Overdue tasks
      (rt.reminder_type = 'overdue' and rt.email_overdue_tasks = true)
      -- Due today
      or (rt.reminder_type = 'due' and rt.email_task_reminder_due = true)
      -- 1 day before
      or (rt.reminder_type = '1day' and rt.email_task_reminder_1day = true and 1 = any(rt.reminder_days))
      -- 3 days before
      or (rt.reminder_type = '3days' and rt.email_task_reminder_3days = true and 3 = any(rt.reminder_days))
      -- 7 days before
      or (rt.reminder_type = '7days' and rt.email_task_reminder_7days = true and 7 = any(rt.reminder_days))
    )
    and not exists (
      -- Exclude tasks where reminder was already sent today
      select 1
      from public.sent_reminders sr
      where sr.task_id = rt.task_id
        and sr.user_id = rt.user_id
        and sr.reminder_type = rt.reminder_type
        and sr.sent_date = p_check_date
    );
end;
$$;

comment on function public.get_tasks_needing_reminders is 'Returns tasks that need reminder emails based on due dates, template reminder settings, and user preferences.';
