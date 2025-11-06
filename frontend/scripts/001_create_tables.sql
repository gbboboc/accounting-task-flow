-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text default 'accountant',
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create companies table
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  fiscal_code text not null,
  location text not null,
  contact_person text,
  phone text,
  email text,
  organization_type text not null check (organization_type in ('SRL', 'ÎI', 'ÎP', 'ONG')),
  is_tva_payer boolean default false,
  tva_type text check (tva_type in ('lunar', 'trimestrial')),
  has_employees boolean default false,
  employee_count integer default 0,
  tax_regime text check (tax_regime in ('general', 'simplified', 'agricultural')),
  accounting_start_date date not null,
  status text default 'active' check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create task_templates table
create table if not exists public.task_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  frequency text not null check (frequency in ('monthly', 'quarterly', 'annual', 'weekly')),
  deadline_day integer not null,
  deadline_month integer,
  applies_to_tva_payers boolean default false,
  applies_to_employers boolean default false,
  applies_to_org_types text[],
  reminder_days integer[] default array[7, 3, 1],
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid references public.task_templates(id) on delete set null,
  title text not null,
  description text,
  due_date date not null,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  notes text,
  depends_on uuid references public.tasks(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create activity_log table
create table if not exists public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  action text not null,
  description text not null,
  created_at timestamptz default now()
);

-- Create notification_preferences table
create table if not exists public.notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  email_daily_summary boolean default true,
  email_task_reminder_7days boolean default true,
  email_task_reminder_3days boolean default true,
  email_task_reminder_due boolean default true,
  email_overdue_tasks boolean default true,
  push_task_completed boolean default true,
  push_company_added boolean default true,
  push_system_updates boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.task_templates enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.notification_preferences enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policies for companies
create policy "Users can view their own companies"
  on public.companies for select
  using (auth.uid() = user_id);

create policy "Users can insert their own companies"
  on public.companies for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own companies"
  on public.companies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own companies"
  on public.companies for delete
  using (auth.uid() = user_id);

-- RLS Policies for task_templates (read-only for all authenticated users)
create policy "Authenticated users can view task templates"
  on public.task_templates for select
  to authenticated
  using (true);

-- RLS Policies for tasks
create policy "Users can view tasks for their companies"
  on public.tasks for select
  using (
    exists (
      select 1 from public.companies
      where companies.id = tasks.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can insert tasks for their companies"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.companies
      where companies.id = tasks.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can update tasks for their companies"
  on public.tasks for update
  using (
    exists (
      select 1 from public.companies
      where companies.id = tasks.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can delete tasks for their companies"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.companies
      where companies.id = tasks.company_id
      and companies.user_id = auth.uid()
    )
  );

-- RLS Policies for activity_log
create policy "Users can view their own activity"
  on public.activity_log for select
  using (auth.uid() = user_id);

create policy "Users can insert their own activity"
  on public.activity_log for insert
  with check (auth.uid() = user_id);

-- RLS Policies for notification_preferences
create policy "Users can view their own preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_companies_user_id on public.companies(user_id);
create index if not exists idx_companies_status on public.companies(status);
create index if not exists idx_tasks_company_id on public.tasks(company_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_activity_log_user_id on public.activity_log(user_id);
create index if not exists idx_activity_log_created_at on public.activity_log(created_at desc);
