-- Clear existing templates (for re-running script)
truncate table public.task_templates cascade;

-- MONTHLY DECLARATIONS
-- TVA (VAT) Monthly
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Declarație TVA Lunară',
  'TVA20',
  'Declarația privind taxa pe valoarea adăugată - regim lunar',
  'monthly',
  25,
  null,
  true,
  false,
  array['SRL', 'ÎI', 'ÎP']::text[],
  '{}'::jsonb,
  array[]::uuid[], 
  'Codul Fiscal art. 115-120',
  '2024-01-01'::timestamptz,
  'Depunere la SFS până la data de 25 inclusiv a lunii următoare perioadei fiscale',
  array[7, 3, 1, 0]::integer[],
  true
);

-- IPC21 - Salary Reports & Withholding Tax
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Raport IPC21 (Salarii)',
  'IPC21',
  'Raportul privind impozitul pe venit și contribuțiile sociale reținute',
  'monthly',
  25,
  null,
  false,
  true, 
  array['SRL', 'ÎI', 'ÎP', 'ONG']::text[],
  '{"nrEmployees": {"greaterThan": 0}}'::jsonb,
  array[]::uuid[],
  'Codul Fiscal art. 88-90',
  '2023-06-15'::timestamptz,
  'Raport obligatoriu pentru toți angajatorii care au plătit salarii',
  array[7, 3, 1]::integer[],
  true
);

-- CAS - Social Contributions
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Declarație CAS',
  'CAS',
  'Declarația nominală privind calculul și achitarea contribuțiilor de asigurări sociale de stat',
  'monthly',
  25,
  null,
  false,
  true,
  array['SRL', 'ÎI', 'ÎP']::text[],
  '{"nrEmployees": {"greaterThan": 0}}'::jsonb,
  array[]::uuid[],
  'Legea nr. 489/1999',
  '2023-12-01'::timestamptz,
  'Depunere lunară pentru toți angajatorii',
  array[7, 3, 1]::integer[],
  true
);

-- CASS - Medical Insurance (separate from CAS!)
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Declarație CASS',
  'CASS',
  'Declarația privind contribuțiile de asigurare obligatorie de asistență medicală',
  'monthly',
  25,
  null,
  false,
  true,
  array['SRL', 'ÎI', 'ÎP', 'ONG']::text[],
  '{"nrEmployees": {"greaterThan": 0}}'::jsonb,
  array[]::uuid[],
  'Legea nr. 1585/1998',
  '2024-03-01'::timestamptz,
  'Contribuții medicale obligatorii pentru angajați și asociați',
  array[7, 3, 1]::integer[],
  true
);

-- Cash Register (Monthly Review)
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Verificare Registru Casă',
  'CASA',
  'Verificarea și reconcilierea registrului de casă lunar',
  'monthly',
  28, 
  null,
  false,
  false,
  array['SRL', 'ÎI', 'ÎP']::text[],
  '{}'::jsonb,
  array[]::uuid[],
  'Legea Contabilității nr. 113/2007',
  '2023-01-01'::timestamptz,
  'Verificare internă, nu se depune la SFS',
  array[3, 0]::integer[],
  true
);

-- QUARTERLY DECLARATIONS

-- TVA Quarterly (for quarterly payers)
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Declarație TVA Trimestrială',
  'TVA20T',
  'Declarația privind taxa pe valoarea adăugată - regim trimestrial',
  'quarterly',
  25,
  null,
  true,
  false,
  array['SRL', 'ÎI', 'ÎP']::text[],
  '{}'::jsonb, -- Applies to quarterly TVA payers
  array[]::uuid[],
  'Codul Fiscal art. 115-120',
  '2024-01-01'::timestamptz,
  'Pentru plătitori TVA în regim trimestrial',
  array[14, 7, 3]::integer[],
  true
);

-- CET - Estimated Quarterly Tax
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Declarație CET',
  'CET',
  'Calculul estimativ trimestrial al impozitului pe venit',
  'quarterly',
  25,
  null,
  false,
  false,
  array['SRL']::text[],
  '{}'::jsonb,
  array[]::uuid[],
  'Codul Fiscal art. 51',
  '2023-09-01'::timestamptz,
  'Plată anticipată trimestrială a impozitului pe venit pentru SRL-uri',
  array[14, 7, 3]::integer[],
  true
);

