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

-- Helper function: Check if company meets template exceptions
create or replace function public.check_template_exceptions(
  p_company_id uuid,
  p_exceptions jsonb
)
returns boolean
language plpgsql
as $$
declare
  v_company record;
  v_exception_key text;
  v_exception_value jsonb;
  v_operator text;
  v_threshold numeric;
begin
  select * into v_company from public.companies where id = p_company_id;
  
  if p_exceptions is null or p_exceptions = '{}'::jsonb then
    return true;
  end if;
  
  for v_exception_key, v_exception_value in select * from jsonb_each(p_exceptions)
  loop
    if v_exception_key = 'annualRevenue' then
      if v_exception_value ? 'lessThan' then
        v_threshold := (v_exception_value->>'lessThan')::numeric;
        if v_company.annual_revenue >= v_threshold then
          return false;
        end if;
      end if;
      
      if v_exception_value ? 'greaterThan' then
        v_threshold := (v_exception_value->>'greaterThan')::numeric;
        if v_company.annual_revenue is null or v_company.annual_revenue <= v_threshold then
          return false;
        end if;
      end if;
    end if;
    
    if v_exception_key = 'nrEmployees' then
      if v_exception_value ? 'equals' then
        v_threshold := (v_exception_value->>'equals')::numeric;
        if v_company.employee_count != v_threshold then
          return false;
        end if;
      end if;
      
      if v_exception_value ? 'greaterThan' then
        v_threshold := (v_exception_value->>'greaterThan')::numeric;
        if v_company.employee_count <= v_threshold then
          return false;
        end if;
      end if;
      
      if v_exception_value ? 'lessThan' then
        v_threshold := (v_exception_value->>'lessThan')::numeric;
        if v_company.employee_count >= v_threshold then
          return false;
        end if;
      end if;
    end if;
  end loop;
  
  return true;
end;
$$;

-- Helper function: Calculate safe deadline date
create or replace function public.calculate_deadline_date(
  p_base_date date,
  p_deadline_day integer
)
returns date
language plpgsql
as $$
declare
  v_last_day_of_month integer;
  v_result_date date;
begin
  v_last_day_of_month := extract(day from (date_trunc('month', p_base_date) + interval '1 month' - interval '1 day')::date);
  
  v_result_date := date_trunc('month', p_base_date)::date + (least(p_deadline_day, v_last_day_of_month) - 1);
  
  return v_result_date;
end;
$$;

-- Main function: Generate tasks for a company
create or replace function public.generate_tasks_for_company(
  p_company_id uuid,
  p_start_date date default current_date,
  p_months_ahead integer default 12
)
returns table(
  tasks_created integer,
  tasks_skipped integer,
  errors text[]
)
language plpgsql
security definer
as $$
declare
  v_company record;
  v_template record;
  v_due_date date;
  v_month_offset integer;
  v_quarter_offset integer;
  v_tasks_created integer := 0;
  v_tasks_skipped integer := 0;
  v_errors text[] := array[]::text[];
  v_task_id uuid;
  v_dependent_task_ids uuid[];
