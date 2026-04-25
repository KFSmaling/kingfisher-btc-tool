-- ============================================================
-- Sprint B: Inzichten UI — label.analysis.* keys (Issue #68)
--
-- Voegt UI-labels toe voor de Inzichten-overlay. Idempotent via
-- ON CONFLICT DO NOTHING. Bestaande waarden worden niet overschreven
-- (tenant-overrides blijven intact).
-- ============================================================

INSERT INTO app_config (key, value, category, description)
VALUES
  ('label.analysis.title',                 'Inzichten',                                                                           'label', 'Inzichten-overlay — primaire naam'),
  ('label.analysis.subtitle',              'Strategische Analyse',                                                                 'label', 'Inzichten-overlay — ondertitel (werkblad-specifiek)'),
  ('label.analysis.chapter.onderdelen',    'Onderdelen',                                                                           'label', 'Inzichten-overlay — hoofdstuk Onderdelen'),
  ('label.analysis.chapter.dwarsverbanden','Dwarsverbanden',                                                                       'label', 'Inzichten-overlay — hoofdstuk Dwarsverbanden'),
  ('label.analysis.type.ontbreekt',        'Ontbreekt',                                                                            'label', 'Inzichten-type — ontbrekend element'),
  ('label.analysis.type.zwak',             'Zwak punt',                                                                            'label', 'Inzichten-type — aanwezig maar onvoldoende'),
  ('label.analysis.type.kans',             'Kans',                                                                                 'label', 'Inzichten-type — positieve samenhang'),
  ('label.analysis.type.sterk',            'Sterkte',                                                                              'label', 'Inzichten-type — uitzonderlijk goed element'),
  ('label.analysis.empty',                 'Nog geen analyse. Klik ''Analyseer strategie'' in het werkblad.',                      'label', 'Inzichten-overlay — lege staat'),
  ('label.analysis.loading',               'AI analyseert uw strategie…',                                                          'label', 'Inzichten-overlay — laden'),
  ('label.analysis.filter.label',          'Toon:',                                                                                'label', 'Inzichten-overlay — filter-label'),
  ('label.analysis.sourceref.header',      'Verwijst naar',                                                                        'label', 'Inzichten-overlay — bronnen voetregel')
ON CONFLICT (key) DO NOTHING;

-- Verificatie
SELECT key, value FROM app_config WHERE key LIKE 'label.analysis.%' ORDER BY key;