-- Quarterly Statistical Report
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Raport Statistic Trimestrial F3',
  'F3',
  'Raportul statistic privind comerțul și serviciile',
  'quarterly',
  30,
  null,
  false,
  false,
  array['SRL', 'ÎI']::text[],
  '{"annualRevenue": {"greaterThan": 1000000}}'::jsonb, 
  array[]::uuid[],
  'BNS - Biroul Național de Statistică',
  '2024-01-15'::timestamptz,
  'Raport obligatoriu pentru companii cu cifră de afaceri > 1M MDL',
  array[14, 7, 3]::integer[],
  true
);
-- ANNUAL DECLARATIONS

-- Annual Balance Sheet
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Bilanț Anual (Situații Financiare)',
  'BILANT',
  'Situațiile financiare anuale - bilanț, profit/pierdere, cash-flow',
  'annual',
  31,
  3, 
  false,
  false,
  array['SRL']::text[],
  '{}'::jsonb,
  array[]::uuid[], 
  'Legea Contabilității nr. 113/2007',
  '2023-06-01'::timestamptz,
  'Depunere la SFS și Camera Înregistrării de Stat până la 31 martie',
  array[30, 14, 7, 3]::integer[],
  true
);

-- Annual Income Tax Declaration
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Declarație Anuală Impozit pe Venit',
  'DAV',
  'Declarația anuală privind impozitul pe venit al persoanelor juridice/fizice',
  'annual',
  31,
  3, 
  false,
  false,
  array['SRL', 'ÎI', 'ÎP']::text[],
  '{}'::jsonb,
  array[]::uuid[],
  'Codul Fiscal art. 51',
  '2024-01-01'::timestamptz,
  'Declarație anuală obligatorie pentru toate tipurile de organizații',
  array[30, 14, 7, 3]::integer[],
  true
);

-- Annual Employee Report
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Raport Anual Privind Angajații',
  'RAA',
  'Raportul anual privind numărul și structura angajaților',
  'annual',
  31,
  3, 
  false,
  true,
  array['SRL', 'ÎI', 'ÎP', 'ONG']::text[],
  '{"nrEmployees": {"greaterThan": 0}}'::jsonb,
  array[]::uuid[],
  'BNS - Raportare statistică',
  '2023-11-01'::timestamptz,
  'Raport obligatoriu pentru toți angajatorii, depus concomitent cu bilanțul',
  array[30, 14, 7]::integer[],
  true
);

-- Annual Inventory
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Inventariere Anuală',
  'INV',
  'Inventarierea anuală a mijloacelor fixe, stocurilor și disponibilităților',
  'annual',
  31,
  12, 
  false,
  false,
  array['SRL', 'ÎI']::text[],
  '{}'::jsonb,
  array[]::uuid[],
  'Legea Contabilității nr. 113/2007, art. 23',
  '2023-01-01'::timestamptz,
  'Inventariere obligatorie la sfârșitul anului fiscal, înainte de întocmirea bilanțului',
  array[30, 14, 7]::integer[],
  true
);

-- Simplified Annual Declaration (for microenterprises)
insert into public.task_templates (
  name,
  code,
  description,
  frequency,
  deadline_day,
  deadline_month,
  applies_to_tva_payers,
  applies_to_employers,
  applies_to_org_types,
  exceptions,
  depends_on,
  law_reference,
  last_modified_law,
  notes,
  reminder_days,
  is_active
) values (
  'Declarație Unică Simplificată',
  'DUS',
  'Declarație simplificată pentru microîntreprinderi (impozit 4%)',
  'annual',
  31,
  3, 
  false,
  false,
  array['SRL', 'ÎI']::text[],
  '{"annualRevenue": {"lessThan": 9000000}}'::jsonb,
  array[]::uuid[],
  'Codul Fiscal art. 51¹',
  '2024-07-01'::timestamptz,
  'Pentru microîntreprinderi care aplică impozit simplificat de 4%',
  array[30, 14, 7, 3]::integer[],
  true
);

-- Add comments for documentation
comment on table public.task_templates is 'Template definitions for automatically generating accounting tasks based on company parameters';