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

-- Add triggers for updated_at
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.companies
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.task_templates
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.tasks
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.handle_updated_at();

-- Function to generate tasks for a company based on templates
create or replace function public.generate_tasks_for_company(
  p_company_id uuid,
  p_start_date date default current_date,
  p_months_ahead integer default 12
)
returns void
language plpgsql
security definer
as $$
declare
  v_company record;
  v_template record;
  v_current_date date;
  v_due_date date;
  v_month_offset integer;
begin
  -- Get company details
  select * into v_company from public.companies where id = p_company_id;
  
  if not found then
    raise exception 'Company not found';
  end if;
  
  -- Loop through templates
  for v_template in 
    select * from public.task_templates 
    where is_active = true
    and (
      (applies_to_tva_payers = false or v_company.is_tva_payer = true)
      and (applies_to_employers = false or v_company.has_employees = true)
      and (applies_to_org_types is null or v_company.organization_type = any(applies_to_org_types))
    )
  loop
    -- Generate tasks based on frequency
    if v_template.frequency = 'monthly' then
      for v_month_offset in 0..p_months_ahead-1 loop
        v_due_date := (p_start_date + (v_month_offset || ' months')::interval)::date;
        v_due_date := date_trunc('month', v_due_date)::date + (v_template.deadline_day - 1);
        
        insert into public.tasks (company_id, template_id, title, description, due_date, status)
        values (p_company_id, v_template.id, v_template.name, v_template.description, v_due_date, 'pending')
        on conflict do nothing;
      end loop;
      
    elsif v_template.frequency = 'quarterly' then
      for v_month_offset in 0..(p_months_ahead/3)-1 loop
        v_due_date := (p_start_date + (v_month_offset * 3 || ' months')::interval)::date;
        v_due_date := date_trunc('month', v_due_date)::date + (v_template.deadline_day - 1);
        
        insert into public.tasks (company_id, template_id, title, description, due_date, status)
        values (p_company_id, v_template.id, v_template.name, v_template.description, v_due_date, 'pending')
        on conflict do nothing;
      end loop;
      
    elsif v_template.frequency = 'annual' then
      v_due_date := make_date(extract(year from p_start_date)::integer, v_template.deadline_month, v_template.deadline_day);
      if v_due_date < p_start_date then
        v_due_date := v_due_date + interval '1 year';
      end if;
      
      insert into public.tasks (company_id, template_id, title, description, due_date, status)
      values (p_company_id, v_template.id, v_template.name, v_template.description, v_due_date, 'pending')
      on conflict do nothing;
    end if;
  end loop;
end;
$$;

-- Function to update task status based on due date
create or replace function public.update_task_statuses()
returns void
language plpgsql
security definer
as $$
begin
  update public.tasks
  set status = 'overdue'
  where status = 'pending'
  and due_date < current_date;
end;
$$;
