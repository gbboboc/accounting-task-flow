-- Update "Bilanț Anual" to depend on key monthly/quarterly tasks
-- Note: This requires the templates to already exist

do $$
declare
  bilant_id uuid;
  tva_id uuid;
  salarii_id uuid;
  casa_id uuid;
  cass_id uuid;
  cet_id uuid;
begin
  -- Get template IDs
  select id into bilant_id from public.task_templates where code = 'BILANT';
  select id into tva_id from public.task_templates where code = 'TVA20';
  select id into salarii_id from public.task_templates where code = 'IPC21';
  select id into casa_id from public.task_templates where code = 'CAS';
  select id into cass_id from public.task_templates where code = 'CASS';
  select id into cet_id from public.task_templates where code = 'CET';
  
  -- Update Bilanț to depend on key financial tasks
  if bilant_id is not null then
    update public.task_templates
    set depends_on = array[tva_id, cet_id]::uuid[]
    where id = bilant_id;
    
    raise notice 'Updated Bilanț dependencies';
  end if;
  
end $$;