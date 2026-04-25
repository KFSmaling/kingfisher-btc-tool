-- ============================================================
-- Sprint B Rebuild: Inzichten UI — nieuwe label.analysis.* keys (Issue #68)
--
-- Voegt 13 UI-labels toe voor de herbouwde document-layout overlay.
-- Idempotent via ON CONFLICT DO NOTHING.
-- Bestaande waarden worden niet overschreven (tenant-overrides intact).
--
-- Eerder toegevoegd (20260425020000): title, subtitle, chapter.onderdelen,
-- chapter.dwarsverbanden, type.*, empty, loading, filter.label, sourceref.header
-- ============================================================

INSERT INTO app_config (key, value, category, description)
VALUES
  -- Document-header
  ('label.analysis.kicker',                    'Inzichten',                                                                                                                                        'label', 'Inzichten-overlay — eyebrow boven document-h1'),
  -- TOC
  ('label.analysis.toc.label',                 'Inhoud',                                                                                                                                           'label', 'Inzichten-overlay — label bovenaan TOC'),
  -- Filter
  ('label.analysis.filter.type',               'Filter type',                                                                                                                                      'label', 'Inzichten-overlay — filter-label (vervangt filter.label functioneel)'),
  -- Hoofdstuk kickers
  ('label.analysis.chapter.number.onderdelen',     'Hoofdstuk 1',                                                                                                                                  'label', 'Inzichten-overlay — kicker boven h2 Onderdelen'),
  ('label.analysis.chapter.number.dwarsverbanden', 'Hoofdstuk 2',                                                                                                                                  'label', 'Inzichten-overlay — kicker boven h2 Dwarsverbanden'),
  -- Hoofdstuk intro-teksten
  ('label.analysis.chapter.intro.onderdelen',      'Observaties over losse elementen van de strategie: wat ontbreekt, wat is zwak, waar liggen kansen, waar zit kracht.',                          'label', 'Inzichten-overlay — intro-paragraaf onder Onderdelen-h2'),
  ('label.analysis.chapter.intro.dwarsverbanden',  'Observaties over samenhang: overlap tussen thema''s, consistentie tussen visie en ambitie, en verbanden met andere werkbladen van het canvas.','label', 'Inzichten-overlay — intro-paragraaf onder Dwarsverbanden-h2'),
  -- Bevinding-secties (InzichtItem)
  ('label.analysis.section.observation',       'Observatie',                                                                                                                                       'label', 'Inzichten-overlay — kicker-label boven observatie-tekst'),
  ('label.analysis.section.recommendation',    'Aanbeveling',                                                                                                                                      'label', 'Inzichten-overlay — kicker-label boven aanbeveling-tekst'),
  ('label.analysis.section.references',        'Verwijst naar',                                                                                                                                    'label', 'Inzichten-overlay — label boven bron-links (vervangt sourceref.header)'),
  -- Meta-regel
  ('label.analysis.meta.canvas',               'Canvas:',                                                                                                                                          'label', 'Inzichten-overlay — meta-regel prefix canvasnaam'),
  ('label.analysis.meta.generated',            'Gegenereerd',                                                                                                                                      'label', 'Inzichten-overlay — meta-regel gegenereerd-prefix'),
  ('label.analysis.meta.findings',             'bevindingen',                                                                                                                                      'label', 'Inzichten-overlay — meta-regel bevindingen-suffix (getal wordt prepend door code)')
ON CONFLICT (key) DO NOTHING;

-- Verificatie
SELECT key, value FROM app_config WHERE key LIKE 'label.analysis.%' ORDER BY key;
