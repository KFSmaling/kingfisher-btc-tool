-- ============================================================
-- Sprint 4D — App Config tabel
-- Idempotent: veilig opnieuw uit te voeren
-- ============================================================

CREATE TABLE IF NOT EXISTS app_config (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  category    text NOT NULL CHECK (category IN ('prompt', 'label', 'setting')),
  description text,
  updated_at  timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS app_config_updated_at ON app_config;
CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Alleen lezen voor ingelogde users" ON app_config;
CREATE POLICY "Alleen lezen voor ingelogde users"
  ON app_config FOR SELECT TO authenticated USING (true);

INSERT INTO app_config (key, category, description, value) VALUES
  ('label.app.title',              'label',  'Hoofdtitel in header',                  'Business Transformation Canvas'),
  ('label.app.subtitle',           'label',  'Subtitel in header',                    'From strategy to execution'),
  ('label.werkblad.strategie',     'label',  'Titel Strategie Werkblad',              'Strategie Werkblad'),
  ('label.section.extern',         'label',  'Sectienaam externe analyse',            'Externe Marktontwikkelingen'),
  ('label.section.intern',         'label',  'Sectienaam interne analyse',            'Interne Ontwikkelingen'),
  ('label.section.identiteit',     'label',  'Sectienaam identiteit',                 'Identiteit & Positionering'),
  ('label.section.executie',       'label',  'Sectienaam executie',                   'Executie'),
  ('label.section.strategie',      'label',  'Sectienaam strategische koers',         'Strategische Koers'),
  ('setting.autosave.delay_ms',    'setting','Autosave vertraging in milliseconden',  '500')
ON CONFLICT (key) DO NOTHING;
