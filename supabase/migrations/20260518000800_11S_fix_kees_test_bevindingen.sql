-- 11.S-fix — Kees-test-bevindingen consolidatie.
-- Bevatten: Bev 10 (rapportage-titel UPDATE), Bev 2/3/4 (analyse-loading + carried-over),
-- Bev 8 (tips tab 2 + 3 + sectie-specifieke labels).

-- Bev 10: Kees-feedback "Wat wil je delen met de klant?" → "Kies rapportage"
UPDATE app_config
SET value = 'Kies rapportage'
WHERE key = 'label.rapportage.menu.header' AND tenant_id IS NULL;

-- Bev 11: terug-knop "← terug naar Rapportage" → "Terug naar werkblad" (geen
-- RapportageMenu-tussenstop meer; één pijl niet twee)
UPDATE app_config
SET value = 'Terug naar werkblad'
WHERE key = 'label.onepager.builder.header.back' AND tenant_id IS NULL;

-- Bev 2/3/4: nieuwe analysis-loading/overload/carried-over labels
INSERT INTO app_config (key, category, description, value, tenant_id, tenant_overridable) VALUES
  ('label.strategie.analyse.overload',        'label', '11.S-fix Bev 3: AI-overload user-friendly fallback', 'AI is momenteel overbelast — probeer over 1 minuut opnieuw.', NULL, false),
  ('label.analysis.loading.collecting',       'label', '11.S-fix Bev 4: loading-fase 1', 'Inputs verzamelen…', NULL, false),
  ('label.analysis.loading.ai_running',       'label', '11.S-fix Bev 4: loading-fase 2 (lang)', 'AI analyseert uw strategie… (dit duurt 20-40 seconden)', NULL, false),
  ('label.analysis.loading.merging',          'label', '11.S-fix Bev 4: loading-fase 3 (merge)', 'Resultaten samenvoegen…', NULL, false),
  ('label.analysis.label.carried_over',       'label', '11.S-fix Bev 2: badge bij behouden insight', 'behouden uit vorige analyse', NULL, false),
  ('label.analysis.label.carried_over.tooltip','label', '11.S-fix Bev 2: tooltip carried-over badge', 'Behouden uit vorige analyse — gemarkeerd als ''in rapport'' of door consultant bewerkt', NULL, false)
ON CONFLICT (tenant_id, key) DO NOTHING;

-- Bev 8: tips-toelichting tab 2 (Analyse · SWOT) + tab 3 (Executie · 7·3·3)
-- + sectie-specifieke labels. Lege waarden — consultant vult via admin UI per tenant.
INSERT INTO app_config (key, category, description, value, tenant_id, tenant_overridable) VALUES
  ('label.strat.field.analyse',                   'label', '11.S-fix Bev 8: sectie-titel Analyse · SWOT (tab 2)', 'Analyse · SWOT', NULL, false),
  ('label.strat.field.themas',                    'label', '11.S-fix Bev 8: sectie-titel Strategische thema''s', 'Strategische thema''s', NULL, false),
  ('label.strat.field.ksf_kpi',                   'label', '11.S-fix Bev 8: sectie-titel KSF & KPI', 'KSF & KPI', NULL, false),
  ('label.tips.strategie.analyse.uitgebreid',     'label', '11.S-fix Bev 8: tips Analyse-tab intro', '', NULL, true),
  ('label.tips.strategie.analyse.voorbeeld',      'label', '11.S-fix Bev 8: tips Analyse-tab voorbeeld', '', NULL, true),
  ('label.tips.strategie.executie.uitgebreid',    'label', '11.S-fix Bev 8: tips Executie-tab intro', '', NULL, true),
  ('label.tips.strategie.executie.voorbeeld',     'label', '11.S-fix Bev 8: tips Executie-tab voorbeeld', '', NULL, true),
  ('label.tips.strategie.extern.uitgebreid',      'label', '11.S-fix Bev 8: tips Externe ontwikkelingen', '', NULL, true),
  ('label.tips.strategie.extern.voorbeeld',       'label', '11.S-fix Bev 8: tips Externe ontwikkelingen voorbeeld', '', NULL, true),
  ('label.tips.strategie.intern.uitgebreid',      'label', '11.S-fix Bev 8: tips Interne ontwikkelingen', '', NULL, true),
  ('label.tips.strategie.intern.voorbeeld',       'label', '11.S-fix Bev 8: tips Interne ontwikkelingen voorbeeld', '', NULL, true),
  ('label.tips.strategie.themas.uitgebreid',      'label', '11.S-fix Bev 8: tips Strategische thema''s', '', NULL, true),
  ('label.tips.strategie.themas.voorbeeld',       'label', '11.S-fix Bev 8: tips Strategische thema''s voorbeeld', '', NULL, true),
  ('label.tips.strategie.ksf_kpi.uitgebreid',     'label', '11.S-fix Bev 8: tips KSF & KPI', '', NULL, true),
  ('label.tips.strategie.ksf_kpi.voorbeeld',      'label', '11.S-fix Bev 8: tips KSF & KPI voorbeeld', '', NULL, true)
ON CONFLICT (tenant_id, key) DO NOTHING;
