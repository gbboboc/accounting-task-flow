create table if not exists public.task_template_overrides (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_id uuid not null references public.task_templates(id) on delete cascade,
  is_disabled boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(company_id, template_id)
);

create index if not exists idx_task_template_overrides_company_id 
  on public.task_template_overrides(company_id);
create index if not exists idx_task_template_overrides_template_id 
  on public.task_template_overrides(template_id);

alter table public.task_template_overrides enable row level security;

create policy "Users can view overrides for their companies"
  on public.task_template_overrides for select
  using (
    exists (
      select 1 from public.companies
      where companies.id = task_template_overrides.company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can insert overrides for their companies"
  on public.task_template_overrides for insert
  with check (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can update overrides for their companies"
  on public.task_template_overrides for update
  using (
    exists (
      select 1 from public.companies
      where companies.id = task_template_overrides.company_id
      and companies.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.companies
      where companies.id = company_id
      and companies.user_id = auth.uid()
    )
  );

create policy "Users can delete overrides for their companies"
  on public.task_template_overrides for delete
  using (
    exists (
      select 1 from public.companies
      where companies.id = task_template_overrides.company_id
      and companies.user_id = auth.uid()
    )
  );

create trigger set_updated_at_task_template_overrides
  before update on public.task_template_overrides
  for each row
  execute function public.handle_updated_at();

comment on table public.task_template_overrides is 'Company-specific overrides for task templates. Allows users to disable templates for specific companies.';

