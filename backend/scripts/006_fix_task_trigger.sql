create or replace function public.check_task_dependencies_bool(task_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  all_completed boolean;
  v_depends_on_tasks uuid[];
begin
  select depends_on_tasks into v_depends_on_tasks
  from public.tasks
  where id = task_id;
  
  if v_depends_on_tasks is null or array_length(v_depends_on_tasks, 1) = 0 then
    return true;
  end if;
  
  select bool_and(status = 'completed')
  into all_completed
  from public.tasks
  where id = any(v_depends_on_tasks);
  
  return coalesce(all_completed, true);
end;
$$;

create or replace function public.update_task_status_on_dependency_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.status = 'completed' and OLD.status != 'completed' then
    update public.tasks
    set status = case
      when public.check_task_dependencies_bool(id) then 'pending'
      else 'blocked'
    end
    where depends_on_tasks is not null
      and depends_on_tasks @> ARRAY[NEW.id]
      and status = 'blocked';
  end if;
  
  return NEW;
end;
$$;

drop trigger if exists trigger_update_dependent_tasks on public.tasks;
create trigger trigger_update_dependent_tasks
  after update of status on public.tasks
  for each row
  execute function public.update_task_status_on_dependency_change();

