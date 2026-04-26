-- ============================================================
-- Sprint B Rebuild: Inzichten — compliance-fixes labels (Issue #68)
--
-- Voegt 2 ontbrekende label-keys toe die bij de compliance-review
-- zijn geïdentificeerd als hardcoded strings in de UI.
-- Idempotent via ON CONFLICT DO NOTHING.
-- ============================================================

INSERT INTO app_config (key, value, category, description)
VALUES
  -- Werkblad-naam (gebruikt als document-titel in Inzichten-overlay)
  ('label.werkblad.strategie.title',   'Strategie',                                                      'label', 'Inzichten-overlay — document-h1 werkblad-naam (via worksheetName prop)'),
  -- Filter — lege staat na filteren
  ('label.analysis.empty.filtered',    'Geen bevindingen zichtbaar met de huidige filters.',              'label', 'Inzichten-overlay — bericht als geen insights voldoen aan actieve type-filters')
ON CONFLICT (key) DO NOTHING;

-- Verificatie
SELECT key, value FROM app_config WHERE key IN (
  'label.werkblad.strategie.title',
  'label.analysis.empty.filtered'
) ORDER BY key;
