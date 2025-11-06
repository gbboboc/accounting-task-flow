-- Seed default task templates for Moldovan accounting
insert into public.task_templates (name, description, frequency, deadline_day, deadline_month, applies_to_tva_payers, applies_to_employers, applies_to_org_types) values
  -- Monthly declarations
  ('Declarație TVA', 'Declarația privind taxa pe valoarea adăugată', 'monthly', 25, null, true, false, array['SRL', 'ÎI', 'ÎP']::text[]),
  ('Raport IPC21 (Salarii)', 'Raportul privind impozitul pe venit și contribuțiile sociale', 'monthly', 25, null, false, true, array['SRL', 'ÎI', 'ÎP', 'ONG']::text[]),
  ('Declarație CAS', 'Declarația privind contribuțiile de asigurări sociale', 'monthly', 25, null, false, true, array['SRL', 'ÎI', 'ÎP']::text[]),
  ('Registru Casă', 'Registrul de casă lunar', 'monthly', 20, null, false, false, array['SRL', 'ÎI', 'ÎP']::text[]),
  
  -- Quarterly declarations
  ('Declarație CET', 'Declarația privind calcularea și plata impozitului pe venit', 'quarterly', 25, null, false, false, array['SRL']::text[]),
  ('Raport Statistic Trimestrial', 'Raportul statistic trimestrial', 'quarterly', 30, null, false, false, array['SRL', 'ÎI']::text[]),
  
  -- Annual declarations
  ('Bilanț Anual', 'Situațiile financiare anuale', 'annual', 31, 3, false, false, array['SRL']::text[]),
  ('Declarație Anuală Venit', 'Declarația anuală privind impozitul pe venit', 'annual', 31, 3, false, false, array['SRL', 'ÎI', 'ÎP']::text[]),
  ('Raport Anual Angajați', 'Raportul anual privind angajații', 'annual', 31, 1, false, true, array['SRL', 'ÎI', 'ÎP', 'ONG']::text[]),
  ('Inventariere Anuală', 'Inventarierea anuală a activelor', 'annual', 31, 12, false, false, array['SRL', 'ÎI']::text[])
on conflict do nothing;
