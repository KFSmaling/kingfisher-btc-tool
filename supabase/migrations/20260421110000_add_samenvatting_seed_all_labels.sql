-- ── Sprint 9: samenvatting veld + alle ontbrekende labels seeden ─────────────
--
-- 1. Voegt 'samenvatting' kolom toe aan strategy_core
--    (2-zinnen strategische samenvatting, zichtbaar op canvas + in richtlijnen werkblad)
-- 2. Seed ALLE app_config labels die in LABEL_FALLBACKS staan maar nog niet in DB zitten
--    (vorige migratie 090000 is mogelijk niet goed doorgekomen; ON CONFLICT DO NOTHING is veilig)

-- ── 1. Samenvatting kolom ─────────────────────────────────────────────────────
ALTER TABLE strategy_core
  ADD COLUMN IF NOT EXISTS samenvatting text;

-- ── 2. Seed alle labels ───────────────────────────────────────────────────────
INSERT INTO app_config (key, category, description, value) VALUES

  -- Applicatie (header + footer)
  ('label.app.title',    'label', 'App-titel in de header',    'Business Transformation Canvas'),
  ('label.app.subtitle', 'label', 'App-subtitel in de header', 'From strategy to execution'),
  ('label.footer.tagline','label','Voettekst onderaan het canvas','Kingfisher & Partners · From strategy to execution'),

  -- Werkblad namen
  ('label.werkblad.strategie',   'label', 'Naam van het Strategie Werkblad',   'Strategie Werkblad'),
  ('label.werkblad.richtlijnen', 'label', 'Naam van het Richtlijnen Werkblad', 'Richtlijnen & Leidende Principes'),

  -- Strategie Werkblad — sectiekoppen
  ('label.strat.section.identiteit', 'label', 'Sectienaam Identiteit (h3)',      'Identiteit'),
  ('label.strat.section.analyse',    'label', 'Sectienaam Analyse (h3)',          'Analyse'),
  ('label.strat.section.executie',   'label', 'Sectienaam Executie (h3)',         'Executie — 7·3·3 Regel'),

  -- Strategie Werkblad — veldnamen
  ('label.strat.field.missie',         'label', 'Veldnaam Missie',                                     'Missie'),
  ('label.strat.field.visie',          'label', 'Veldnaam Visie',                                      'Visie'),
  ('label.strat.field.ambitie',        'label', 'Veldnaam Ambitie (BHAG)',                             'Ambitie (BHAG)'),
  ('label.strat.field.kernwaarden',    'label', 'Veldnaam Kernwaarden',                                'Kernwaarden'),
  ('label.strat.field.samenvatting',   'label', 'Veldnaam Strategische Samenvatting (max 2 zinnen)',   'Strategische Samenvatting'),
  ('label.strat.field.extern',         'label', 'Kolomnaam Externe analyse',                           'Externe Ontwikkelingen'),
  ('label.strat.field.intern',         'label', 'Kolomnaam Interne analyse',                           'Interne Ontwikkelingen'),

  -- Richtlijnen Werkblad — segment namen + subtitels
  ('label.richtl.segment.generiek',        'label', 'Segment naam Generiek',         'Generiek'),
  ('label.richtl.segment.generiek.sub',    'label', 'Segment subtitel Generiek',     'Strategie & Governance'),
  ('label.richtl.segment.klanten',         'label', 'Segment naam Klanten',          'Klanten'),
  ('label.richtl.segment.klanten.sub',     'label', 'Segment subtitel Klanten',      'Markt & Dienstverlening'),
  ('label.richtl.segment.organisatie',     'label', 'Segment naam Organisatie',      'Organisatie'),
  ('label.richtl.segment.organisatie.sub', 'label', 'Segment subtitel Organisatie',  'Mens & Proces'),
  ('label.richtl.segment.it',              'label', 'Segment naam IT',               'IT'),
  ('label.richtl.segment.it.sub',          'label', 'Segment subtitel IT',           'Technologie & Data')

ON CONFLICT (key) DO NOTHING;
