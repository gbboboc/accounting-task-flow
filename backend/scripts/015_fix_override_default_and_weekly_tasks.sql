-- Fix is_disabled default from true to false for task_template_overrides
-- This ensures new overrides don't disable templates by default
alter table public.task_template_overrides
  alter column is_disabled set default false;

-- Note: This doesn't change existing records, only affects new inserts
-- Existing records with is_disabled = true will remain as-is

comment on column public.task_template_overrides.is_disabled is 'Whether this template override disables the template for this company. Defaults to false so overrides preserve template active state unless explicitly disabled.';

