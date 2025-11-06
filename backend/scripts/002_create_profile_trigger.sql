-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert profile with all available metadata
  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'accountant'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;  
  
  -- Insert default notification preferences
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing; 
  
  return new;
exception
  when others then
    raise warning 'Error in handle_new_user for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

-- Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Triggers to auto-update updated_at column

-- Profiles
drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Companies
drop trigger if exists set_updated_at_companies on public.companies;
create trigger set_updated_at_companies
  before update on public.companies
  for each row
  execute function public.handle_updated_at();

-- Tasks
drop trigger if exists set_updated_at_tasks on public.tasks;
create trigger set_updated_at_tasks
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

-- Task Templates
drop trigger if exists set_updated_at_task_templates on public.task_templates;
create trigger set_updated_at_task_templates
  before update on public.task_templates
  for each row
  execute function public.handle_updated_at();

-- Notification Preferences
drop trigger if exists set_updated_at_notification_preferences on public.notification_preferences;
create trigger set_updated_at_notification_preferences
  before update on public.notification_preferences
  for each row
  execute function public.handle_updated_at();

-- Optional: Activity logging trigger

-- Function to log important changes
create or replace function public.log_company_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.activity_log (user_id, company_id, action, description)
    values (
      new.user_id,
      new.id,
      'company_created',
      format('Company "%s" was created', new.name)
    );
  elsif (TG_OP = 'UPDATE') then
    if (old.status != new.status) then
      insert into public.activity_log (user_id, company_id, action, description)
      values (
        new.user_id,
        new.id,
        'company_status_changed',
        format('Company "%s" status changed from %s to %s', new.name, old.status, new.status)
      );
    end if;
  elsif (TG_OP = 'DELETE') then
    insert into public.activity_log (user_id, company_id, action, description)
    values (
      old.user_id,
      old.id,
      'company_deleted',
      format('Company "%s" was deleted', old.name)
    );
  end if;
  
  return coalesce(new, old);
end;
$$;

-- Trigger for company changes
drop trigger if exists log_company_changes on public.companies;
create trigger log_company_changes
  after insert or update or delete on public.companies
  for each row
  execute function public.log_company_changes();

-- Function to log task completion
create or replace function public.log_task_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'UPDATE' and old.status != 'completed' and new.status = 'completed') then
    insert into public.activity_log (
      user_id,
      company_id,
      task_id,
      action,
      description
    )
    values (
      new.completed_by,
      new.company_id,
      new.id,
      'task_completed',
      format('Task "%s" was completed', new.title)
    );
  end if;
  
  return new;
end;
$$;

-- Trigger for task completion
drop trigger if exists log_task_completion on public.tasks;
create trigger log_task_completion
  after update on public.tasks
  for each row
  execute function public.log_task_completion();

-- Add helpful comments

comment on function public.handle_new_user() is 'Automatically creates profile and notification preferences when a new user signs up';
comment on function public.handle_updated_at() is 'Automatically updates the updated_at timestamp on row changes';
comment on function public.log_company_changes() is 'Logs all company creation, updates, and deletions to activity_log';
comment on function public.log_task_completion() is 'Logs task completions to activity_log';