begin
  -- Get company details
  select * into v_company from public.companies where id = p_company_id;
  
  if not found then
    raise exception 'Company not found: %', p_company_id;
  end if;
  
  -- Loop through active templates
  for v_template in 
    select * from public.task_templates 
    where is_active = true
    order by frequency, deadline_day
  loop
    begin
      if v_template.applies_to_tva_payers and not v_company.is_tva_payer then
        continue;
      end if;
      
      if v_template.applies_to_employers and not v_company.has_employees then
        continue;
      end if;
      
      if v_template.applies_to_org_types is not null 
         and not (v_company.organization_type = any(v_template.applies_to_org_types)) then
        continue;
      end if;
      
      if not public.check_template_exceptions(p_company_id, v_template.exceptions) then
        v_tasks_skipped := v_tasks_skipped + 1;
        continue;
      end if;
      
      if v_template.code in ('TVA20') and v_company.tva_type = 'trimestrial' then
        continue; 
      end if;
      
      if v_template.code in ('TVA20T') and v_company.tva_type = 'lunar' then
        continue; 
      end if;
      
      if v_template.frequency = 'monthly' then
        for v_month_offset in 0..p_months_ahead-1 loop
          v_due_date := p_start_date + (v_month_offset || ' months')::interval;
          v_due_date := public.calculate_deadline_date(v_due_date, v_template.deadline_day);
          
          if v_due_date < p_start_date then
            continue;
          end if;
          
          v_dependent_task_ids := array[]::uuid[];
          if array_length(v_template.depends_on, 1) > 0 then
            select array_agg(t.id)
            into v_dependent_task_ids
            from public.tasks t
            where t.company_id = p_company_id
              and t.template_id = any(v_template.depends_on)
              and date_trunc('month', t.due_date) = date_trunc('month', v_due_date);
          end if;
          
          insert into public.tasks (
            company_id, 
            template_id, 
            title, 
            description, 
            due_date, 
            status,
            depends_on_tasks
          )
          values (
            p_company_id, 
            v_template.id, 
            v_template.name, 
            v_template.description, 
            v_due_date, 
            case 
              when array_length(v_dependent_task_ids, 1) > 0 then 'blocked'
              else 'pending'
            end,
            v_dependent_task_ids
          )
          on conflict do nothing
          returning id into v_task_id;
          
          if v_task_id is not null then
            v_tasks_created := v_tasks_created + 1;
          end if;
        end loop;
        
      elsif v_template.frequency = 'quarterly' then
        for v_quarter_offset in 0..(p_months_ahead/3)-1 loop
          v_due_date := date_trunc('quarter', p_start_date)::date + (v_quarter_offset * 3 || ' months')::interval;
          v_due_date := v_due_date + interval '3 months' - interval '1 day'; -- Last day of quarter
          v_due_date := v_due_date + interval '1 month'; -- Move to next month
          v_due_date := public.calculate_deadline_date(v_due_date, v_template.deadline_day);
          
          if v_due_date < p_start_date then
            continue;
          end if;
          
          v_dependent_task_ids := array[]::uuid[];
          if array_length(v_template.depends_on, 1) > 0 then
            select array_agg(t.id)
            into v_dependent_task_ids
            from public.tasks t
            where t.company_id = p_company_id
              and t.template_id = any(v_template.depends_on)
              and date_trunc('quarter', t.due_date) = date_trunc('quarter', v_due_date);
          end if;
          
          insert into public.tasks (
            company_id, 
            template_id, 
            title, 
            description, 
            due_date, 
            status,
            depends_on_tasks
          )
          values (
            p_company_id, 
            v_template.id, 
            v_template.name, 
            v_template.description, 
            v_due_date,
            case 
              when array_length(v_dependent_task_ids, 1) > 0 then 'blocked'
              else 'pending'
            end,
            v_dependent_task_ids
          )
          on conflict do nothing
          returning id into v_task_id;
          
          if v_task_id is not null then
            v_tasks_created := v_tasks_created + 1;
          end if;
        end loop;
        
      elsif v_template.frequency = 'annual' then
        begin
          v_due_date := make_date(
            extract(year from p_start_date)::integer, 
            v_template.deadline_month, 
            v_template.deadline_day
          );
        exception
          when others then
            v_due_date := (date_trunc('month', make_date(
              extract(year from p_start_date)::integer, 
              v_template.deadline_month, 
              1
            )) + interval '1 month' - interval '1 day')::date;
        end;
        
        if v_due_date < p_start_date then
          v_due_date := v_due_date + interval '1 year';
        end if;
        
        v_dependent_task_ids := array[]::uuid[];
        if array_length(v_template.depends_on, 1) > 0 then
          select array_agg(t.id)
          into v_dependent_task_ids
          from public.tasks t
          where t.company_id = p_company_id
            and t.template_id = any(v_template.depends_on)
            and extract(year from t.due_date) = extract(year from v_due_date);
        end if;
        
        insert into public.tasks (
          company_id, 
          template_id, 
          title, 
          description, 
          due_date, 
          status,
          depends_on_tasks
        )
        values (
          p_company_id, 
          v_template.id, 
          v_template.name, 
          v_template.description, 
          v_due_date,
          case 
            when array_length(v_dependent_task_ids, 1) > 0 then 'blocked'
            else 'pending'
          end,
          v_dependent_task_ids
        )
        on conflict do nothing
        returning id into v_task_id;
        
        if v_task_id is not null then
          v_tasks_created := v_tasks_created + 1;
        end if;
      end if;
      
    exception
      when others then
        v_errors := array_append(v_errors, format('Template %s: %s', v_template.name, sqlerrm));
    end;
  end loop;
  
  insert into public.activity_log (user_id, company_id, action, description)
  values (
    v_company.user_id,
    p_company_id,
    'tasks_generated',
    format('Generated %s tasks, skipped %s templates', v_tasks_created, v_tasks_skipped)
  );
  
  return query select v_tasks_created, v_tasks_skipped, v_errors;
