alter table public.task_template_overrides
  add column if not exists custom_deadline_day integer,
  add column if not exists custom_deadline_month integer;

alter table public.task_template_overrides
  add constraint check_custom_deadline_day 
    check (custom_deadline_day is null or (custom_deadline_day >= 1 and custom_deadline_day <= 31));

alter table public.task_template_overrides
  add constraint check_custom_deadline_month 
    check (custom_deadline_month is null or (custom_deadline_month >= 1 and custom_deadline_month <= 12));

comment on column public.task_template_overrides.custom_deadline_day is 'Custom deadline day override for this template and company. If set, overrides template deadline_day.';
comment on column public.task_template_overrides.custom_deadline_month is 'Custom deadline month override for this template and company. If set, overrides template deadline_month.';

