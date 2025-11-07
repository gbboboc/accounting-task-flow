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
  v_is_disabled boolean;
  v_override record;
  v_effective_deadline_day integer;
  v_effective_deadline_month integer;
begin
  select * into v_company from public.companies where id = p_company_id;
  
  if not found then
    raise exception 'Company not found: %', p_company_id;
  end if;
  
  for v_template in 
    select * from public.task_templates 
    where is_active = true
    order by frequency, deadline_day
  loop
    begin
      select * into v_override
      from public.task_template_overrides
      where company_id = p_company_id 
        and template_id = v_template.id;
      
      if found and v_override.is_disabled then
        v_tasks_skipped := v_tasks_skipped + 1;
        continue;
      end if;

      if found and v_override.custom_deadline_day is not null then
        v_effective_deadline_day := v_override.custom_deadline_day;
      else
        v_effective_deadline_day := v_template.deadline_day;
      end if;
      
      if found and v_override.custom_deadline_month is not null then
        v_effective_deadline_month := v_override.custom_deadline_month;
      else
        v_effective_deadline_month := v_template.deadline_month;
      end if;
      
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
          v_due_date := public.calculate_deadline_date(v_due_date, v_effective_deadline_day);
          
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
        for v_quarter_offset in 0..(p_months_ahead / 3) loop
          v_due_date := date_trunc('quarter', p_start_date)::date + (v_quarter_offset || ' quarters')::interval;
          v_due_date := public.calculate_deadline_date(v_due_date, v_effective_deadline_day);
          
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
        for v_month_offset in 0..(p_months_ahead / 12) loop
          if v_effective_deadline_month is not null then
            v_due_date := make_date(
              extract(year from p_start_date)::integer + v_month_offset,
              v_effective_deadline_month,
              v_effective_deadline_day
            );
          else
            v_due_date := date_trunc('year', p_start_date)::date + (v_month_offset || ' years')::interval;
            v_due_date := public.calculate_deadline_date(v_due_date, v_effective_deadline_day);
          end if;
          
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
              and date_trunc('year', t.due_date) = date_trunc('year', v_due_date);
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
        
      elsif v_template.frequency = 'weekly' then
        for v_month_offset in 0..(p_months_ahead * 4) loop
          v_due_date := p_start_date + (v_month_offset || ' weeks')::interval;
          v_due_date := public.calculate_deadline_date(v_due_date, v_effective_deadline_day);
          
          if v_due_date < p_start_date then
            continue;
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
            'pending',
            array[]::uuid[]
          )
          on conflict do nothing
          returning id into v_task_id;
          
          if v_task_id is not null then
            v_tasks_created := v_tasks_created + 1;
          end if;
        end loop;
      end if;
      
    exception
      when others then
        v_errors := array_append(v_errors, format('Template %s: %s', v_template.name, SQLERRM));
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