end;
$$;

-- Function: Update task statuses
create or replace function public.update_task_statuses()
returns table(
  tasks_marked_overdue integer,
  tasks_unblocked integer
)
language plpgsql
security definer
as $$
declare
  v_overdue_count integer;
  v_unblocked_count integer;
begin
  update public.tasks
  set status = 'overdue'
  where status in ('pending', 'in_progress')  
  and due_date < current_date;
  
  get diagnostics v_overdue_count = row_count;
  
  with completed_tasks as (
    select id from public.tasks where status = 'completed'
  )
  update public.tasks
  set status = 'pending'
  where status = 'blocked'
  and (
    depends_on_tasks is null 
    or depends_on_tasks = array[]::uuid[]
    or depends_on_tasks <@ (select array_agg(id) from completed_tasks) 
  );
  
  get diagnostics v_unblocked_count = row_count;
  
  return query select v_overdue_count, v_unblocked_count;
end;
$$;

-- Function: Check task dependencies status
create or replace function public.check_task_dependencies(p_task_id uuid)
returns table(
  all_completed boolean,
  pending_tasks jsonb
)
language plpgsql
as $$
declare
  v_task record;
  v_all_completed boolean;
  v_pending jsonb;
begin
  select * into v_task from public.tasks where id = p_task_id;
  
  if not found then
    raise exception 'Task not found: %', p_task_id;
  end if;
  
  if v_task.depends_on_tasks is null or array_length(v_task.depends_on_tasks, 1) = 0 then
    return query select true, '[]'::jsonb;
    return;
  end if;
  
  select 
    bool_and(status = 'completed'),
    jsonb_agg(jsonb_build_object(
      'id', id,
      'title', title,
      'status', status,
      'due_date', due_date
    ))
  into v_all_completed, v_pending
  from public.tasks
  where id = any(v_task.depends_on_tasks);
  
  return query select coalesce(v_all_completed, false), coalesce(v_pending, '[]'::jsonb);
end;
$$;

-- Add helpful comments
comment on function public.generate_tasks_for_company(uuid, date, integer) is 
  'Generates tasks for a company based on active templates, checking conditions, exceptions, and dependencies. Returns count of created/skipped tasks and any errors.';

comment on function public.update_task_statuses() is 
  'Updates task statuses: marks overdue tasks and unblocks tasks whose dependencies are completed. Should be run daily via cron.';

comment on function public.check_template_exceptions(uuid, jsonb) is 
  'Checks if a company meets template exception criteria (revenue/employee thresholds). Returns true if company qualifies for the template.';

comment on function public.calculate_deadline_date(date, integer) is 
  'Safely calculates deadline date, handling months with fewer days (e.g., Feb 31 → Feb 28/29).';

comment on function public.check_task_dependencies(uuid) is 
  'Checks if all dependencies for a task are completed. Returns completion status and list of pending dependencies.';
