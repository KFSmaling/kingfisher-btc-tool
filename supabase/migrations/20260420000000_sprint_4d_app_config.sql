-- ============================================================
-- Sprint 4D — App Config: prompts + UI labels zonder deploy
-- ============================================================

CREATE TABLE IF NOT EXISTS app_config (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  category    text NOT NULL CHECK (category IN ('prompt', 'label', 'setting')),
  description text,
  updated_at  timestamptz DEFAULT now()
);

-- Trigger voor updated_at
CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: ingelogde users mogen lezen, niemand mag schrijven via de app
-- (beheer via Supabase Studio / service role)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alleen lezen voor ingelogde users"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

-- ── Seed: UI labels ──────────────────────────────────────────
INSERT INTO app_config (key, category, description, value) VALUES
  ('label.app.title',              'label',  'Hoofdtitel in header',                      'Business Transformation Canvas'),
  ('label.app.subtitle',           'label',  'Subtitel in header',                        'From strategy to execution'),
  ('label.werkblad.strategie',     'label',  'Titel Strategie Werkblad',                  'Strategie Werkblad'),
  ('label.section.extern',         'label',  'Sectienaam externe analyse',                'Externe Marktontwikkelingen'),
  ('label.section.intern',         'label',  'Sectienaam interne analyse',                'Interne Ontwikkelingen'),
  ('label.section.identiteit',     'label',  'Sectienaam identiteit',                     'Identiteit & Positionering'),
  ('label.section.executie',       'label',  'Sectienaam executie',                       'Executie'),
  ('label.section.strategie',      'label',  'Sectienaam strategische koers',             'Strategische Koers'),
  ('setting.autosave.delay_ms',    'setting','Autosave vertraging in milliseconden',      '500')
ON CONFLICT (key) DO NOTHING;

-- ── Seed: AI prompts ─────────────────────────────────────────
-- (worden gevuld door Sprint 4D code-migratie)
-- Placeholders zodat de keys al bestaan — waarden worden overschreven
INSERT INTO app_config (key, category, description, value) VALUES
  ('prompt.magic.system_standard', 'prompt', 'Magic Staff standaard systeem-prompt',      'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.magic.system_heavy',    'prompt', 'Magic Staff zware syntheseprompt (Sonnet)', 'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.strategy.themes',       'prompt', 'Strategische thema''s genereren',           'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.strategy.ksf_kpi',      'prompt', 'KSF & KPI genereren per thema',             'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.improve.mckinsey',      'prompt', 'Verbeter tekst in McKinsey-stijl',           'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.improve.inspirerender', 'prompt', 'Maak tekst inspirerend en concreet',        'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.improve.beknopter',     'prompt', 'Maak tekst beknopter',                      'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.improve.financieel',    'prompt', 'Voeg financiële onderbouwing toe',          'PLACEHOLDER — wordt gevuld door Sprint 4D'),
  ('prompt.validate',              'prompt', 'Consistentie-validatie prompt',             'PLACEHOLDER — wordt gevuld door Sprint 4D')
ON CONFLICT (key) DO NOTHING;
